import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TransformedProduct } from "@/type/productType";
import type { Category } from "@/type/categoryType";
import type { ProductCardVariant } from "@/components/Common/ProductCard";
import { Button } from "@/components/ui/button";
import ProductFilters, { type StorefrontFilterState } from "./ProductFilters";
import ProductGrid from "./ProductGrid";

interface ProductPageScreenProps {
  products: TransformedProduct[];
  categories: Category[];
  filters: StorefrontFilterState;
  page: number;
  pageSize: number;
  total: number;
  maxCatalogPrice: number;
  previousHref: string | null;
  nextHref: string | null;
  productCardVariant?: ProductCardVariant;
}

export default function ProductPageScreen({
  products,
  categories,
  filters,
  page,
  pageSize,
  total,
  maxCatalogPrice,
  previousHref,
  nextHref,
  productCardVariant = "default",
}: ProductPageScreenProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstResult = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastResult = Math.min(page * pageSize, total);

  return (
    <section className="mx-auto max-w-[1600px] px-5 pb-24 pt-8 sm:px-6 sm:pt-12 md:px-10 md:pt-20">
      <div className="mb-8 border-b border-border pb-6 sm:mb-10 sm:pb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary-readable">
          The Collection
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
          Shop all
        </h1>
      </div>
      <ProductFilters
        categories={categories}
        filters={filters}
        maxCatalogPrice={maxCatalogPrice}
        firstResult={firstResult}
        lastResult={lastResult}
        total={total}
        productCardVariant={productCardVariant}
      >
        <ProductGrid products={products} variant={productCardVariant} />
        {total > 0 ? (
          <nav
            aria-label="Product pagination"
            className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-card/60 px-4 py-4 sm:flex-row sm:px-5"
          >
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              {previousHref ? (
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={previousHref} scroll>
                    <ChevronLeft className="size-4" /> Previous
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" className="rounded-full" disabled>
                  <ChevronLeft className="size-4" /> Previous
                </Button>
              )}
              {nextHref ? (
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={nextHref} scroll>
                    Next <ChevronRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" className="rounded-full" disabled>
                  Next <ChevronRight className="size-4" />
                </Button>
              )}
            </div>
          </nav>
        ) : null}
      </ProductFilters>
    </section>
  );
}
