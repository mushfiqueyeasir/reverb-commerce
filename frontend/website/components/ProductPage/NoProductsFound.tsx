"use client";

import { useRouter } from "next/navigation";
import { PackageX } from "lucide-react";

export default function NoProductsFound() {
  const router = useRouter();

  const handleClearAllFilters = () => {
    router.push("/product");
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 lg:py-24">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-foreground/5">
        <PackageX className="h-9 w-9 text-foreground/40" />
      </div>
      <h3 className="mb-3 text-center font-display text-2xl text-foreground lg:text-3xl">
        No products found
      </h3>
      <p className="mb-6 max-w-md text-center text-sm text-foreground/60 lg:text-base">
        We couldn&apos;t find any products matching your filters. Try adjusting
        your search criteria or clear all filters to see all products.
      </p>
      <button
        onClick={handleClearAllFilters}
        className="rounded-full bg-foreground px-7 py-3 text-sm font-medium text-background transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
      >
        Clear all filters
      </button>
    </div>
  );
}
