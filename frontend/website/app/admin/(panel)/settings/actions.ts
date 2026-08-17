"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminSession, isAdmin } from "@/lib/admin/auth";
import { writeAuditLog } from "@/lib/admin/auditLog";
import {
  normalizePagesSeo,
  SEO_PAGE_KEYS,
  SEO_PAGE_META,
  type CmsSeo,
  type CurrencySettings,
  type SeoPageKey,
} from "@/lib/cms/types";
import { getCurrencyMeta, normalizeCurrencySettings } from "@/lib/currency";
import { normalizeDeliveryCharges, type DeliveryCharges } from "@/lib/delivery";
import { normalizeChatWidgets, type ChatWidgets } from "@/lib/chatWidgets";
import { normalizePalette, type ThemePalette } from "@/lib/theme/palette";
import {
  getSmtpSettings,
  saveSmtpSettingsRow,
  verifySmtpSettings,
  type SaveSmtpInput,
} from "@/lib/email/smtpSettings";
import {
  saveBkashSettingsRow,
  type SaveBkashInput,
} from "@/lib/payments/bkashSettings";
import {
  courierSettingsReady,
  getCourierSettings,
  saveCourierSettingsRow,
} from "@/lib/couriers/settings";
import { courierAdapter } from "@/lib/couriers/registry";
import type { SaveCourierSettingsInput } from "@/lib/couriers/types";
import {
  getAiSearchApiKey,
  getAiSearchSettings,
  saveAiSearchSettingsRow,
  validateAiSearchApiKey,
  type AiSearchProvider,
} from "@/lib/aiSearchSettings";

export interface SettingsInput {
  store_name: string;
  logo_path: string | null;
  invoice_logo_path: string | null;
  favicon_path: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  currencies: CurrencySettings;
  deliveryCharges: DeliveryCharges;
  chatWidgets: ChatWidgets;
  palette: ThemePalette;
  socials: Record<string, string>;
  google_analytics_id: string | null;
  meta_pixel_id: string | null;
  gtm_id: string | null;
  analytics_enabled: boolean;
  security_enabled: boolean;
  announcement_text: string | null;
  announcement_active: boolean;
  announcement_url: string | null;
  /** @deprecated Prefer pages_seo.home — kept for compatibility. */
  seo: CmsSeo;
  pages_seo: Record<SeoPageKey, CmsSeo>;
}

export async function saveSettings(
  input: SettingsInput,
): Promise<{ error?: string }> {
  const s = await requireAdminSession();
  if (!isAdmin(s.role)) {
    return { error: "You do not have permission to change store settings." };
  }

  if (!input.store_name.trim()) {
    return { error: "Store name is required." };
  }
  const pagesSeo = normalizePagesSeo(input.pages_seo, input.seo);
  for (const key of SEO_PAGE_KEYS) {
    const page = pagesSeo[key];
    if (!page.title.trim() || !page.description.trim()) {
      return {
        error: `SEO title and description are required for ${SEO_PAGE_META[key].label}.`,
      };
    }
    pagesSeo[key] = {
      title: page.title.trim(),
      description: page.description.trim(),
      keywords: page.keywords.trim(),
      og_image_path: page.og_image_path,
    };
  }

  const homeSeo = pagesSeo.home;

  const currencies = normalizeCurrencySettings(input.currencies);
  if (currencies.enabled.length === 0) {
    return { error: "Enable at least one currency." };
  }
  const deliveryCharges = normalizeDeliveryCharges(input.deliveryCharges);
  const chatWidgets = normalizeChatWidgets(input.chatWidgets);
  const defaultMeta = getCurrencyMeta(currencies.default);

  const supabase = await createSupabaseServerClient();

  const { data: current } = await supabase
    .from("site_settings")
    .select("socials")
    .eq("id", 1)
    .maybeSingle();
  const existing = (current?.socials as Record<string, unknown>) ?? {};
  const existingCms =
    existing._cms && typeof existing._cms === "object"
      ? (existing._cms as Record<string, unknown>)
      : {};

  // Always keep a CMS copy so favicon works before the DB column exists.
  const socials: Record<string, unknown> = {
    ...existing,
    ...input.socials,
    _cms: {
      ...existingCms,
      announcement: {
        text: input.announcement_text,
        active: input.announcement_active,
        url: input.announcement_url,
      },
      seo: homeSeo,
      pages_seo: pagesSeo,
      currencies,
      deliveryCharges,
      chatWidgets,
      favicon_path: input.favicon_path,
      palette: normalizePalette(input.palette),
    },
  };
  for (const provider of ["facebook", "instagram", "twitter"]) {
    if (!input.socials[provider]) delete socials[provider];
  }

  const base = {
    store_name: input.store_name.trim(),
    logo_path: input.logo_path,
    invoice_logo_path: input.invoice_logo_path,
    favicon_path: input.favicon_path,
    contact_email: input.contact_email,
    contact_phone: input.contact_phone,
    address: input.address,
    currency: defaultMeta.code,
    currency_symbol: defaultMeta.symbol,
    shipping_flat: deliveryCharges.insideDhaka,
    free_shipping_threshold: null,
    socials,
    google_analytics_id: input.google_analytics_id,
    meta_pixel_id: input.meta_pixel_id,
    gtm_id: input.gtm_id,
    analytics_enabled: input.analytics_enabled,
    security_enabled: input.security_enabled,
    updated_at: new Date().toISOString(),
  };

  const withAnnouncement = {
    ...base,
    announcement_text: input.announcement_text,
    announcement_active: input.announcement_active,
    announcement_url: input.announcement_url,
  };

  let { error } = await supabase
    .from("site_settings")
    .update(withAnnouncement)
    .eq("id", 1);

  if (error) {
    const payload = { ...withAnnouncement } as Record<string, unknown>;
    if (/favicon_path/i.test(error.message)) {
      delete payload.favicon_path;
    }
    if (/invoice_logo_path/i.test(error.message)) {
      delete payload.invoice_logo_path;
    }
    if (/announcement_/i.test(error.message)) {
      delete payload.announcement_text;
      delete payload.announcement_active;
      delete payload.announcement_url;
    }
    ({ error } = await supabase
      .from("site_settings")
      .update(payload)
      .eq("id", 1));
  }

  if (error) {
    const minimal = { ...base } as Record<string, unknown>;
    delete minimal.favicon_path;
    delete minimal.invoice_logo_path;
    const { error: fallbackError } = await supabase
      .from("site_settings")
      .update(minimal)
      .eq("id", 1);
    if (fallbackError) return { error: fallbackError.message };
  }

  await writeAuditLog({
    actor: s,
    action: "update",
    entity: "settings",
    summary: `Updated store settings for "${input.store_name.trim()}"`,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  for (const key of SEO_PAGE_KEYS) {
    const path = SEO_PAGE_META[key].path;
    if (path !== "/") revalidatePath(path);
  }
  return {};
}

export async function saveSmtpSettings(
  input: SaveSmtpInput,
): Promise<{ error?: string }> {
  const s = await requireAdminSession();
  if (!isAdmin(s.role)) {
    return {
      error: "You do not have permission to change notification settings.",
    };
  }

  if (input.enabled) {
    if (!input.username?.trim()) {
      return {
        error: "SMTP username / email is required when email is enabled.",
      };
    }
    if (input.provider === "smtp" && !input.host?.trim()) {
      return { error: "SMTP host is required for custom SMTP." };
    }
  }

  const notifyEmails = input.notifyEmails.map((e) => e.trim()).filter(Boolean);
  for (const email of notifyEmails) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: `Invalid notify email: ${email}` };
    }
  }
  const fromEmail = input.fromEmail?.trim() || null;
  if (fromEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
    return { error: `Invalid sender email: ${fromEmail}` };
  }

  const normalizedInput: SaveSmtpInput = {
    ...input,
    username: input.username?.trim() || null,
    host: input.host?.trim() || null,
    fromEmail,
    fromName: input.fromName.trim() || "Store",
    notifyEmails,
    password: input.password?.trim() ? input.password : null,
  };
  const current = await getSmtpSettings();
  const needsVerification = Boolean(
    normalizedInput.enabled &&
    (!current.enabled ||
      normalizedInput.provider !== current.provider ||
      normalizedInput.host !== current.host ||
      normalizedInput.port !== current.port ||
      normalizedInput.secure !== current.secure ||
      normalizedInput.username !== current.username ||
      normalizedInput.password),
  );
  if (needsVerification) {
    const verification = await verifySmtpSettings(normalizedInput);
    if (verification.error) return verification;
  }

  const res = await saveSmtpSettingsRow(normalizedInput);
  if (res.error) return res;

  await writeAuditLog({
    actor: s,
    action: "update",
    entity: "settings",
    summary: "Updated SMTP / order email notification settings",
    metadata: {
      enabled: input.enabled,
      provider: input.provider,
      username: input.username?.trim() || null,
    },
  });

  revalidatePath("/admin/settings");
  return {};
}

export async function testSmtpSettings(
  input: SaveSmtpInput,
): Promise<{ error?: string }> {
  const s = await requireAdminSession();
  if (!isAdmin(s.role)) {
    return {
      error: "You do not have permission to test notification settings.",
    };
  }
  if (!input.username?.trim()) {
    return { error: "SMTP username / email is required." };
  }
  if (input.provider === "smtp" && !input.host?.trim()) {
    return { error: "SMTP host is required for custom SMTP." };
  }
  return verifySmtpSettings({
    ...input,
    enabled: true,
    username: input.username.trim(),
    host: input.host?.trim() || null,
    password: input.password?.trim() ? input.password : null,
  });
}

export async function saveBkashSettings(
  input: SaveBkashInput,
): Promise<{ error?: string }> {
  const s = await requireAdminSession();
  if (!isAdmin(s.role)) {
    return {
      error: "You do not have permission to change payment settings.",
    };
  }

  if (input.enabled) {
    if (!input.username?.trim()) {
      return { error: "bKash username is required when bKash is enabled." };
    }
    if (!input.appKey?.trim()) {
      return { error: "bKash App Key is required when bKash is enabled." };
    }
  }

  const res = await saveBkashSettingsRow({
    enabled: input.enabled,
    sandbox: input.sandbox,
    username: input.username?.trim() || null,
    password: input.password?.trim() ? input.password : null,
    appKey: input.appKey?.trim() || null,
    appSecret: input.appSecret?.trim() ? input.appSecret : null,
  });
  if (res.error) return res;

  await writeAuditLog({
    actor: s,
    action: "update",
    entity: "settings",
    summary: "Updated bKash payment settings",
    metadata: {
      enabled: input.enabled,
      sandbox: input.sandbox,
      username: input.username?.trim() || null,
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
  return {};
}

export async function connectAiSearchProvider(input: {
  provider: AiSearchProvider;
  apiKey: string;
}): Promise<{ error?: string }> {
  const s = await requireAdminSession();
  if (!isAdmin(s.role)) {
    return {
      error: "You do not have permission to change AI Search settings.",
    };
  }

  const apiKey = input.apiKey.trim();
  if (!apiKey) return { error: "Enter an API key to connect this provider." };

  const validation = await validateAiSearchApiKey(input.provider, apiKey);
  if (validation.error) return validation;

  const result = await saveAiSearchSettingsRow({
    enabled: true,
    provider: input.provider,
    geminiApiKey: input.provider === "gemini" ? apiKey : null,
    openrouterApiKey: input.provider === "openrouter" ? apiKey : null,
    groqApiKey: input.provider === "groq" ? apiKey : null,
    aihubmixApiKey: input.provider === "aihubmix" ? apiKey : null,
  });
  if (result.error) return result;

  await writeAuditLog({
    actor: s,
    action: "update",
    entity: "settings",
    summary: `Connected ${input.provider === "openrouter" ? "OpenRouter" : input.provider === "groq" ? "Groq" : input.provider === "aihubmix" ? "AIHubMix" : "Gemini"} for AI Search`,
    metadata: { enabled: true, provider: input.provider },
  });

  revalidatePath("/admin/settings");
  return {};
}

export async function activateAiSearchProvider(
  provider: AiSearchProvider,
): Promise<{ error?: string }> {
  const s = await requireAdminSession();
  if (!isAdmin(s.role)) {
    return {
      error: "You do not have permission to change AI Search settings.",
    };
  }

  const current = await getAiSearchSettings();
  const apiKey = getAiSearchApiKey({ ...current, provider });
  if (!apiKey) {
    return { error: "Connect this provider before activating it." };
  }

  const result = await saveAiSearchSettingsRow({
    enabled: true,
    provider,
    geminiApiKey: null,
    openrouterApiKey: null,
    groqApiKey: null,
    aihubmixApiKey: null,
  });
  if (result.error) return result;

  const providerName =
    provider === "openrouter"
      ? "OpenRouter"
      : provider === "groq"
        ? "Groq"
        : provider === "aihubmix"
          ? "AIHubMix"
          : "Gemini";
  await writeAuditLog({
    actor: s,
    action: "update",
    entity: "settings",
    summary: `Activated ${providerName} for AI Search`,
    metadata: { enabled: true, provider },
  });

  revalidatePath("/admin/settings");
  return {};
}

export async function disableAiSearch(): Promise<{ error?: string }> {
  const s = await requireAdminSession();
  if (!isAdmin(s.role)) {
    return {
      error: "You do not have permission to change AI Search settings.",
    };
  }

  const current = await getAiSearchSettings();
  const result = await saveAiSearchSettingsRow({
    enabled: false,
    provider: current.provider,
    geminiApiKey: null,
    openrouterApiKey: null,
    groqApiKey: null,
    aihubmixApiKey: null,
  });
  if (result.error) return result;

  await writeAuditLog({
    actor: s,
    action: "update",
    entity: "settings",
    summary: "Disabled AI Search",
    metadata: { enabled: false, provider: current.provider },
  });

  revalidatePath("/admin/settings");
  return {};
}

export async function saveCourierSettings(
  input: SaveCourierSettingsInput,
): Promise<{ error?: string }> {
  const s = await requireAdminSession();
  if (!isAdmin(s.role)) {
    return { error: "You do not have permission to change courier settings." };
  }

  const current = await getCourierSettings();
  const currentActive = Object.values(current).find(
    (provider) => provider.active,
  )?.provider;
  const requestedActive = input.activeProvider
    ? input.providers.find(
        (provider) => provider.provider === input.activeProvider,
      )
    : null;
  const previousActive = input.activeProvider
    ? current[input.activeProvider]
    : null;
  const needsConnectionTest = Boolean(
    input.activeProvider &&
    requestedActive &&
    previousActive &&
    (currentActive !== input.activeProvider ||
      requestedActive.sandbox !== previousActive.sandbox ||
      (requestedActive.clientId?.trim() || null) !== previousActive.client_id ||
      (requestedActive.username?.trim() || null) !== previousActive.username ||
      (requestedActive.apiKey?.trim() || null) !== previousActive.api_key ||
      (requestedActive.pickupStoreId?.trim() || null) !==
        previousActive.pickup_store_id ||
      requestedActive.clientSecret?.trim() ||
      requestedActive.password?.trim() ||
      requestedActive.secretKey?.trim() ||
      requestedActive.accessToken?.trim()),
  );
  const providers = input.providers.map((provider) => ({
    ...provider,
    webhookSecret:
      provider.webhookSecret ||
      current[provider.provider].webhook_secret ||
      randomBytes(24).toString("hex"),
  }));

  if (input.activeProvider && requestedActive && previousActive) {
    const clean = (value: string | null) => value?.trim() || null;
    const selected = {
      ...previousActive,
      active: true,
      sandbox:
        input.activeProvider === "steadfast" ? false : requestedActive.sandbox,
      client_id: clean(requestedActive.clientId),
      client_secret:
        clean(requestedActive.clientSecret) ?? previousActive.client_secret,
      username: clean(requestedActive.username),
      password: clean(requestedActive.password) ?? previousActive.password,
      api_key: clean(requestedActive.apiKey),
      secret_key: clean(requestedActive.secretKey) ?? previousActive.secret_key,
      access_token:
        clean(requestedActive.accessToken) ?? previousActive.access_token,
      pickup_store_id: clean(requestedActive.pickupStoreId),
      webhook_secret:
        clean(requestedActive.webhookSecret) ?? previousActive.webhook_secret,
    };
    if (!courierSettingsReady(selected)) {
      const requirements = {
        pathao:
          "Pathao requires Client ID, Client Secret, username, password, and pickup store ID.",
        steadfast: "Steadfast requires an API key and secret key.",
        redx: "REDX requires an access token and pickup store ID.",
      } as const;
      return { error: requirements[input.activeProvider] };
    }
    if (needsConnectionTest) {
      try {
        await courierAdapter(input.activeProvider).testConnection(selected);
      } catch (error) {
        return {
          error: `Could not activate ${input.activeProvider}: ${error instanceof Error ? error.message : "connection test failed"}`,
        };
      }
    }
  }

  const activated = await saveCourierSettingsRow({
    activeProvider: input.activeProvider,
    providers,
  });
  if (activated.error) return activated;

  await writeAuditLog({
    actor: s,
    action: "update",
    entity: "settings",
    summary: input.activeProvider
      ? `Activated ${input.activeProvider} for new courier shipments`
      : "Disabled courier shipment creation",
    metadata: { activeProvider: input.activeProvider },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/orders");
  return {};
}
