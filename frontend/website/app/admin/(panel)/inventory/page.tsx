import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { productImageUrl } from "@/utility/imageUrl";
import { InventoryTable, type InventoryProduct } from "./InventoryTable";

export const dynamic = "force-dynamic";

interface ProductQueryRow {
  id: string;
  title: string;
  product_images: { path: string; is_main: boolean; sort: number }[];
  product_variants: {
    id: string;
    size: string | null;
    color: string | null;
    sku: string | null;
    stock_quantity: number;
    low_stock_threshold: number;
  }[];
}

export default async function InventoryPage() {
  const session = await requireAdminSession();
  const writable = canWrite(session.role);
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("products")
    .select(
      `id, title,
       product_images ( path, is_main, sort ),
       product_variants ( id, size, color, sku, stock_quantity, low_stock_threshold )`,
    )
    .order("title", { ascending: true });

  const products: InventoryProduct[] = (
    (data ?? []) as unknown as ProductQueryRow[]
  ).map((product) => {
    const images = [...(product.product_images ?? [])].sort(
      (a, b) => a.sort - b.sort,
    );
    const mainImage = images.find((image) => image.is_main) ?? images[0];

    return {
      id: product.id,
      title: product.title,
      imageUrl: productImageUrl(mainImage?.path),
      variants: product.product_variants ?? [],
    };
  });

  const variantCount = products.reduce(
    (total, product) => total + product.variants.length,
    0,
  );
  const lowCount = products.reduce(
    (total, product) =>
      total +
      product.variants.filter(
        (variant) => variant.stock_quantity <= variant.low_stock_threshold,
      ).length,
    0,
  );

  return (
    <div>
      <PageHeader
        title="Inventory"
        description={`${products.length} products · ${variantCount} variants · ${lowCount} at or below their low-stock threshold.`}
      />
      <InventoryTable data={products} canWrite={writable} />
    </div>
  );
}
