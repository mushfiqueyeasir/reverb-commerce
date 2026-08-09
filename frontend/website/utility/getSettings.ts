import { createSupabaseServerClient } from "@/lib/supabase/server";
import { brandingImageUrl } from "@/utility/imageUrl";
import { readCmsBlob } from "@/lib/cms/jsonStore";
import {
  DEFAULT_CURRENCY_SETTINGS,
  getCurrencyMeta,
  normalizeCurrencySettings,
  type CurrencySettings,
} from "@/lib/currency";
import {
  DEFAULT_DELIVERY_CHARGES,
  normalizeDeliveryCharges,
  type DeliveryCharges,
} from "@/lib/delivery";
import {
  DEFAULT_CHAT_WIDGETS,
  normalizeChatWidgets,
  type ChatWidgets,
} from "@/lib/chatWidgets";
import {
  DEFAULT_PALETTE,
  normalizePalette,
  type ThemePalette,
} from "@/lib/theme/palette";
import type { SiteSettingsRow } from "@/type/db";

export interface SiteSettings extends SiteSettingsRow {
  logoUrl: string | null;
  invoiceLogoUrl: string | null;
  faviconUrl: string | null;
  currencies: CurrencySettings;
  deliveryCharges: DeliveryCharges;
  chatWidgets: ChatWidgets;
  palette: ThemePalette;
}

const FALLBACK: SiteSettings = {
  id: 1,
  store_name: "VE-gear",
  logo_path: null,
  invoice_logo_path: null,
  favicon_path: null,
  logoUrl: null,
  invoiceLogoUrl: null,
  faviconUrl: null,
  contact_email: null,
  contact_phone: null,
  address: null,
  currency: "BDT",
  currency_symbol: "৳",
  shipping_flat: 0,
  free_shipping_threshold: null,
  socials: {},
  google_analytics_id: null,
  meta_pixel_id: null,
  gtm_id: null,
  analytics_enabled: false,
  security_enabled: false,
  announcement_text: null,
  announcement_active: false,
  announcement_url: null,
  updated_at: new Date(0).toISOString(),
  currencies: { ...DEFAULT_CURRENCY_SETTINGS },
  deliveryCharges: { ...DEFAULT_DELIVERY_CHARGES },
  chatWidgets: { ...DEFAULT_CHAT_WIDGETS },
  palette: { ...DEFAULT_PALETTE },
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return FALLBACK;
    const row = data as SiteSettingsRow;
    const cms = await readCmsBlob();
    const currencies = normalizeCurrencySettings(cms.currencies);
    const meta = getCurrencyMeta(currencies.default);

    let announcement_text = row.announcement_text;
    let announcement_active = row.announcement_active;
    let announcement_url = row.announcement_url;
    if (announcement_text === undefined || announcement_active === undefined) {
      announcement_text = cms.announcement.text;
      announcement_active = cms.announcement.active;
      announcement_url = cms.announcement.url;
    }

    const favicon_path = row.favicon_path ?? cms.favicon_path ?? null;

    return {
      ...row,
      currency: meta.code,
      currency_symbol: meta.symbol,
      currencies,
      deliveryCharges: normalizeDeliveryCharges(cms.deliveryCharges),
      chatWidgets: normalizeChatWidgets(cms.chatWidgets),
      announcement_text: announcement_text ?? null,
      announcement_active: announcement_active ?? false,
      announcement_url: announcement_url ?? null,
      favicon_path,
      logoUrl: brandingImageUrl(row.logo_path),
      invoiceLogoUrl: brandingImageUrl(row.invoice_logo_path),
      faviconUrl: brandingImageUrl(favicon_path),
      palette: normalizePalette(cms.palette),
    };
  } catch {
    return FALLBACK;
  }
}
