import { MetadataRoute } from "next";
import { appConfig } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isPublicManagedSlug } from "@/lib/cms/managedPages";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = appConfig.siteUrl || "";
  const currentDate = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/product`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact-us`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/track-order`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },

    {
      url: `${baseUrl}/reviews`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const supabase = await createSupabaseServerClient();
  const [productsResult, pagesResult] = await Promise.all([
    supabase
      .from("products")
      .select("slug, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false }),
    supabase.from("content_pages").select("slug, updated_at"),
  ]);

  const productRoutes: MetadataRoute.Sitemap = (productsResult.data ?? [])
    .filter((product): product is { slug: string; updated_at: string | null } =>
      Boolean(product.slug),
    )
    .map((product) => ({
      url: `${baseUrl}/product/${product.slug}`,
      lastModified: product.updated_at
        ? new Date(product.updated_at)
        : currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const managedPageRoutes: MetadataRoute.Sitemap = (pagesResult.data ?? [])
    .filter(
      (page): page is { slug: string; updated_at: string | null } =>
        typeof page.slug === "string" && isPublicManagedSlug(page.slug),
    )
    .map((page) => ({
      url: `${baseUrl}/info/${page.slug}`,
      lastModified: page.updated_at ? new Date(page.updated_at) : currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  return [...staticRoutes, ...managedPageRoutes, ...productRoutes];
}
