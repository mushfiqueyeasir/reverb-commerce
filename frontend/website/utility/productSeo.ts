import type { Metadata } from "next";
import type { Product } from "@/type/productType";
import { appConfig } from "@/lib/config";

const FALLBACK_STORE_NAME = "Store";

export function htmlToPlainText(
  description: { html?: string } | null | undefined,
): string {
  if (!description?.html) return "";
  return description.html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  const clipped = text.slice(0, max - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > 80 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
}

function absoluteUrl(pathOrUrl: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, baseUrl).href;
}

export function getProductCanonicalUrl(slug: string): string {
  const baseUrl = appConfig.siteUrl || "";
  return `${baseUrl.replace(/\/$/, "")}/product/${slug}`;
}

export function buildProductMetadata(
  product: Product,
  storeName = FALLBACK_STORE_NAME,
): Metadata {
  const baseUrl = appConfig.siteUrl || "";
  const slug = product.slug.current;
  const url = getProductCanonicalUrl(slug);
  const title = `${product.title} | ${storeName}`;
  const plain = htmlToPlainText(product.description);
  const description =
    truncate(plain) || `Shop ${product.title} at ${storeName}.`;
  const imageUrl = product.image ? absoluteUrl(product.image, baseUrl) : null;
  const categoryNames = product.categories.map((c) => c.categoryName);

  return {
    title,
    description,
    keywords: [
      product.title,
      storeName,
      ...categoryNames,
      "Shop",
      "Buy Online",
    ],
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: storeName,
      type: "website",
      ...(imageUrl ? { images: [{ url: imageUrl, alt: product.title }] } : {}),
    },
    twitter: {
      title,
      description,
      ...(imageUrl ? { images: [{ url: imageUrl, alt: product.title }] } : {}),
      card: "summary_large_image",
    },
    robots: "index, follow",
  };
}

export function buildProductJsonLd(
  product: Product,
  currency = "BDT",
  storeName = FALLBACK_STORE_NAME,
): Record<string, unknown> {
  const url = getProductCanonicalUrl(product.slug.current);
  const baseUrl = appConfig.siteUrl || "";
  const imageUrl = product.image ? absoluteUrl(product.image, baseUrl) : null;
  const gallery = [
    imageUrl,
    ...product.images.map((img) => absoluteUrl(img, baseUrl)),
  ];
  const uniqueImages = Array.from(
    new Set(gallery.filter((image): image is string => Boolean(image))),
  );
  const description =
    htmlToPlainText(product.description) ||
    `Shop ${product.title} at ${storeName}.`;
  const inStock = product.stock.some((item) => item.quantity > 0);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description,
    ...(uniqueImages.length ? { image: uniqueImages } : {}),
    sku: product._id,
    url,
    brand: {
      "@type": "Brand",
      name: storeName,
    },
    ...(product.categories[0]
      ? { category: product.categories[0].categoryName }
      : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: currency,
      price: product.currentPrice.toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: storeName,
      },
    },
  };
}
