"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { writeAuditLog } from "@/lib/admin/auditLog";
import {
  DEFAULT_PAGES,
  readCmsBlob,
  tableExists,
  writeCmsBlob,
  type CmsPage,
  type CmsPageSlug,
} from "@/lib/cms/jsonStore";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeCmsHtml } from "@/lib/html/sanitize";

const SLUGS: CmsPageSlug[] = ["about", "terms", "privacy", "refund"];
const MANAGED_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const STORE_PATH: Record<CmsPageSlug, string> = {
  about: "/about-us",
  terms: "/terms-of-service",
  privacy: "/privacy-policy",
  refund: "/refund-policy",
};

export interface ManagedCmsPage extends Omit<CmsPage, "slug"> {
  slug: string;
}

export async function listPages(): Promise<ManagedCmsPage[]> {
  if (await tableExists("content_pages")) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("content_pages")
      .select("*")
      .order("slug");
    const rows = (data ?? []) as ManagedCmsPage[];
    for (const slug of SLUGS) {
      if (!rows.some((row) => row.slug === slug)) rows.push(DEFAULT_PAGES[slug]);
    }
    return rows;
  }
  const cms = await readCmsBlob();
  return SLUGS.map((slug) => cms.pages[slug] ?? DEFAULT_PAGES[slug]);
}

export async function getPage(slug: string): Promise<ManagedCmsPage | null> {
  const pages = await listPages();
  return pages.find((page) => page.slug === slug) ?? null;
}

export async function savePage(input: {
  slug: string;
  title: string;
  body_html: string;
}): Promise<{ error?: string }> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }
  if (!MANAGED_SLUG_RE.test(input.slug)) return { error: "Invalid page." };
  if (!input.title.trim()) return { error: "Title is required." };

  const now = new Date().toISOString();
  const page: ManagedCmsPage = {
    slug: input.slug,
    title: input.title.trim(),
    body_html: sanitizeCmsHtml(input.body_html),
    updated_at: now,
  };

  if (await tableExists("content_pages")) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("content_pages").upsert({
      slug: page.slug,
      title: page.title,
      body_html: page.body_html,
      updated_at: now,
    });
    if (error) return { error: error.message };
  } else if (SLUGS.includes(input.slug as CmsPageSlug)) {
    const slug = input.slug as CmsPageSlug;
    const cms = await readCmsBlob();
    cms.pages[slug] = { ...page, slug };
    const res = await writeCmsBlob(cms);
    if (res.error) return { error: res.error };
  } else {
    return { error: "Managed pages require the content_pages table." };
  }

  await writeAuditLog({
    actor: s,
    action: "update",
    entity: "page",
    entityId: input.slug,
    summary: `Updated page "${input.title.trim()}"`,
  });

  revalidatePath("/admin/pages");
  const fixedPath = STORE_PATH[input.slug as CmsPageSlug];
  revalidatePath(fixedPath ?? `/info/${input.slug}`);
  return {};
}
