"use client";

import { useMemo } from "react";
import { useProductStore } from "@/store/productStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import type { TransformedProduct } from "@/type/productType";
import type { Category } from "@/type/categoryType";
import DropdownHeader from "./DropdownHeader";
import { filterTriggerClass } from "./filterTrigger";

interface CategoryFilterProps {
  products: TransformedProduct[];
  categories: Category[];
}

export default function CategoryFilter({
  products,
  categories,
}: CategoryFilterProps) {
  const { filters, setCategories } = useProductStore();

  const availableCategories = useMemo(() => {
    const productCategoryCounts = new Map<string, number>();

    products.forEach((product) => {
      product.categories.forEach((category) => {
        const categoryId = category.categoryUrl.current;
        productCategoryCounts.set(
          categoryId,
          (productCategoryCounts.get(categoryId) || 0) + 1,
        );
      });
    });

    return categories
      .filter((category) => !category.isDefault)
      .map((category) => ({
        id: category.categoryUrl.current,
        name: category.categoryName,
        count: productCategoryCounts.get(category.categoryUrl.current) || 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, categories]);

  const selectedCount = filters.categories.length;

  const toggleCategory = (categoryId: string) => {
    const current = filters.categories;
    if (current.includes(categoryId)) {
      setCategories(current.filter((id) => id !== categoryId));
    } else {
      setCategories([...current, categoryId]);
    }
  };

  const resetCategoryFilter = () => {
    setCategories([]);
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className={filterTriggerClass}>
        Category
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-96 w-[min(16rem,calc(100vw-2rem))] overflow-y-auto p-0">
        <DropdownHeader
          selectedCount={selectedCount}
          onReset={resetCategoryFilter}
        />
        <DropdownMenuSeparator />
        <div className="p-2 space-y-1">
          {availableCategories.map((category) => {
            const isSelected = filters.categories.includes(category.id);
            return (
              <label
                key={category.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-3 hover:bg-foreground/5"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleCategory(category.id)}
                  className="w-4 h-4 border border-border rounded text-foreground focus:ring-2 focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-sm font-normal text-foreground">
                  {category.name} ({category.count})
                </span>
              </label>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
