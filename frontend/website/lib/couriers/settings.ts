import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  COURIER_PROVIDERS,
  type CourierProvider,
} from "@/lib/couriers/metadata";
import type {
  CourierProviderSettings,
  CourierProviderSettingsPublic,
  CourierSettingsPublic,
  CourierSettingsRow,
  SaveCourierSettingsInput,
} from "@/lib/couriers/types";

function clean(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function emptyProvider(provider: CourierProvider): CourierProviderSettings {
  return {
    provider,
    active: false,
    sandbox: provider !== "steadfast",
    client_id: null,
    client_secret: null,
    username: null,
    password: null,
    api_key: null,
    secret_key: null,
    access_token: null,
    pickup_store_id: null,
    webhook_secret: null,
    updated_at: new Date(0).toISOString(),
  };
}

function mapRow(row: CourierSettingsRow): CourierProviderSettings {
  return {
    ...emptyProvider(row.provider),
    ...row,
    active: Boolean(row.active),
    sandbox: Boolean(row.sandbox),
    client_id: clean(row.client_id),
    client_secret: clean(row.client_secret),
    username: clean(row.username),
    password: clean(row.password),
    api_key: clean(row.api_key),
    secret_key: clean(row.secret_key),
    access_token: clean(row.access_token),
    pickup_store_id: clean(row.pickup_store_id),
    webhook_secret: clean(row.webhook_secret),
  };
}

export async function getCourierSettings(): Promise<
  Record<CourierProvider, CourierProviderSettings>
> {
  const result = Object.fromEntries(
    COURIER_PROVIDERS.map((provider) => [provider, emptyProvider(provider)]),
  ) as Record<CourierProvider, CourierProviderSettings>;

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.from("courier_settings").select("*");
    if (error) return result;
    for (const raw of (data ?? []) as CourierSettingsRow[]) {
      if (COURIER_PROVIDERS.includes(raw.provider)) {
        result[raw.provider] = mapRow(raw);
      }
    }
  } catch {
    // Migration may not have been applied yet.
  }
  return result;
}

function toPublic(
  settings: CourierProviderSettings,
): CourierProviderSettingsPublic {
  return {
    provider: settings.provider,
    active: settings.active,
    sandbox: settings.sandbox,
    clientId: settings.client_id,
    username: settings.username,
    apiKey: settings.api_key,
    pickupStoreId: settings.pickup_store_id,
    webhookSecret: settings.webhook_secret,
    hasClientSecret: Boolean(settings.client_secret),
    hasPassword: Boolean(settings.password),
    hasSecretKey: Boolean(settings.secret_key),
    hasAccessToken: Boolean(settings.access_token),
    hasWebhookSecret: Boolean(settings.webhook_secret),
  };
}

export async function getCourierSettingsForAdmin(): Promise<CourierSettingsPublic> {
  const providers = await getCourierSettings();
  return {
    activeProvider:
      COURIER_PROVIDERS.find((provider) => providers[provider].active) ?? null,
    providers: Object.fromEntries(
      COURIER_PROVIDERS.map((provider) => [provider, toPublic(providers[provider])]),
    ) as Record<CourierProvider, CourierProviderSettingsPublic>,
  };
}

function keep(next: string | null, current: string | null): string | null {
  return clean(next) ?? current;
}

export async function saveCourierSettingsRow(
  input: SaveCourierSettingsInput,
): Promise<{ error?: string }> {
  const current = await getCourierSettings();

  const settingsPayload = COURIER_PROVIDERS.flatMap((provider) => {
    const next = input.providers.find((item) => item.provider === provider);
    if (!next) return [];
    const existing = current[provider];
    return [{
      provider,
      sandbox: provider === "steadfast" ? false : next.sandbox,
      client_id: clean(next.clientId),
      client_secret: keep(next.clientSecret, existing.client_secret),
      username: clean(next.username),
      password: keep(next.password, existing.password),
      api_key: clean(next.apiKey),
      secret_key: keep(next.secretKey, existing.secret_key),
      access_token: keep(next.accessToken, existing.access_token),
      pickup_store_id: clean(next.pickupStoreId),
      webhook_secret: keep(next.webhookSecret, existing.webhook_secret),
    }];
  });

  const server = await createSupabaseServerClient();
  const { error } = await server.rpc("save_courier_settings", {
    p_settings: settingsPayload,
    p_active_provider: input.activeProvider,
  });
  if (error) {
    if (/courier_settings|schema cache|does not exist|save_courier_settings/i.test(error.message)) {
      return {
        error:
          "Courier settings tables are missing. Apply migration 0017_courier_integrations.sql, then try again.",
      };
    }
    return { error: error.message };
  }
  return {};
}

export function courierSettingsReady(settings: CourierProviderSettings): boolean {
  if (settings.provider === "pathao") {
    return Boolean(
      settings.client_id &&
        settings.client_secret &&
        settings.username &&
        settings.password &&
        settings.pickup_store_id,
    );
  }
  if (settings.provider === "steadfast") {
    return Boolean(settings.api_key && settings.secret_key);
  }
  return Boolean(settings.access_token && settings.pickup_store_id);
}
