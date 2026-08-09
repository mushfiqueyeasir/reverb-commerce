"use client";

import { useProductStore } from "@/store/productStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import DropdownHeader from "./DropdownHeader";
import { filterTriggerClass } from "./filterTrigger";
import { cn } from "@/lib/utils";

export default function SortDropdown() {
  const { filters, setSortBy } = useProductStore();

  const getSortLabel = () => {
    switch (filters.sortBy) {
      case "featured":
        return "Featured";
      case "price-low":
        return "Price: Low to High";
      case "price-high":
        return "Price: High to Low";
      case "name-a-z":
        return "Name: A-Z";
      case "name-z-a":
        return "Name: Z-A";
      default:
        return "Featured";
    }
  };

  const sortOptions = [
    { value: "featured", label: "Featured" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name-a-z", label: "Name: A-Z" },
    { value: "name-z-a", label: "Name: Z-A" },
  ] as const;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn(filterTriggerClass, "max-w-[55vw] sm:max-w-none")}
      >
        <span className="truncate">
          <span className="sm:hidden">Sort</span>
          <span className="hidden sm:inline">Sort by: {getSortLabel()}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[min(16rem,calc(100vw-2rem))] p-0">
        <DropdownHeader
          selectedCount={filters.sortBy !== "featured" ? 1 : 0}
          onReset={() => setSortBy("featured")}
          label="selected"
        />
        <DropdownMenuSeparator />
        <div className="space-y-1 p-2">
          {sortOptions.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-3 hover:bg-foreground/5"
            >
              <input
                type="radio"
                name="sort"
                value={option.value}
                checked={filters.sortBy === option.value}
                onChange={() =>
                  setSortBy(option.value as typeof filters.sortBy)
                }
                className="h-4 w-4 rounded-full border border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
              />
              <span className="text-sm font-normal text-foreground">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
