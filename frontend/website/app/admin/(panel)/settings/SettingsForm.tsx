"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HardDrive, Loader2, MailCheck, Save } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  ImageUploader,
  type UploadedImage,
} from "@/components/admin/ImageUploader";
import {
  FormActions,
  FormField,
  adminInputClass,
  adminTextareaClass,
} from "@/components/admin/FormField";
import { BUCKETS } from "@/lib/supabase/config";
import type { SiteSettingsRow } from "@/type/db";
import type { CmsSeo, SeoPageKey } from "@/lib/cms/types";
import {
  normalizePagesSeo,
  SEO_PAGE_KEYS,
  SEO_PAGE_META,
} from "@/lib/cms/types";
import {
  SUPPORTED_CURRENCIES,
  normalizeCurrencySettings,
  type CurrencyCode,
  type CurrencySettings,
} from "@/lib/currency";
import {
  DEFAULT_DELIVERY_CHARGES,
  normalizeDeliveryCharges,
  type DeliveryCharges,
} from "@/lib/delivery";
import {
  chatMessengerHref,
  DEFAULT_CHAT_WIDGETS,
  normalizeChatWidgets,
  type ChatProvider,
  type ChatWidgets,
} from "@/lib/chatWidgets";
import {
  DEFAULT_PALETTE,
  PALETTE_FIELDS,
  PALETTE_PRESETS,
  normalizePalette,
  type ThemePalette,
} from "@/lib/theme/palette";
import { cn } from "@/lib/utils";
import type {
  SmtpProvider,
  SmtpSettingsPublic,
} from "@/lib/email/smtpSettings";
import type { BkashSettingsPublic } from "@/lib/payments/bkashSettings";
import type { CourierSettingsPublic } from "@/lib/couriers/types";
import { COURIER_PROVIDERS } from "@/lib/couriers/metadata";
import type { StorageUsage } from "@/lib/admin/storageUsage";
import {
  saveSettings,
  saveSmtpSettings,
  testSmtpSettings,
  saveBkashSettings,
  saveCourierSettings,
  type SettingsInput,
} from "./actions";
import {
  CourierSettings,
  courierDraftFromPublic,
} from "./CourierSettings";

function orNull(v: string): string | null {
  const t = v.trim();
  return t === "" ? null : t;
}

function formatBytes(bytes: number): string {
  if (bytes < 1_000) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1_000;
  let unit = units[0];
  for (let index = 1; value >= 1_000 && index < units.length; index += 1) {
    value /= 1_000;
    unit = units[index];
  }

  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${unit}`;
}

export function SettingsForm({
  settings,
  seo: initialSeo,
  pagesSeo: initialPagesSeo,
  currencies: initialCurrencies,
  deliveryCharges: initialDeliveryCharges,
  chatWidgets: initialChatWidgets,
  palette: initialPalette,
  smtp: initialSmtp,
  bkash: initialBkash,
  courier: initialCourier,
  siteUrl,
  storageUsage,
}: {
  settings: SiteSettingsRow;
  seo?: CmsSeo | null;
  pagesSeo?: Record<SeoPageKey, CmsSeo> | null;
  currencies?: CurrencySettings | null;
  deliveryCharges?: DeliveryCharges | null;
  chatWidgets?: ChatWidgets | null;
  palette?: ThemePalette | null;
  smtp: SmtpSettingsPublic;
  bkash: BkashSettingsPublic;
  courier: CourierSettingsPublic;
  siteUrl: string;
  storageUsage: StorageUsage;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [testingSmtp, startSmtpTest] = useTransition();
  const [mainTab, setMainTab] = useState("store");

  const [storeName, setStoreName] = useState(settings.store_name ?? "");
  const [logo, setLogo] = useState<UploadedImage[]>(
    settings.logo_path ? [{ path: settings.logo_path }] : [],
  );
  const [favicon, setFavicon] = useState<UploadedImage[]>(
    settings.favicon_path ? [{ path: settings.favicon_path }] : [],
  );
  const [contactEmail, setContactEmail] = useState(
    settings.contact_email ?? "",
  );
  const [contactPhone, setContactPhone] = useState(
    settings.contact_phone ?? "",
  );
  const [address, setAddress] = useState(settings.address ?? "");

  const currencyState = normalizeCurrencySettings(
    initialCurrencies ?? {
      enabled: [settings.currency as CurrencyCode].filter(Boolean),
      default: (settings.currency as CurrencyCode) || "BDT",
    },
  );
  const [enabledCurrencies, setEnabledCurrencies] = useState<CurrencyCode[]>(
    currencyState.enabled,
  );
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>(
    currencyState.default,
  );

  const deliveryState = normalizeDeliveryCharges(
    initialDeliveryCharges ?? DEFAULT_DELIVERY_CHARGES,
  );
  const [insideDhakaCharge, setInsideDhakaCharge] = useState(
    String(deliveryState.insideDhaka),
  );
  const [outsideDhakaCharge, setOutsideDhakaCharge] = useState(
    String(deliveryState.outsideDhaka),
  );

  const chatState = normalizeChatWidgets(
    initialChatWidgets ?? DEFAULT_CHAT_WIDGETS,
  );
  const [chatProvider, setChatProvider] = useState<ChatProvider>(
    chatState.provider,
  );
  const [whatsappNumber, setWhatsappNumber] = useState(
    chatState.whatsappNumber,
  );
  const [messengerPageId, setMessengerPageId] = useState(
    chatState.messengerPageId,
  );

  const socials = settings.socials ?? {};
  const [instagram, setInstagram] = useState(socials.instagram ?? "");
  const [twitter, setTwitter] = useState(socials.twitter ?? "");
  const [facebook, setFacebook] = useState(socials.facebook ?? "");

  const [gaId, setGaId] = useState(settings.google_analytics_id ?? "");
  const [pixelId, setPixelId] = useState(settings.meta_pixel_id ?? "");
  const [gtmId, setGtmId] = useState(settings.gtm_id ?? "");
  const [analyticsEnabled, setAnalyticsEnabled] = useState(
    settings.analytics_enabled ?? false,
  );

  const [pagesSeo, setPagesSeo] = useState(() =>
    normalizePagesSeo(initialPagesSeo, initialSeo),
  );
  const [seoPage, setSeoPage] = useState<SeoPageKey>("home");
  const currentSeo = pagesSeo[seoPage];

  const updateCurrentSeo = (patch: Partial<CmsSeo>) => {
    setPagesSeo((prev) => ({
      ...prev,
      [seoPage]: { ...prev[seoPage], ...patch },
    }));
  };

  const [palette, setPalette] = useState<ThemePalette>(() =>
    normalizePalette(initialPalette ?? DEFAULT_PALETTE),
  );

  const [smtpEnabled, setSmtpEnabled] = useState(initialSmtp.enabled);
  const [smtpProvider, setSmtpProvider] = useState<SmtpProvider>(
    initialSmtp.provider,
  );
  const [smtpHost, setSmtpHost] = useState(initialSmtp.host ?? "");
  const [smtpPort, setSmtpPort] = useState(String(initialSmtp.port || 587));
  const [smtpSecure, setSmtpSecure] = useState(initialSmtp.secure);
  const [smtpUsername, setSmtpUsername] = useState(initialSmtp.username ?? "");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpFromName, setSmtpFromName] = useState(
    initialSmtp.fromName || "VE Gear",
  );
  const [smtpFromEmail, setSmtpFromEmail] = useState(
    initialSmtp.fromEmail ?? "",
  );
  const [smtpNotifyEmails, setSmtpNotifyEmails] = useState(
    initialSmtp.notifyEmails.join(", "),
  );
  const [smtpHasPassword] = useState(initialSmtp.hasPassword);

  const [bkashEnabled, setBkashEnabled] = useState(initialBkash.enabled);
  const [bkashSandbox, setBkashSandbox] = useState(initialBkash.sandbox);
  const [bkashUsername, setBkashUsername] = useState(
    initialBkash.username ?? "",
  );
  const [bkashPassword, setBkashPassword] = useState("");
  const [bkashAppKey, setBkashAppKey] = useState(initialBkash.appKey ?? "");
  const [bkashAppSecret, setBkashAppSecret] = useState("");
  const [bkashHasPassword] = useState(initialBkash.hasPassword);
  const [bkashHasAppSecret] = useState(initialBkash.hasAppSecret);
  const [courier, setCourier] = useState(() =>
    courierDraftFromPublic(initialCourier),
  );

  const setPaletteColor = (key: keyof ThemePalette, value: string) => {
    setPalette((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCurrency = (code: CurrencyCode, on: boolean) => {
    setEnabledCurrencies((prev) => {
      const next = on
        ? Array.from(new Set([...prev, code]))
        : prev.filter((c) => c !== code);
      if (!next.length) {
        toast.error("Keep at least one currency enabled.");
        return prev;
      }
      if (!next.includes(defaultCurrency)) {
        setDefaultCurrency(next[0]);
      }
      return next;
    });
  };

  const onSave = () => {
    if (!storeName.trim()) {
      toast.error("Store name is required.");
      return;
    }
    for (const key of SEO_PAGE_KEYS) {
      if (!pagesSeo[key].title.trim() || !pagesSeo[key].description.trim()) {
        toast.error(
          `SEO title and description are required for ${SEO_PAGE_META[key].label}.`,
        );
        setSeoPage(key);
        return;
      }
    }
    if (!enabledCurrencies.length) {
      toast.error("Enable at least one currency.");
      return;
    }

    const nextSocials: Record<string, string> = {};
    if (facebook.trim()) nextSocials.facebook = facebook.trim();
    if (instagram.trim()) nextSocials.instagram = instagram.trim();
    if (twitter.trim()) nextSocials.twitter = twitter.trim();

    const currencies = normalizeCurrencySettings({
      enabled: enabledCurrencies,
      default: defaultCurrency,
    });

    const deliveryCharges = normalizeDeliveryCharges({
      insideDhaka: Number(insideDhakaCharge),
      outsideDhaka: Number(outsideDhakaCharge),
    });

    if (
      !Number.isFinite(Number(insideDhakaCharge)) ||
      Number(insideDhakaCharge) < 0 ||
      !Number.isFinite(Number(outsideDhakaCharge)) ||
      Number(outsideDhakaCharge) < 0
    ) {
      toast.error("Delivery charges must be valid numbers (0 or more).");
      return;
    }

    const chatWidgets = normalizeChatWidgets({
      provider: chatProvider,
      whatsappNumber,
      messengerPageId,
    });

    if (chatWidgets.provider === "whatsapp" && !chatWidgets.whatsappNumber) {
      toast.error("Enter a WhatsApp number with country code.");
      return;
    }
    if (
      chatWidgets.provider === "messenger" &&
      !chatMessengerHref(chatWidgets.messengerPageId)
    ) {
      toast.error(
        "Enter your Facebook Page ID or username (e.g. 378400148906020).",
      );
      return;
    }

    const input: SettingsInput = {
      store_name: storeName,
      logo_path: logo[0]?.path ?? null,
      favicon_path: favicon[0]?.path ?? null,
      contact_email: orNull(contactEmail),
      contact_phone: orNull(contactPhone),
      address: orNull(address),
      currencies,
      deliveryCharges,
      chatWidgets,
      palette: normalizePalette(palette),
      socials: nextSocials,
      google_analytics_id: orNull(gaId),
      meta_pixel_id: orNull(pixelId),
      gtm_id: orNull(gtmId),
      analytics_enabled: analyticsEnabled,
      security_enabled: false,
      announcement_text: null,
      announcement_active: false,
      announcement_url: null,
      seo: pagesSeo.home,
      pages_seo: pagesSeo,
    };

    startTransition(async () => {
      const smtpRes = await saveSmtpSettings({
        enabled: smtpEnabled,
        provider: smtpProvider,
        host: orNull(smtpHost),
        port: Number(smtpPort) || 587,
        secure: smtpSecure,
        username: orNull(smtpUsername),
        password: smtpPassword.trim() ? smtpPassword : null,
        fromName: smtpFromName.trim() || "VE Gear",
        fromEmail: orNull(smtpFromEmail),
        notifyEmails: smtpNotifyEmails
          .split(/[,;\n]+/)
          .map((e) => e.trim())
          .filter(Boolean),
      });
      if (smtpRes?.error) {
        toast.error(smtpRes.error);
        return;
      }

      const res = await saveSettings(input);
      if (res?.error) {
        toast.error(res.error);
        return;
      }

      const bkashRes = await saveBkashSettings({
        enabled: bkashEnabled,
        sandbox: bkashSandbox,
        username: orNull(bkashUsername),
        password: bkashPassword.trim() ? bkashPassword : null,
        appKey: orNull(bkashAppKey),
        appSecret: bkashAppSecret.trim() ? bkashAppSecret : null,
      });
      if (bkashRes?.error) {
        toast.error(bkashRes.error);
        return;
      }

      const courierRes = await saveCourierSettings({
        activeProvider: courier.activeProvider,
        providers: COURIER_PROVIDERS.map((provider) => {
          const draft = courier.providers[provider];
          return {
            provider,
            sandbox: draft.sandbox,
            clientId: orNull(draft.clientId),
            clientSecret: orNull(draft.clientSecret),
            username: orNull(draft.username),
            password: orNull(draft.password),
            apiKey: orNull(draft.apiKey),
            secretKey: orNull(draft.secretKey),
            accessToken: orNull(draft.accessToken),
            pickupStoreId: orNull(draft.pickupStoreId),
            webhookSecret: orNull(draft.webhookSecret),
          };
        }),
      });
      if (courierRes?.error) {
        toast.error(courierRes.error);
        return;
      }

      toast.success("Settings saved");
      setSmtpPassword("");
      setBkashPassword("");
      setBkashAppSecret("");
      setCourier((current) => ({
        ...current,
        providers: Object.fromEntries(
          COURIER_PROVIDERS.map((provider) => {
            const draft = current.providers[provider];
            return [
              provider,
              {
                ...draft,
                clientSecret: "",
                password: "",
                secretKey: "",
                accessToken: "",
                hasClientSecret:
                  draft.hasClientSecret || Boolean(draft.clientSecret),
                hasPassword: draft.hasPassword || Boolean(draft.password),
                hasSecretKey: draft.hasSecretKey || Boolean(draft.secretKey),
                hasAccessToken:
                  draft.hasAccessToken || Boolean(draft.accessToken),
              },
            ];
          }),
        ) as typeof current.providers,
      }));
      router.refresh();
    });
  };

  const mainTabListClass =
    "mb-6 flex h-auto w-fit flex-wrap justify-start gap-1 rounded-xl bg-card p-1";
  const subTabListClass =
    "mb-5 flex h-auto w-fit flex-wrap justify-start gap-1 rounded-lg border border-border bg-background/60 p-1";
  const subTabTriggerClass = "rounded-md px-3 py-1.5 text-xs sm:text-sm";
  const storageRemaining = Math.max(
    0,
    storageUsage.quotaBytes - storageUsage.usedBytes,
  );
  const storagePercent =
    storageUsage.quotaBytes > 0
      ? (storageUsage.usedBytes / storageUsage.quotaBytes) * 100
      : 0;
  const storageBarPercent = Math.min(100, Math.max(0, storagePercent));
  const storageBarColor =
    storagePercent >= 90
      ? "bg-destructive"
      : storagePercent >= 75
        ? "bg-amber-500"
        : "bg-primary";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
        <TabsList className={mainTabListClass}>
          <TabsTrigger value="store" className="rounded-lg px-3 sm:px-4">
            Store
          </TabsTrigger>
          <TabsTrigger value="commerce" className="rounded-lg px-3 sm:px-4">
            Commerce
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="rounded-lg px-3 sm:px-4"
          >
            Notifications
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg px-3 sm:px-4">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="seo" className="rounded-lg px-3 sm:px-4">
            SEO
          </TabsTrigger>
          <TabsTrigger value="storage" className="rounded-lg px-3 sm:px-4">
            Storage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="mt-0">
          <Tabs defaultValue="brand" className="w-full">
            <TabsList className={subTabListClass}>
              <TabsTrigger value="brand" className={subTabTriggerClass}>
                Brand
              </TabsTrigger>
              <TabsTrigger value="colors" className={subTabTriggerClass}>
                Colors
              </TabsTrigger>
              <TabsTrigger value="contact" className={subTabTriggerClass}>
                Contact
              </TabsTrigger>
              <TabsTrigger value="social" className={subTabTriggerClass}>
                Social
              </TabsTrigger>
            </TabsList>

            <TabsContent value="brand" className="mt-0 space-y-5">
              <FormField label="Store name">
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="VE Gear"
                  className={adminInputClass}
                />
              </FormField>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
                <FormField label="Logo" className="min-w-0 flex-1">
                  <ImageUploader
                    bucket={BUCKETS.branding}
                    value={logo}
                    onChange={setLogo}
                    label="Drop logo here or click to browse"
                    enableCrop
                    preview="wide"
                  />
                </FormField>
                <FormField
                  label="Favicon"
                  hint="Square tab icon (PNG)."
                  className="shrink-0"
                >
                  <ImageUploader
                    bucket={BUCKETS.branding}
                    value={favicon}
                    onChange={setFavicon}
                    label="Add favicon"
                    enableCrop
                    preview="square"
                  />
                </FormField>
              </div>
            </TabsContent>

            <TabsContent value="colors" className="mt-0 space-y-6">
              <p className="text-sm text-muted-foreground">
                Storefront theme — buttons, backgrounds, text, and borders.
              </p>

              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Presets
                </p>
                <div className="flex flex-wrap gap-2">
                  {PALETTE_PRESETS.map((preset) => {
                    const active =
                      JSON.stringify(normalizePalette(palette)) ===
                      JSON.stringify(preset.palette);
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setPalette({ ...preset.palette })}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                        )}
                      >
                        <span
                          className="size-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: preset.palette.primary }}
                        />
                        {preset.name}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setPalette({ ...DEFAULT_PALETTE })}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  >
                    Reset default
                  </button>
                </div>
              </div>

              <div
                className="overflow-hidden rounded-2xl border border-border"
                style={{
                  background: palette.background,
                  color: palette.foreground,
                  borderColor: palette.border,
                }}
              >
                <div
                  className="border-b px-4 py-3 text-xs uppercase tracking-[0.18em]"
                  style={{
                    borderColor: palette.border,
                    color: palette.mutedForeground,
                  }}
                >
                  Live preview
                </div>
                <div className="space-y-3 p-4">
                  <div
                    className="rounded-xl border p-4"
                    style={{
                      background: palette.card,
                      borderColor: palette.border,
                    }}
                  >
                    <p
                      className="text-sm font-medium"
                      style={{ color: palette.foreground }}
                    >
                      Product card
                    </p>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: palette.mutedForeground }}
                    >
                      Supporting copy uses muted text.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className="rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider"
                        style={{
                          background: palette.primary,
                          color: palette.primaryForeground,
                        }}
                      >
                        Shop now
                      </span>
                      <span
                        className="rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider"
                        style={{
                          borderColor: palette.border,
                          color: palette.foreground,
                          background: palette.surface,
                        }}
                      >
                        View details
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {PALETTE_FIELDS.map((field) => (
                  <FormField
                    key={field.key}
                    label={field.label}
                    hint={field.hint}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={palette[field.key]}
                        onChange={(e) =>
                          setPaletteColor(field.key, e.target.value)
                        }
                        className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-transparent p-1"
                        aria-label={field.label}
                      />
                      <Input
                        value={palette[field.key]}
                        onChange={(e) =>
                          setPaletteColor(field.key, e.target.value)
                        }
                        className={cn(adminInputClass, "font-mono uppercase")}
                        maxLength={7}
                        spellCheck={false}
                      />
                    </div>
                  </FormField>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="contact" className="mt-0 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Email">
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="hello@vegear.com"
                    className={adminInputClass}
                  />
                </FormField>
                <FormField label="Phone">
                  <Input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+880…"
                    className={adminInputClass}
                  />
                </FormField>
              </div>
              <FormField label="Address">
                <Textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, city, country"
                  rows={3}
                  className={adminTextareaClass}
                />
              </FormField>
            </TabsContent>

            <TabsContent value="social" className="mt-0 space-y-5">
              <FormField label="Instagram">
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/…"
                  className={adminInputClass}
                />
              </FormField>
              <FormField label="Twitter / X">
                <Input
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://x.com/…"
                  className={adminInputClass}
                />
              </FormField>
              <FormField label="Facebook">
                <Input
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/…"
                  className={adminInputClass}
                />
              </FormField>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="commerce" className="mt-0">
          <Tabs defaultValue="currency" className="w-full">
            <TabsList className={subTabListClass}>
              <TabsTrigger value="currency" className={subTabTriggerClass}>
                Currency
              </TabsTrigger>
              <TabsTrigger value="delivery" className={subTabTriggerClass}>
                Delivery
              </TabsTrigger>
              <TabsTrigger value="couriers" className={subTabTriggerClass}>
                Couriers
              </TabsTrigger>
              <TabsTrigger value="payments" className={subTabTriggerClass}>
                Payments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="currency" className="mt-0 space-y-5">
              <p className="text-sm text-muted-foreground">
                Enable currencies and pick the store default.
              </p>
              <div className="space-y-3">
                {SUPPORTED_CURRENCIES.map((c) => {
                  const enabled = enabledCurrencies.includes(c.code);
                  const isDefault = defaultCurrency === c.code;
                  return (
                    <div
                      key={c.code}
                      className={cn(
                        "flex flex-col gap-3 rounded-2xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
                        enabled
                          ? "border-border bg-card/60"
                          : "border-border/60 opacity-70",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-full bg-white/5 font-mono text-xs text-muted-foreground">
                          {c.flag}
                        </span>
                        <div>
                          <p className="font-medium text-foreground">
                            {c.code}{" "}
                            <span className="text-muted-foreground">
                              ({c.symbol})
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {c.label}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="radio"
                            name="default-currency"
                            checked={isDefault}
                            disabled={!enabled}
                            onChange={() => setDefaultCurrency(c.code)}
                            className="accent-primary"
                          />
                          Default
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-wider text-muted-foreground">
                            {enabled ? "On" : "Off"}
                          </span>
                          <Switch
                            checked={enabled}
                            onCheckedChange={(on) => toggleCurrency(c.code, on)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Active default:{" "}
                <span className="text-foreground">
                  {defaultCurrency} ·{" "}
                  {SUPPORTED_CURRENCIES.find((c) => c.code === defaultCurrency)
                    ?.symbol ?? ""}
                </span>
              </p>
            </TabsContent>

            <TabsContent value="delivery" className="mt-0 space-y-5">
              <p className="text-sm text-muted-foreground">
                COD charge per order — Inside / Outside Dhaka at checkout.
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="Inside Dhaka"
                  hint="Default 70 — applies to Dhaka city orders."
                >
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={insideDhakaCharge}
                    onChange={(e) => setInsideDhakaCharge(e.target.value)}
                    className={adminInputClass}
                  />
                </FormField>
                <FormField
                  label="Outside Dhaka"
                  hint="Default 120 — applies outside Dhaka."
                >
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={outsideDhakaCharge}
                    onChange={(e) => setOutsideDhakaCharge(e.target.value)}
                    className={adminInputClass}
                  />
                </FormField>
              </div>
              <p className="text-xs text-muted-foreground">
                Amounts use your store currency (
                <span className="text-foreground">{defaultCurrency}</span>
                ).
              </p>
            </TabsContent>

            <TabsContent value="couriers" className="mt-0">
              <CourierSettings
                value={courier}
                onChange={setCourier}
                siteUrl={siteUrl}
              />
            </TabsContent>

            <TabsContent value="payments" className="mt-0 space-y-5">
              <p className="text-sm text-muted-foreground">
                Cash on delivery is always available. Enable bKash Tokenized
                Checkout (mode 0011) when credentials are ready. Store currency
                must be BDT for bKash at checkout.
              </p>

              <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Enable bKash</p>
                  <p className="text-xs text-muted-foreground">
                    Show bKash as a payment option at checkout.
                  </p>
                </div>
                <Switch
                  checked={bkashEnabled}
                  onCheckedChange={setBkashEnabled}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Sandbox mode</p>
                  <p className="text-xs text-muted-foreground">
                    Use bKash sandbox URLs for testing. Turn off for live
                    payments.
                  </p>
                </div>
                <Switch
                  checked={bkashSandbox}
                  onCheckedChange={setBkashSandbox}
                />
              </div>

              {defaultCurrency !== "BDT" ? (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  Default currency is {defaultCurrency}. Switch Commerce →
                  Currency to BDT before offering bKash at checkout.
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Username">
                  <Input
                    value={bkashUsername}
                    onChange={(e) => setBkashUsername(e.target.value)}
                    placeholder="Merchant portal username"
                    className={adminInputClass}
                    autoComplete="off"
                  />
                </FormField>
                <FormField
                  label="Password"
                  hint={
                    bkashHasPassword && !bkashPassword
                      ? "Saved — leave blank to keep current password."
                      : undefined
                  }
                >
                  <Input
                    type="password"
                    value={bkashPassword}
                    onChange={(e) => setBkashPassword(e.target.value)}
                    placeholder={bkashHasPassword ? "••••••••••••" : "Password"}
                    className={adminInputClass}
                    autoComplete="new-password"
                  />
                </FormField>
                <FormField label="App Key">
                  <Input
                    value={bkashAppKey}
                    onChange={(e) => setBkashAppKey(e.target.value)}
                    placeholder="x-app-key"
                    className={adminInputClass}
                    autoComplete="off"
                  />
                </FormField>
                <FormField
                  label="App Secret"
                  hint={
                    bkashHasAppSecret && !bkashAppSecret
                      ? "Saved — leave blank to keep current secret."
                      : undefined
                  }
                >
                  <Input
                    type="password"
                    value={bkashAppSecret}
                    onChange={(e) => setBkashAppSecret(e.target.value)}
                    placeholder={
                      bkashHasAppSecret ? "••••••••••••" : "App secret"
                    }
                    className={adminInputClass}
                    autoComplete="new-password"
                  />
                </FormField>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="notifications" className="mt-0">
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className={subTabListClass}>
              <TabsTrigger value="chat" className={subTabTriggerClass}>
                Chat
              </TabsTrigger>
              <TabsTrigger value="email" className={subTabTriggerClass}>
                Order email
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-0 space-y-5">
              <p className="text-sm text-muted-foreground">
                Storefront chat button — opens Messenger or WhatsApp in a new
                tab.
              </p>

              <div className="space-y-2">
                {(
                  [
                    {
                      value: "none" as const,
                      label: "Off",
                      hint: "Hide chat button",
                    },
                    {
                      value: "messenger" as const,
                      label: "Messenger",
                      hint: "Opens m.me — Messenger app or messenger.com",
                    },
                    {
                      value: "whatsapp" as const,
                      label: "WhatsApp",
                      hint: "Opens WhatsApp — cannot stay on the website",
                    },
                  ] as const
                ).map((option) => {
                  const selected = chatProvider === option.value;
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition",
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card/60 hover:border-primary/40",
                      )}
                    >
                      <input
                        type="radio"
                        name="chat-provider"
                        checked={selected}
                        onChange={() => setChatProvider(option.value)}
                        className="accent-primary"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">
                          {option.label}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {option.hint}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              {chatProvider === "whatsapp" ? (
                <FormField
                  label="WhatsApp number"
                  hint="Country code + number, e.g. 8801712345678. Clicking opens WhatsApp."
                >
                  <Input
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="8801712345678"
                    inputMode="tel"
                    className={adminInputClass}
                  />
                </FormField>
              ) : null}

              {chatProvider === "messenger" ? (
                <FormField
                  label="Facebook Page ID or username"
                  hint="Use your Page ID (e.g. 378400148906020) or username. You can also paste an m.me link."
                >
                  <Input
                    value={messengerPageId}
                    onChange={(e) => setMessengerPageId(e.target.value)}
                    placeholder="378400148906020"
                    className={adminInputClass}
                  />
                </FormField>
              ) : null}
            </TabsContent>

            <TabsContent value="email" className="mt-0 space-y-5">
              <p className="text-sm text-muted-foreground">
                SMTP for customer confirmations and owner alerts. For Gmail, use
                an App Password (not your normal login password).
              </p>

              <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Enable order emails</p>
                  <p className="text-xs text-muted-foreground">
                    Customer confirmation + owner new-order alerts.
                  </p>
                </div>
                <Switch
                  checked={smtpEnabled}
                  onCheckedChange={setSmtpEnabled}
                />
              </div>

              <FormField label="Provider">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: "gmail", label: "Gmail" },
                      { id: "smtp", label: "Custom SMTP" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSmtpProvider(opt.id)}
                      className={cn(
                        "h-9 rounded-full border px-4 text-sm transition",
                        smtpProvider === opt.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-primary/40",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FormField>

              {smtpProvider === "smtp" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="SMTP host" className="sm:col-span-2">
                    <Input
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.example.com"
                      className={adminInputClass}
                    />
                  </FormField>
                  <FormField label="Port">
                    <Input
                      type="number"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      placeholder="587"
                      className={adminInputClass}
                    />
                  </FormField>
                  <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Use TLS (port 465)</p>
                      <p className="text-xs text-muted-foreground">
                        Off for STARTTLS on 587.
                      </p>
                    </div>
                    <Switch
                      checked={smtpSecure}
                      onCheckedChange={setSmtpSecure}
                    />
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Username / email">
                  <Input
                    type="email"
                    value={smtpUsername}
                    onChange={(e) => setSmtpUsername(e.target.value)}
                    placeholder="you@gmail.com"
                    className={adminInputClass}
                    autoComplete="off"
                  />
                </FormField>
                <FormField
                  label="App password"
                  hint={
                    smtpHasPassword && !smtpPassword
                      ? "Saved — leave blank to keep current password."
                      : smtpProvider === "gmail"
                        ? "Google Account → Security → App passwords"
                        : undefined
                  }
                >
                  <Input
                    type="password"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    placeholder={
                      smtpHasPassword ? "••••••••••••" : "App password"
                    }
                    className={adminInputClass}
                    autoComplete="new-password"
                  />
                </FormField>
                <FormField label="From name">
                  <Input
                    value={smtpFromName}
                    onChange={(e) => setSmtpFromName(e.target.value)}
                    placeholder="VE Gear"
                    className={adminInputClass}
                  />
                </FormField>
                <FormField label="From email" hint="Usually same as username.">
                  <Input
                    type="email"
                    value={smtpFromEmail}
                    onChange={(e) => setSmtpFromEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    className={adminInputClass}
                  />
                </FormField>
              </div>

              <FormField
                label="Notify emails"
                hint="Comma-separated. These get CC’d on new order alerts."
              >
                <Textarea
                  value={smtpNotifyEmails}
                  onChange={(e) => setSmtpNotifyEmails(e.target.value)}
                  placeholder="owner@example.com, team@example.com"
                  className={adminTextareaClass}
                  rows={3}
                />
              </FormField>
              <div className="flex flex-col gap-2 rounded-xl border border-border bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Verify mail server login
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Authenticates with the provider without sending an email.
                    Saving also performs this check automatically.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 rounded-full"
                  disabled={testingSmtp || pending || !smtpEnabled}
                  onClick={() =>
                    startSmtpTest(async () => {
                      const result = await testSmtpSettings({
                        enabled: true,
                        provider: smtpProvider,
                        host: orNull(smtpHost),
                        port: Number(smtpPort) || 587,
                        secure: smtpSecure,
                        username: orNull(smtpUsername),
                        password: smtpPassword.trim() ? smtpPassword : null,
                        fromName: smtpFromName.trim() || "VE Gear",
                        fromEmail: orNull(smtpFromEmail),
                        notifyEmails: [],
                      });
                      if (result.error) {
                        toast.error(result.error);
                        return;
                      }
                      toast.success("Mail server authentication succeeded");
                    })
                  }
                >
                  {testingSmtp ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <MailCheck className="size-4" />
                  )}
                  Test connection
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-5">
          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Enable tracking</p>
              <p className="text-xs text-muted-foreground">
                Load analytics scripts on the storefront
              </p>
            </div>
            <Switch
              checked={analyticsEnabled}
              onCheckedChange={setAnalyticsEnabled}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Google Analytics">
              <Input
                value={gaId}
                onChange={(e) => setGaId(e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className={adminInputClass}
              />
            </FormField>
            <FormField label="Meta Pixel">
              <Input
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                placeholder="000000000000000"
                className={adminInputClass}
              />
            </FormField>
            <FormField label="Google Tag Manager">
              <Input
                value={gtmId}
                onChange={(e) => setGtmId(e.target.value)}
                placeholder="GTM-XXXXXX"
                className={adminInputClass}
              />
            </FormField>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Search / social metadata for each storefront page. Pick a page, edit
            its title, description, keywords, and share image, then save.
          </p>
          <FormField label="Page">
            <select
              value={seoPage}
              onChange={(e) => setSeoPage(e.target.value as SeoPageKey)}
              className={adminInputClass}
            >
              {SEO_PAGE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {SEO_PAGE_META[key].label} ({SEO_PAGE_META[key].path})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Meta title" hint="Keep under ~60 characters.">
            <Input
              value={currentSeo.title}
              onChange={(e) => updateCurrentSeo({ title: e.target.value })}
              placeholder={`${SEO_PAGE_META[seoPage].label} | VE Gear`}
              className={adminInputClass}
              maxLength={80}
            />
            <p className="text-right text-[11px] text-muted-foreground">
              {currentSeo.title.length}/80
            </p>
          </FormField>
          <FormField
            label="Meta description"
            hint="Keep under ~160 characters."
          >
            <Textarea
              value={currentSeo.description}
              onChange={(e) =>
                updateCurrentSeo({ description: e.target.value })
              }
              rows={4}
              maxLength={200}
              placeholder="Short description for Google and social shares."
              className={adminTextareaClass}
            />
            <p className="text-right text-[11px] text-muted-foreground">
              {currentSeo.description.length}/200
            </p>
          </FormField>
          <FormField
            label="Keywords"
            hint="Comma-separated phrases (e.g. VE Gear, streetwear, oversized tee)."
          >
            <Textarea
              value={currentSeo.keywords}
              onChange={(e) => updateCurrentSeo({ keywords: e.target.value })}
              rows={3}
              placeholder="VE Gear, streetwear, rider essentials"
              className={adminTextareaClass}
            />
          </FormField>
          <FormField
            label="Open Graph image"
            hint="Shown when sharing on social. Recommended 1200×630."
          >
            <ImageUploader
              bucket={BUCKETS.branding}
              value={
                currentSeo.og_image_path
                  ? [{ path: currentSeo.og_image_path }]
                  : []
              }
              onChange={(images) =>
                updateCurrentSeo({
                  og_image_path: images[0]?.path ?? null,
                })
              }
              label="Drop OG image here or click to browse"
            />
          </FormField>
        </TabsContent>

        <TabsContent value="storage" className="mt-0">
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5 sm:px-6">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <HardDrive className="size-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    File storage
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Product, category, banner, review, and branding images.
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-border bg-background px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Free plan
              </span>
            </div>

            {storageUsage.available ? (
              <div className="space-y-6 px-5 py-6 sm:px-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Used
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-foreground">
                      {formatBytes(storageUsage.usedBytes)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Remaining
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-foreground">
                      {formatBytes(storageRemaining)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Plan limit
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-foreground">
                      {formatBytes(storageUsage.quotaBytes)}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {storageUsage.objectCount.toLocaleString()} stored files
                    </span>
                    <span className="font-medium tabular-nums text-foreground">
                      {storagePercent < 0.1 && storagePercent > 0
                        ? "<0.1"
                        : storagePercent.toFixed(1)}
                      % used
                    </span>
                  </div>
                  <div
                    className="h-3 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-label="File storage used"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(storageBarPercent)}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width]",
                        storageBarColor,
                      )}
                      style={{ width: `${storageBarPercent}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Usage includes every file in this Supabase project and
                    refreshes when this page loads.
                  </p>
                </div>
              </div>
            ) : (
              <div className="px-5 py-8 sm:px-6">
                <p className="text-sm font-medium text-foreground">
                  Storage usage is unavailable
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Check the Supabase service configuration, then reload this
                  page.
                </p>
              </div>
            )}
          </section>
        </TabsContent>
      </Tabs>

      {mainTab !== "storage" ? (
        <FormActions>
          <Button
            onClick={onSave}
            disabled={pending}
            className="rounded-full px-6"
          >
            {pending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Save changes
          </Button>
        </FormActions>
      ) : null}
    </div>
  );
}
