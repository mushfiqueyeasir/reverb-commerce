import { requireRole } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { readCmsBlob } from "@/lib/cms/jsonStore";
import { getSmtpSettingsForAdmin } from "@/lib/email/smtpSettings";
import { getBkashSettingsForAdmin } from "@/lib/payments/bkashSettings";
import { getCourierSettingsForAdmin } from "@/lib/couriers/settings";
import { getStorageUsage } from "@/lib/admin/storageUsage";
import { appConfig } from "@/lib/config";
import type { SiteSettingsRow } from "@/type/db";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

const DEFAULTS: SiteSettingsRow = {
  id: 1,
  store_name: "VE-gear",
  logo_path: null,
  invoice_logo_path: null,
  favicon_path: null,
  contact_email: null,
  contact_phone: null,
  address: null,
  currency: "USD",
  currency_symbol: "$",
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
};

export default async function SettingsPage() {
  await requireRole(["admin"]);

  const supabase = await createSupabaseServerClient();
  const [{ data }, cms, smtp, bkash, courier, storageUsage] = await Promise.all(
    [
      supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
      readCmsBlob(),
      getSmtpSettingsForAdmin(),
      getBkashSettingsForAdmin(),
      getCourierSettingsForAdmin(),
      getStorageUsage(),
    ],
  );

  const row = (data as SiteSettingsRow | null) ?? DEFAULTS;
  const settings: SiteSettingsRow = {
    ...row,
    favicon_path: row.favicon_path ?? cms.favicon_path ?? null,
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Store, commerce, notifications, analytics, and SEO."
      />
      <SettingsForm
        settings={settings}
        seo={cms.seo}
        pagesSeo={cms.pages_seo}
        currencies={cms.currencies}
        deliveryCharges={cms.deliveryCharges}
        chatWidgets={cms.chatWidgets}
        palette={cms.palette}
        smtp={smtp}
        bkash={bkash}
        courier={courier}
        siteUrl={appConfig.siteUrl}
        storageUsage={storageUsage}
      />
    </div>
  );
}
