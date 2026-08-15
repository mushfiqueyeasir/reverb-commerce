import { Suspense } from "react";
import Navbar from "./Navbar";
import type { Category } from "@/type/categoryType";
import type { SiteSettings } from "@/utility/getSettings";
import { getMenuData } from "@/constant/menuData";

interface HeaderProps {
  categories: Category[];
  settings: SiteSettings;
  aiSearchEnabled: boolean;
  preview?: boolean;
}

export default function Header({
  categories,
  settings,
  aiSearchEnabled,
  preview = false,
}: HeaderProps) {
  const menuData = getMenuData(categories, settings.navbar);
  const storeName = settings.store_name || "Store";

  return (
    <Suspense
      fallback={
        <div className="absolute inset-x-0 top-0 z-50 h-16 sm:h-20 md:fixed" />
      }
    >
      <Navbar
        menuData={menuData}
        logoUrl={settings.logoUrl}
        storeName={storeName}
        config={settings.navbar}
        aiSearchEnabled={aiSearchEnabled}
        preview={preview}
      />
    </Suspense>
  );
}
