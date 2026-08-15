import type { Metadata } from "next";
import AboutPageScreen from "@/components/AboutPage/AboutPageScreen";
import { getStorefrontThemePackage } from "@/components/themes/registry";
import { getStorefrontThemeManifest } from "@/lib/theme/manifest";
import { readCurrentPublishedStorefrontTheme } from "@/lib/theme/store";
import { generateMetadata as generateSeoMetadata } from "@/utility/generateMetadata";
import { getSeoItem } from "@/utility/getSeoSettings";
import { getAboutSections } from "@/utility/getAboutSections";
import { bannerImageUrl, brandingImageUrl } from "@/utility/imageUrl";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoMetadata(await getSeoItem("about"));
}

export default async function AboutUsPage() {
  const [sections, publishedTheme] = await Promise.all([
    getAboutSections(),
    readCurrentPublishedStorefrontTheme(),
  ]);
  const manifest = getStorefrontThemeManifest(
    publishedTheme.config.themeId,
    publishedTheme.config.themeVersion,
  );
  const themeSections = sections.filter((section) =>
    manifest.slots.about.sectionTypes.includes(section.type),
  );
  const imageUrls = Object.fromEntries(
    themeSections.map((section) => {
      const path = section.config.image_path;
      if (typeof path !== "string" || !path.trim()) return [section.id, null];
      const url =
        section.config.image_bucket === "branding"
          ? brandingImageUrl(path)
          : bannerImageUrl(path);
      return [section.id, url];
    }),
  );

  return (
    <AboutPageScreen
      sections={themeSections}
      imageUrls={imageUrls}
      rendererMapping={manifest.renderers.aboutSections}
      renderers={getStorefrontThemePackage(manifest.id).aboutRenderers}
    />
  );
}
