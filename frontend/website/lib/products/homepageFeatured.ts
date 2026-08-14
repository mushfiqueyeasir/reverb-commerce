import type { HomepageProductSelection } from "@/lib/cms/homepageSections";
import type { TransformedProduct } from "@/type/productType";

function discountPercent(product: TransformedProduct): number {
  if (
    !Number.isFinite(product.originalPrice) ||
    !Number.isFinite(product.currentPrice) ||
    product.originalPrice <= 0 ||
    product.currentPrice < 0 ||
    product.currentPrice >= product.originalPrice
  ) {
    return 0;
  }
  return (
    ((product.originalPrice - product.currentPrice) / product.originalPrice) *
    100
  );
}

function createdTime(product: TransformedProduct): number {
  const value = Date.parse(product.createdAt);
  return Number.isFinite(value) ? value : 0;
}

export function selectHomepageProducts(
  products: readonly TransformedProduct[],
  requestedLimit: number,
  maximum = 4,
  selection: HomepageProductSelection = "featured",
): TransformedProduct[] {
  const limit = Math.min(maximum, Math.max(1, Math.floor(requestedLimit)));
  const ranked = products
    .map((product, index) => ({ product, index }))
    .filter(
      ({ product }) => selection !== "deals" || discountPercent(product) > 0,
    )
    .sort((a, b) => {
      const difference =
        selection === "deals"
          ? discountPercent(b.product) - discountPercent(a.product)
          : selection === "new-arrivals"
            ? createdTime(b.product) - createdTime(a.product)
            : 0;
      return difference || a.index - b.index;
    })
    .map(({ product }) => product);
  const available = ranked.filter((product) =>
    product.stock.some((item) => item.quantity > 0),
  );
  const soldOut = ranked.filter(
    (product) => !product.stock.some((item) => item.quantity > 0),
  );
  return [...available, ...soldOut].slice(0, limit);
}
