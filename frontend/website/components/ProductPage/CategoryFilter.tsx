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
import { getDescendantSlugs } from "@/lib/categories/hierarchy";
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

  const availableCategories = useMemo(
    () =>
      categories
        .filter((category) => !category.isDefault)
        .map((category) => {
          const id = category.categoryUrl.current;
          const descendantSlugs = getDescendantSlugs(categories, [id]);
          const count = products.filter((product) =>
            product.categories.some((productCategory) =>
              descendantSlugs.has(productCategory.categoryUrl.current),
            ),
          ).length;
          return {
            id,
            name: category.categoryName,
            depth: category.depth,
            count,
          };
        }),
    [products, categories],
  );

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
                style={{ paddingLeft: `${8 + category.depth * 18}px` }}
                className="flex cursor-pointer items-center gap-2 rounded py-3 pr-2 hover:bg-foreground/5"
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
