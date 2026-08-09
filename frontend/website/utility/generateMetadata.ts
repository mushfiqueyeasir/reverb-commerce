import { Metadata } from "next";
import type { SeoItemType } from "@/type/seoType";
import { appConfig } from "@/lib/config";
import { getSiteSettings } from "@/utility/getSettings";
import { isStoreSetupMode } from "@/lib/config.server";

export async function generateMetadata(
  seoContent: SeoItemType,
): Promise<Metadata> {
  const { title, description, image, siteUrl, keywords, tags } = seoContent;
  const baseUrl = appConfig.siteUrl || siteUrl;
  const imageUrl = image ? new URL(image, baseUrl).href : null;
  const settings = await getSiteSettings();
  const storeName = settings.store_name || "Store";

  return {
    title,
    description,
    keywords: keywords ? keywords : tags,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title,
      description,
      ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
      url: siteUrl,
      siteName: storeName,
      type: "website",
    },
    twitter: {
      title,
      description,
      ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
      card: "summary_large_image",
    },
    robots: isStoreSetupMode() ? "noindex, nofollow" : "index, follow",
  };
}
