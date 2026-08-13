import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/utility/getSettings";
import { getCategories } from "@/utility/getCategory";
import {
  getCategoryBreadcrumb,
  getDescendantIds,
} from "@/lib/categories/hierarchy";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { productImageUrl } from "@/utility/imageUrl";
import {
  ProductsTable,
  type ProductFilterOption,
  type ProductTableRow,
} from "./ProductsTable";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type ProductSearchParams = {
  page?: string | string[];
  search?: string | string[];
  category?: string | string[];
};

interface ProductQueryRow {
  id: string;
  title: string;
  slug: string;
  status: "active" | "draft" | "archived";
  current_price: number;
  sort: number | null;
  product_images: { path: string; is_main: boolean; sort: number }[];
  product_variants: { stock_quantity: number }[];
  product_categories: { categories: { id: string; name: string } | null }[];
}

function firstParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function pageUrl(page: number, filters: { search: string; category: string }) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  const query = params.toString();
  return `/admin/products${query ? `?${query}` : ""}`;
}

function escapeLikePattern(value: string) {
  return value.replaceAll("\\", "\\\\").replace(/[%_]/g, "\\$&");
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductSearchParams>;
}) {
  const session = await requireAdminSession();
  const writable = canWrite(session.role);
  const params = await searchParams;
  const requestedPage = Number.parseInt(firstParam(params.page), 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const search = firstParam(params.search).slice(0, 80);
  const requestedCategory = firstParam(params.category);
  const [settings, allCategories] = await Promise.all([
    getSiteSettings(),
    getCategories(),
  ]);
  const category = allCategories.some(
    (item) => !item.isDefault && item._id === requestedCategory,
  )
    ? requestedCategory
    : "";
  const categoryIds = category
    ? [...getDescendantIds(allCategories, category)]
    : [];
  const filters = { search, category };
  const filterOptions: ProductFilterOption[] = allCategories
    .filter((item) => !item.isDefault)
    .map((item) => ({
      id: item._id,
      name: getCategoryBreadcrumb(allCategories, item._id).join(" / "),
      depth: item.depth,
    }));
  const supabase = await createSupabaseServerClient();
  const categoryFilterSelect = category
    ? ", category_filter:product_categories!inner(category_id)"
    : "";
  const selectWithSort = `id, title, slug, status, current_price, sort,
         product_images ( path, is_main, sort ),
         product_variants ( stock_quantity ),
         product_categories ( categories ( id, name ) )${categoryFilterSelect}`;
  const selectFallback = `id, title, slug, status, current_price,
         product_images ( path, is_main, sort ),
         product_variants ( stock_quantity ),
         product_categories ( categories ( id, name ) )${categoryFilterSelect}`;
  const offset = (page - 1) * PAGE_SIZE;
  const buildQuery = (withSort: boolean) => {
    let query = supabase
      .from("products")
      .select(withSort ? selectWithSort : selectFallback, { count: "exact" });
    if (search) {
      query = query.ilike("title", `%${escapeLikePattern(search)}%`);
    }
    if (categoryIds.length) {
      query = query.in("category_filter.category_id", categoryIds);
    }
    if (withSort) query = query.order("sort", { ascending: true });
    return query
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
  };

  let productRes = await buildQuery(true);
  if (
    productRes.error &&
    (productRes.error.code === "42703" ||
      /sort.*does not exist/i.test(productRes.error.message))
  ) {
    productRes = await buildQuery(false);
  }
  const total = productRes.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (!productRes.error && page > totalPages) {
    redirect(pageUrl(totalPages, filters));
  }

  const symbol = settings.currency_symbol || "$";
  const rawRows: unknown[] = (productRes.data as unknown[]) ?? [];
  const rows: ProductTableRow[] = (rawRows as ProductQueryRow[]).map(
    (product) => {
      const images = [...(product.product_images ?? [])].sort(
        (left, right) => left.sort - right.sort,
      );
      const main = images.find((image) => image.is_main) ?? images[0];
      const totalStock = (product.product_variants ?? []).reduce(
        (sum, variant) => sum + (variant.stock_quantity ?? 0),
        0,
      );
      const categories = (product.product_categories ?? [])
        .map((link) => link.categories?.name)
        .filter((name): name is string => Boolean(name));

      return {
        id: product.id,
        title: product.title,
        slug: product.slug,
        status: product.status,
        current_price: product.current_price,
        mainImage: productImageUrl(main?.path),
        totalStock,
        categories,
        sort: product.sort ?? 0,
      };
    },
  );

  return (
    <div>
      <PageHeader
        title="Products"
        description={
          productRes.error
            ? `Could not load products: ${productRes.error.message}`
            : "Manage your catalog, pricing, imagery and variants."
        }
      >
        {writable && (
          <Button asChild className="rounded-full">
            <Link href="/admin/products/new">
              <Plus className="size-4" /> New product
            </Link>
          </Button>
        )}
      </PageHeader>

      <ProductsTable
        data={rows}
        symbol={symbol}
        canWrite={writable}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        search={search}
        category={category}
        categories={filterOptions}
      />
    </div>
  );
}
