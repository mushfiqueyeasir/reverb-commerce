import { notFound } from "next/navigation";
import { ThemeStorefrontPreview } from "@/app/admin/(panel)/themes/ThemeStorefrontPreview";
import { requireRole } from "@/lib/admin/auth";
import {
  STOREFRONT_THEME_REGISTRY,
  createDefaultStorefrontThemeConfig,
} from "@/lib/theme/manifest";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ThemeComponentPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ themeId: string }>;
  searchParams: Promise<{ primary?: string }>;
}) {
  await requireRole(["admin"]);
  const [{ themeId }, query] = await Promise.all([params, searchParams]);
  const manifest = STOREFRONT_THEME_REGISTRY[themeId];
  if (!manifest) notFound();

  const config = createDefaultStorefrontThemeConfig(manifest);
  const primary = query.primary?.trim().toLowerCase();
  if (primary && /^#[0-9a-f]{6}$/.test(primary)) {
    config.tokenOverrides = { palette: { primary } };
  }

  return <ThemeStorefrontPreview config={config} />;
}
