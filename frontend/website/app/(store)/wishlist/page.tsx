import type { Metadata } from "next";
import WishlistPageScreen from "@/components/WishlistPage/WishlistPageScreen";
import { generateMetadata as generateSeoMetadata } from "@/utility/generateMetadata";
import { getSeoItem } from "@/utility/getSeoSettings";
import { getStorefrontThemeManifest } from "@/lib/theme/manifest";
import { readCurrentPublishedStorefrontTheme } from "@/lib/theme/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoMetadata(await getSeoItem("wishlist"));
}

export default async function WishlistPage() {
  const publishedTheme = await readCurrentPublishedStorefrontTheme();
  const manifest = getStorefrontThemeManifest(
    publishedTheme.config.themeId,
    publishedTheme.config.themeVersion,
  );
  const productCardVariant = manifest.productCardVariant;

  return <WishlistPageScreen productCardVariant={productCardVariant} />;
}
