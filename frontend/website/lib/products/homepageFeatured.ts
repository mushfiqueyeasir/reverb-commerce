import type { TransformedProduct } from "@/type/productType";

export function selectHomepageProducts(
  products: TransformedProduct[],
  requestedLimit: number,
  maximum = 4,
): TransformedProduct[] {
  const limit = Math.min(maximum, Math.max(1, Math.floor(requestedLimit)));
  const available = products.filter((product) =>
    product.stock.some((item) => item.quantity > 0),
  );
  const soldOut = products.filter(
    (product) => !product.stock.some((item) => item.quantity > 0),
  );
  return [...available, ...soldOut].slice(0, limit);
}
