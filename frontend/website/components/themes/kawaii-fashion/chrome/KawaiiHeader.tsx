import { Suspense } from "react";
import type { Category } from "@/type/categoryType";
import type { SiteSettings } from "@/utility/getSettings";
import { getMenuData } from "@/constant/menuData";
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
  return (
    <Suspense
      fallback={
        <div className="sticky inset-x-0 top-0 z-50 h-16 md:h-20 md:border-b md:border-border md:bg-background" />
      }
    >
      <KawaiiNavbar
        menuData={getMenuData(categories, settings.navbar)}
        logoUrl={settings.logoUrl}
        storeName={settings.store_name || "Store"}
        announcementText={settings.announcement_text}
        announcementActive={settings.announcement_active}
        announcementUrl={settings.announcement_url}
        aiSearchEnabled={aiSearchEnabled}
        preview={preview}
      />
    </Suspense>
  );
}
