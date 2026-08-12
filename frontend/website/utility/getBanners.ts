import { createSupabaseServerClient } from "@/lib/supabase/server";
import { bannerImageUrl } from "@/utility/imageUrl";
import { readCmsBlob, tableExists } from "@/lib/cms/jsonStore";
import type { BannerRow, BannerSectionType } from "@/type/db";

export interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  mobileImageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
}

function mapBanner(row: BannerRow): Banner {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    imageUrl: bannerImageUrl(row.image_path),
    mobileImageUrl: bannerImageUrl(row.mobile_image_path),
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
  };
}

function isLive(row: BannerRow): boolean {
  if (!row.active || !row.image_path) return false;
  if (!row.title?.trim()) return false;
  const now = Date.now();
  if (row.starts_at && new Date(row.starts_at).getTime() > now) return false;
  if (row.ends_at && new Date(row.ends_at).getTime() < now) return false;
  return true;
}

export async function getBanners(
  sectionType: BannerSectionType = "banner",
): Promise<Banner[]> {
  try {
    if (await tableExists("banners")) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("section_type", sectionType)
        .eq("active", true)
        .order("sort", { ascending: true })
        .order("created_at", { ascending: false });
      if (!error && data) {
        return (data as BannerRow[]).filter(isLive).map(mapBanner);
      }
      const missingSectionType =
        error?.code === "42703" || error?.message.includes("section_type");
      if (missingSectionType) {
        if (sectionType === "banner_v2") return [];
        const legacy = await supabase
          .from("banners")
          .select("*")
          .eq("active", true)
          .order("sort", { ascending: true })
          .order("created_at", { ascending: false });
        if (!legacy.error && legacy.data) {
          return (legacy.data as BannerRow[]).filter(isLive).map(mapBanner);
        }
      }
    }

    const cms = await readCmsBlob();
    return cms.banners
      .filter((banner) => banner.section_type === sectionType)
      .filter(isLive)
      .sort((a, b) => a.sort - b.sort)
      .map(mapBanner);
  } catch {
    return [];
  }
}
