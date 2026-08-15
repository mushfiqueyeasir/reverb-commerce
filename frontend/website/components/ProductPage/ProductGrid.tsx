import ProductCard, {
  type ProductCardVariant,
} from "@/components/Common/ProductCard";
import NoProductsFound from "./NoProductsFound";
import type { TransformedProduct } from "@/type/productType";

interface ProductGridProps {
  products: TransformedProduct[];
  variant?: ProductCardVariant;
}

export default function ProductGrid({
  products,
  variant = "default",
}: ProductGridProps) {
  if (products.length === 0) {
    return <NoProductsFound />;
  }

  return (
    <div
      className={
        variant === "kawaii-fashion"
          ? "grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-12"
          : "grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-3 xl:grid-cols-5"
      }
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          title={product.title}
          image={product.image}
          hoverImage={product.hoverImage}
          images={product.images}
          originalPrice={product.originalPrice}
          currentPrice={product.currentPrice}
          discount={product.discount}
          href={product.href}
          stock={product.stock}
          sizingMode={product.sizingMode}
          sizeChart={product.sizeChart}
          label={product.categories[0]?.categoryName}
          variant={variant}
        />
      ))}
    </div>
  );
}
