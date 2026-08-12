import type { Metadata } from "next";
import AboutPageScreen from "@/components/AboutPage/AboutPageScreen";
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
  const sections = await getAboutSections();
  const imageUrls = Object.fromEntries(
    sections.map((section) => {
      const path = section.config.image_path;
      if (typeof path !== "string" || !path.trim()) return [section.id, null];
      const url =
        section.config.image_bucket === "branding"
          ? brandingImageUrl(path)
          : bannerImageUrl(path);
      return [section.id, url];
    }),
  );

  return <AboutPageScreen sections={sections} imageUrls={imageUrls} />;
}
