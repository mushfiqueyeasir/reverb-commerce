import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DEFAULT_PAGES,
  readCmsBlob,
  tableExists,
  type CmsPage,
  type CmsPageSlug,
} from "@/lib/cms/jsonStore";

export async function getContentPage(slug: CmsPageSlug): Promise<CmsPage> {
  try {
    if (await tableExists("content_pages")) {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase
        .from("content_pages")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (data) {
        return {
          slug,
          title: data.title as string,
          body_html: data.body_html as string,
          updated_at: data.updated_at as string,
        };
      }
    }
    const cms = await readCmsBlob();
    return cms.pages[slug] ?? DEFAULT_PAGES[slug];
  } catch {
    return DEFAULT_PAGES[slug];
  }
}
