import type { Metadata } from "next";
import ProductDetailPageScreen from "@/components/ProductDetailPage/ProductDetailPageScreen";
import { getProductBySlug, transformProduct } from "@/utility/getProducts";
import { buildProductJsonLd, buildProductMetadata } from "@/utility/productSeo";
import { getSiteSettings } from "@/utility/getSettings";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type ProductPageParams = { slug: string[] };

async function resolveSlug(
  params: ProductPageParams | Promise<ProductPageParams>,
): Promise<string> {
  const resolved = params instanceof Promise ? await params : params;
  const slugArray = resolved.slug || [];
  return slugArray.length > 0 ? slugArray.join("/") : "";
}

export async function generateMetadata({
  params,
}: {
  params: ProductPageParams | Promise<ProductPageParams>;
}): Promise<Metadata> {
  const slug = await resolveSlug(params);
  const settings = await getSiteSettings();
  const storeName = settings.store_name || "Store";
  if (!slug) {
    return {
      title: `Product Not Found | ${storeName}`,
      robots: "noindex, follow",
    };
  }

  const product = await getProductBySlug(slug);
  if (!product) {
    return {
      title: `Product Not Found | ${storeName}`,
      robots: "noindex, follow",
    };
  }

  return buildProductMetadata(product, storeName);
}

export default async function ProductDetailPage({
  params,
}: {
  params: ProductPageParams | Promise<ProductPageParams>;
}) {
  const slug = await resolveSlug(params);

  if (!slug) {
    notFound();
  }

  const [product, settings] = await Promise.all([
    getProductBySlug(slug),
    getSiteSettings(),
  ]);

  if (!product) {
    notFound();
  }

  const transformedProduct = transformProduct(product);
  const jsonLd = buildProductJsonLd(
    product,
    settings.currency || "BDT",
    settings.store_name || "Store",
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailPageScreen
        product={transformedProduct}
        description={product.description}
        stock={product.stock}
      />
    </>
  );
}
