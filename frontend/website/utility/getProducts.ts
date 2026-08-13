import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { productImageUrl } from "@/utility/imageUrl";
import { resolveSizeChart } from "@/lib/products/sizeChart";
import type {
  Product,
  CategoryWithProducts,
  TransformedProduct,
  ProductStock,
  ProductCategory,
} from "@/type/productType";

// Shape returned by the nested Supabase select below.
interface RawProduct {
  id: string;
  title: string;
  slug: string;
  original_price: number;
  current_price: number;
  description: { html?: string } | null;
  sizing_mode?: "none" | "required";
  size_chart?: unknown;
  product_images: {
    path: string;
    alt: string | null;
    is_main: boolean;
    sort: number;
  }[];
  product_variants: {
    id: string;
    size: string | null;
    color: string | null;
    stock_quantity: number;
  }[];
  product_categories: {
    categories: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
    } | null;
  }[];
}

const PRODUCT_SELECT = `
  id, title, slug, original_price, current_price, description, sizing_mode, size_chart,
  product_images ( path, alt, is_main, sort ),
  product_variants ( id, size, color, stock_quantity ),
  product_categories ( categories ( id, name, slug, description ) )
`;

const PRODUCT_SELECT_LEGACY = `
  id, title, slug, original_price, current_price, description,
  product_images ( path, alt, is_main, sort ),
  product_variants ( id, size, color, stock_quantity ),
  product_categories ( categories ( id, name, slug, description ) )
`;

function mapStock(variants: RawProduct["product_variants"]): ProductStock[] {
  return variants.map((variant) => ({
    id: variant.id,
    size: variant.size,
    color: variant.color,
    quantity: variant.stock_quantity ?? 0,
  }));
}

function mapCategories(
  rows: RawProduct["product_categories"],
): ProductCategory[] {
  return rows
    .map((r) => r.categories)
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((c) => ({
      _id: c.id,
      categoryName: c.name,
      categoryDescription: c.description,
      categoryUrl: { current: c.slug },
    }));
}

function mapProduct(raw: RawProduct): Product {
  const images = [...raw.product_images].sort((a, b) => a.sort - b.sort);
  const main = images.find((i) => i.is_main) ?? images[0];
  const gallery = images
    .filter((i) => i !== main)
    .map((i) => productImageUrl(i.path))
    .filter((u): u is string => Boolean(u));

  const sizingMode = raw.sizing_mode ?? "required";

  return {
    _id: raw.id,
    title: raw.title,
    slug: { current: raw.slug },
    categories: mapCategories(raw.product_categories),
    image: productImageUrl(main?.path) ?? "",
    images: gallery,
    originalPrice: Number(raw.original_price),
    currentPrice: Number(raw.current_price),
    description: raw.description ? { html: raw.description.html } : null,
    sizingMode,
    sizeChart:
      sizingMode === "required"
        ? resolveSizeChart(raw.size_chart, raw.description)
        : [],
    stock: mapStock(raw.product_variants),
  };
}

export type StorefrontProductSort =
  "featured" | "price-low" | "price-high" | "name-a-z" | "name-z-a";

export interface StorefrontProductQuery {
  search: string;
  categoryIds: string[];
  availability: ("in-stock" | "out-of-stock")[];
  minPrice: number | null;
  maxPrice: number | null;
  sort: StorefrontProductSort;
}

export interface StorefrontProductPage {
  products: Product[];
  total: number;
  maxCatalogPrice: number;
}

export async function getProductsPage(
  filters: StorefrontProductQuery,
  page: number,
  pageSize: number,
): Promise<StorefrontProductPage> {
  const supabase = await createSupabaseServerClient();
  const categoryJoin = filters.categoryIds.length
    ? ", category_filter:product_categories!inner(category_id)"
    : "";
  const onlyInStock =
    filters.availability.includes("in-stock") &&
    !filters.availability.includes("out-of-stock");
  const onlyOutOfStock =
    filters.availability.includes("out-of-stock") &&
    !filters.availability.includes("in-stock");
  const stockJoin = onlyInStock
    ? ", stock_filter:product_variants!inner(stock_quantity)"
    : onlyOutOfStock
      ? ", stock_filter:product_variants(stock_quantity)"
      : "";
  let query = supabase
    .from("products")
    .select(`${PRODUCT_SELECT}${categoryJoin}${stockJoin}`, { count: "exact" })
    .eq("status", "active");

  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }
  if (filters.categoryIds.length) {
    query = query.in("category_filter.category_id", filters.categoryIds);
  }
  if (onlyInStock) {
    query = query.gt("stock_filter.stock_quantity", 0);
  }
  if (onlyOutOfStock) {
    query = query.gt("stock_filter.stock_quantity", 0).is("stock_filter", null);
  }
  if (filters.minPrice !== null) {
    query = query.gte("current_price", filters.minPrice);
  }
  if (filters.maxPrice !== null) {
    query = query.lte("current_price", filters.maxPrice);
  }

  if (filters.sort === "price-low") {
    query = query.order("current_price", { ascending: true });
  } else if (filters.sort === "price-high") {
    query = query.order("current_price", { ascending: false });
  } else if (filters.sort === "name-a-z") {
    query = query.order("title", { ascending: true });
  } else if (filters.sort === "name-z-a") {
    query = query.order("title", { ascending: false });
  } else {
    query = query
      .order("sort", { ascending: true })
      .order("created_at", { ascending: false });
  }

  const offset = (page - 1) * pageSize;
  const [{ data, error, count }, maxPriceResult] = await Promise.all([
    query.order("id", { ascending: true }).range(offset, offset + pageSize - 1),
    supabase
      .from("products")
      .select("current_price")
      .eq("status", "active")
      .order("current_price", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (error) throw error;
  if (maxPriceResult.error) throw maxPriceResult.error;
  return {
    products: ((data as unknown as RawProduct[]) ?? []).map(mapProduct),
    total: count ?? 0,
    maxCatalogPrice: Number(maxPriceResult.data?.current_price ?? 0),
  };
}

export async function getProducts(): Promise<Product[]> {
  const supabase = await createSupabaseServerClient();
  const ordered = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "active")
    .order("sort", { ascending: true })
    .order("created_at", { ascending: false });

  if (!ordered.error) {
    return ((ordered.data as unknown as RawProduct[]) ?? []).map(mapProduct);
  }

  // Fallback before size_chart / sort migrations.
  const legacySelect = /(size_chart|sizing_mode)/i.test(ordered.error.message)
    ? PRODUCT_SELECT_LEGACY
    : PRODUCT_SELECT;

  const { data, error } = await supabase
    .from("products")
    .select(legacySelect)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data as unknown as RawProduct[]) ?? []).map(mapProduct);
}

export const getProductBySlug = cache(
  async (slug: string): Promise<Product | null> => {
    const supabase = await createSupabaseServerClient();
    let { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();

    if (error && /(size_chart|sizing_mode)/i.test(error.message)) {
      ({ data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT_LEGACY)
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle());
    }

    if (error) throw error;
    if (!data) return null;
    return mapProduct(data as unknown as RawProduct);
  },
);

export function groupProductsByCategory(
  products: Product[],
): CategoryWithProducts[] {
  const categoryMap = new Map<string, CategoryWithProducts>();

  products.forEach((product) => {
    const category = product.categories[0];
    if (!category) return;

    const categoryId = category.categoryUrl.current;
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        categoryId,
        categoryName: category.categoryName,
        categorySubtitle: category.categoryDescription || null,
        categoryHref: `/product?category=${categoryId}`,
        products: [],
      });
    }
    categoryMap.get(categoryId)!.products.push(product);
  });

  return Array.from(categoryMap.values());
}

export function transformProduct(product: Product): TransformedProduct {
  const mainImageUrl = product.image || "";
  const hoverImageUrl =
    product.images.length > 0 ? product.images[0] : undefined;
  const galleryImages = product.images.length > 0 ? product.images : undefined;

  const discount =
    product.originalPrice > product.currentPrice
      ? Math.round(
          ((product.originalPrice - product.currentPrice) /
            product.originalPrice) *
            100,
        )
      : undefined;

  return {
    id: product._id,
    title: product.title,
    image: mainImageUrl,
    hoverImage: hoverImageUrl,
    images: galleryImages,
    originalPrice: product.originalPrice,
    currentPrice: product.currentPrice,
    discount,
    href: `/product/${product.slug.current}`,
    slug: product.slug.current,
    sizingMode: product.sizingMode,
    stock: product.stock,
    sizeChart: product.sizeChart ?? [],
    categories: product.categories,
  };
}
