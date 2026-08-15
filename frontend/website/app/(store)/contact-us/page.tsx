import type { Metadata } from "next";
import ContactPageScreen from "@/components/ContactPage/ContactPageScreen";
import { getStorefrontThemePackage } from "@/components/themes/registry";
import { getStorefrontThemeManifest } from "@/lib/theme/manifest";
import { readCurrentPublishedStorefrontTheme } from "@/lib/theme/store";
import { generateMetadata as generateSeoMetadata } from "@/utility/generateMetadata";
import { getSeoItem } from "@/utility/getSeoSettings";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoMetadata(await getSeoItem("contact"));
}

export default async function ContactUsPage() {
  const publishedTheme = await readCurrentPublishedStorefrontTheme();
  const manifest = getStorefrontThemeManifest(
    publishedTheme.config.themeId,
    publishedTheme.config.themeVersion,
  );
  const contact = getStorefrontThemePackage(manifest.id).contact;

  return <ContactPageScreen layout={contact?.ContactForm} />;
}
