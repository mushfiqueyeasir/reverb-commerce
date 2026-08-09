import { Suspense } from "react";
import Navbar from "./Navbar";
import type { Category } from "@/type/categoryType";
import type { SiteSettings } from "@/utility/getSettings";
import { getMenuData } from "@/constant/menuData";

interface HeaderProps {
  categories: Category[];
  settings: SiteSettings;
}

export default function Header({ categories, settings }: HeaderProps) {
  const menuData = getMenuData(categories);
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
      />
    </Suspense>
  );
}
