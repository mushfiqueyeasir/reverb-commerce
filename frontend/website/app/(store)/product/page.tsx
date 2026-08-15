import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProductPageScreen from "@/components/ProductPage/ProductPageScreen";
import { generateMetadata as generateSeoMetadata } from "@/utility/generateMetadata";
import { getSeoItem } from "@/utility/getSeoSettings";
import {
  getProductsPage,
  transformProduct,
  type StorefrontProductSort,
} from "@/utility/getProducts";
import { getCategories } from "@/utility/getCategory";
import { getDescendantIds } from "@/lib/categories/hierarchy";
import { getStorefrontThemeManifest } from "@/lib/theme/manifest";
import { readCurrentPublishedStorefrontTheme } from "@/lib/theme/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const PAGE_SIZE = 20;
const SORTS: StorefrontProductSort[] = [
  "featured",
  "price-low",
  "price-high",
  "name-a-z",
  "name-z-a",
];
const AVAILABILITY = ["in-stock", "out-of-stock"] as const;

type ProductSearchParams = {
  page?: string | string[];
  category?: string | string[];
  availability?: string | string[];
  minPrice?: string | string[];
  maxPrice?: string | string[];
  search?: string | string[];
  sort?: string | string[];
};

function firstParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function listParam(value: string | string[] | undefined) {
  return [
    ...new Set(
      firstParam(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function priceParam(value: string | string[] | undefined) {
  const raw = firstParam(value);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function productUrl(
  page: number,
  filters: {
    categories: string[];
    availability: string[];
    minPrice: number | null;
    maxPrice: number | null;
    search: string;
    sort: StorefrontProductSort;
  },
) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (filters.categories.length) {
    params.set("category", filters.categories.join(","));
  }
  if (filters.availability.length) {
    params.set("availability", filters.availability.join(","));
  }
  if (filters.minPrice !== null) {
    params.set("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice !== null) {
    params.set("maxPrice", String(filters.maxPrice));
  }
  if (filters.search) params.set("search", filters.search);
  if (filters.sort !== "featured") params.set("sort", filters.sort);
  const query = params.toString();
  return `/product${query ? `?${query}` : ""}`;
}

function escapeLikePattern(value: string) {
  return value.replaceAll("\\", "\\\\").replace(/[%_]/g, "\\$&");
}

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoMetadata(await getSeoItem("product"));
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductSearchParams>;
}) {
  const params = await searchParams;
  const requestedPage = Number.parseInt(firstParam(params.page), 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const requestedCategories = listParam(params.category);
  const requestedAvailability = listParam(params.availability);
  const search = firstParam(params.search).slice(0, 80);
  const requestedSort = firstParam(params.sort) as StorefrontProductSort;
  const sort = SORTS.includes(requestedSort) ? requestedSort : "featured";
  const availability = requestedAvailability.filter(
    (value): value is (typeof AVAILABILITY)[number] =>
      AVAILABILITY.includes(value as (typeof AVAILABILITY)[number]),
  );
  const minPrice = priceParam(params.minPrice);
  const maxPrice = priceParam(params.maxPrice);
  const [categories, publishedTheme] = await Promise.all([
    getCategories(),
    readCurrentPublishedStorefrontTheme(),
  ]);
  const manifest = getStorefrontThemeManifest(
    publishedTheme.config.themeId,
    publishedTheme.config.themeVersion,
  );
  const productCardVariant =
    manifest.id === "kawaii-fashion" ? "kawaii-fashion" : "default";
  const categoryBySlug = new Map(
    categories.map((category) => [category.categoryUrl.current, category]),
  );
  const selectedCategories = requestedCategories.filter((slug) => {
    const category = categoryBySlug.get(slug);
    return category && !category.isDefault;
  });
  const categoryIds = [
    ...new Set(
      selectedCategories.flatMap((slug) => {
        const category = categoryBySlug.get(slug);
        return category ? [...getDescendantIds(categories, category._id)] : [];
      }),
    ),
  ];
  const filters = {
    categories: selectedCategories,
    availability,
    minPrice,
    maxPrice,
    search,
    sort,
  };
  const result = await getProductsPage(
    {
      search: escapeLikePattern(search),
      categoryIds,
      availability,
      minPrice,
      maxPrice,
      sort,
    },
    page,
    PAGE_SIZE,
  );
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  if (page > totalPages) redirect(productUrl(totalPages, filters));

  return (
    <ProductPageScreen
      products={result.products.map(transformProduct)}
      categories={categories}
      filters={filters}
      page={page}
      pageSize={PAGE_SIZE}
      total={result.total}
      maxCatalogPrice={result.maxCatalogPrice}
      previousHref={page > 1 ? productUrl(page - 1, filters) : null}
      nextHref={page < totalPages ? productUrl(page + 1, filters) : null}
      productCardVariant={productCardVariant}
    />
  );
}
