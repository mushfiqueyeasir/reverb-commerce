"use client";

import { useMemo, useEffect } from "react";
import { useProductStore } from "@/store/productStore";
import type { TransformedProduct } from "@/type/productType";
import type { Category } from "@/type/categoryType";

import ProductFilters from "./ProductFilters";
import ProductGrid from "./ProductGrid";

interface ProductPageScreenProps {
  products: TransformedProduct[];
  categories: Category[];
  /** From the server page URL (`?category=`). */
  initialCategory?: string;
  /** From the server page URL (`?search=`). */
  initialSearch?: string;
}

export default function ProductPageScreen({
  products,
  categories,
  initialCategory,
  initialSearch,
}: ProductPageScreenProps) {
  const { getFilteredProducts, filters, setCategories, setSearchQuery } =
    useProductStore();

  // Seed filters from server URL props (no useSearchParams / Suspense).
  useEffect(() => {
    setCategories(initialCategory ? [initialCategory] : []);
    if (initialSearch != null) setSearchQuery(initialSearch);
  }, [initialCategory, initialSearch, setCategories, setSearchQuery]);

  const filteredProducts = useMemo(() => {
    return getFilteredProducts(products, categories);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, categories, getFilteredProducts, filters]);

  return (
    <section className="mx-auto max-w-[1600px] px-5 pb-24 pt-24 sm:px-6 md:px-10 md:pt-36">
      <div className="mb-8 border-b border-border pb-6 sm:mb-10 sm:pb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary">
          The Collection
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
          Shop all
        </h1>
      </div>
      <ProductFilters
        products={products}
        filteredProducts={filteredProducts}
        categories={categories}
        preserveCategory={initialCategory}
      />
      <ProductGrid
        products={filteredProducts}
        preserveCategory={initialCategory}
      />
    </section>
  );
}
