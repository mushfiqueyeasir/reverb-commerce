import ProductCard from "@/components/Common/ProductCard";
import NoProductsFound from "./NoProductsFound";
import type { TransformedProduct } from "@/type/productType";

interface ProductGridProps {
  products: TransformedProduct[];
  preserveCategory?: string;
}

export default function ProductGrid({
  products,
  preserveCategory,
}: ProductGridProps) {
  if (products.length === 0) {
    return <NoProductsFound preserveCategory={preserveCategory} />;
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-3 xl:grid-cols-4">
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
        />
      ))}
    </div>
  );
}
