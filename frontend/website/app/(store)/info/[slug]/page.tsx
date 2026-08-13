import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CmsPageScreen from "@/components/CmsPage/CmsPageScreen";
import { getPublicContentPage } from "@/utility/getContentPage";
import { getSiteSettings } from "@/utility/getSettings";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicContentPage(slug);
  if (!page) return {};
  const description = page.body_html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  const canonical = `/info/${slug}`;
  return {
    title: page.title,
    description,
    alternates: { canonical },
    openGraph: { title: page.title, description, url: canonical },
  };
}

export default async function ManagedContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [page, settings] = await Promise.all([
    getPublicContentPage(slug),
    getSiteSettings(),
  ]);
  if (!page) notFound();

  return (
    <CmsPageScreen
      eyebrow={settings.store_name}
      title={page.title}
      bodyHtml={page.body_html}
    />
  );
}
