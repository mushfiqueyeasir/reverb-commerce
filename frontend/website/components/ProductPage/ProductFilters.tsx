"use client";

import { useProductStore } from "@/store/productStore";
import AvailabilityFilter from "./AvailabilityFilter";
import PriceFilter from "./PriceFilter";
import CategoryFilter from "./CategoryFilter";
import SortDropdown from "./SortDropdown";
import ProductCount from "./ProductCount";
import type { TransformedProduct } from "@/type/productType";
import type { Category } from "@/type/categoryType";
import { useRouter } from "next/navigation";

interface ProductFiltersProps {
  products: TransformedProduct[];
  filteredProducts: TransformedProduct[];
  categories: Category[];
  /** Keep this category in the URL when resetting other filters. */
  preserveCategory?: string;
}

export default function ProductFilters({
  products,
  filteredProducts,
  categories,
  preserveCategory,
}: ProductFiltersProps) {
  const { resetFilters, filters } = useProductStore();
  const router = useRouter();

  const hasActiveFilters =
    filters.availability.length > 0 ||
    filters.categories.length > 0 ||
    filters.priceRange.from !== null ||
    filters.priceRange.to !== null ||
    filters.searchQuery.trim().length > 0 ||
    filters.sortBy !== "featured";

  const handleResetAll = () => {
    resetFilters();
    if (preserveCategory) {
      useProductStore.getState().setCategories([preserveCategory]);
      router.push(`/product?category=${encodeURIComponent(preserveCategory)}`);
      return;
    }
    router.push("/product");
  };

  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:gap-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible sm:pb-0">
        <span className="hidden shrink-0 text-sm font-normal text-muted-foreground sm:inline">
          Filter:
        </span>
        <CategoryFilter products={products} categories={categories} />
        <AvailabilityFilter products={products} />
        <PriceFilter products={products} />
        <button
          type="button"
          onClick={handleResetAll}
          disabled={!hasActiveFilters}
          className={`inline-flex h-11 shrink-0 items-center px-2 text-sm font-normal transition-colors ${
            hasActiveFilters
              ? "cursor-pointer text-foreground underline-offset-4 hover:text-primary hover:underline"
              : "cursor-not-allowed text-muted-foreground/70"
          }`}
        >
          Reset
        </button>
      </div>

      <div className="flex min-w-0 items-center justify-between gap-3">
        <ProductCount count={filteredProducts.length} />
        <SortDropdown />
      </div>
    </div>
  );
}
