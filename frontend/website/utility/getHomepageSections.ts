import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readCmsBlob, tableExists } from "@/lib/cms/jsonStore";
import { normalizeHomepageSections } from "@/lib/cms/homepageSections";
import type { HomepageSectionRow, HomepageSectionType } from "@/type/db";

export interface HomepageSection {
  id: string;
  type: HomepageSectionType;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  sort: number;
  config: Record<string, unknown>;
}

function mapSection(row: HomepageSectionRow): HomepageSection {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    subtitle: row.subtitle,
    body: row.body,
    sort: row.sort,
    config: row.config ?? {},
  };
}

export async function getHomepageSections(): Promise<HomepageSection[]> {
  try {
    if (await tableExists("homepage_sections")) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .eq("active", true)
        .order("sort", { ascending: true });

      if (!error) {
        return normalizeHomepageSections((data ?? []) as HomepageSectionRow[], {
          appendMissing: false,
        }).map(mapSection);
      }
    }

    const cms = await readCmsBlob();
    return normalizeHomepageSections(cms.homepage_sections, {
      appendMissing: false,
    })
      .filter((section) => section.active)
      .map(mapSection);
  } catch {
    return [];
  }
}
