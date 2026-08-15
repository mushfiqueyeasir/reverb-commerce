import { Suspense } from "react";
import type { Category } from "@/type/categoryType";
import type { SiteSettings } from "@/utility/getSettings";
import { getMenuData } from "@/constant/menuData";
import { resolveKawaiiAnnouncement } from "@/lib/cms/siteChrome";
import KawaiiNavbar from "./KawaiiNavbar";

export interface KawaiiHeaderProps {
  categories: Category[];
  settings: SiteSettings;
  aiSearchEnabled: boolean;
  preview?: boolean;
}

export default function KawaiiHeader({
  categories,
  settings,
  aiSearchEnabled,
  preview = false,
}: KawaiiHeaderProps) {
  const announcement = resolveKawaiiAnnouncement(settings.navbar.announcement, {
    text: settings.announcement_text,
    active: settings.announcement_active,
    url: settings.announcement_url,
  });

  return (
    <Suspense
      fallback={
        <div className="relative z-50 h-16 md:sticky md:inset-x-0 md:top-0 md:h-20 md:border-b md:border-border md:bg-background" />
      }
    >
      <KawaiiNavbar
        menuData={getMenuData(categories, settings.navbar)}
        logoUrl={settings.logoUrl}
        storeName={settings.store_name}
        copy={settings.navbar.copy}
        announcementText={announcement.text}
        announcementActive={announcement.active}
        announcementUrl={announcement.url}
        aiSearchEnabled={aiSearchEnabled}
        preview={preview}
      />
    </Suspense>
  );
}
