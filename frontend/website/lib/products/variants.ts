import { DEFAULT_TEE_SIZE_CHART } from "./sizeChart";
import type { ProductSizeChartRow, ProductStock } from "@/type/productType";

export interface DefaultVariantRow {
  size: string;
  color: string;
  sku: string;
  stock_quantity: string;
  low_stock_threshold: string;
}

/** Standard tee sizes — same set as the size chart defaults. */
export const DEFAULT_TEE_VARIANTS: DefaultVariantRow[] =
  DEFAULT_TEE_SIZE_CHART.map((row) => ({
    size: row.size,
    color: "",
    sku: "",
    stock_quantity: "0",
    low_stock_threshold: "5",
  }));

export function getProductSizeOptions(
  sizeChart: ProductSizeChartRow[],
  stock: ProductStock[],
): string[] {
  const sizes = sizeChart.length
    ? sizeChart.map((row) => row.size)
    : stock.length
      ? stock
          .map((item) => item.size)
          .filter((size): size is string => Boolean(size))
      : DEFAULT_TEE_SIZE_CHART.map((row) => row.size);

  return [...new Set(sizes.map((size) => size.trim()).filter(Boolean))];
}
