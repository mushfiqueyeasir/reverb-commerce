"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  CircleDollarSign,
  PackageCheck,
  SlidersHorizontal,
  Tags,
  X,
} from "lucide-react";
import { CategoryMultiSelectPanel } from "@/components/Common/CategoryMultiSelectPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/type/categoryType";
import type { StorefrontProductSort } from "@/utility/getProducts";

export interface StorefrontFilterState {
  categories: string[];
  availability: ("in-stock" | "out-of-stock")[];
  minPrice: number | null;
  maxPrice: number | null;
  search: string;
  sort: StorefrontProductSort;
}

interface ProductFiltersProps {
  categories: Category[];
  filters: StorefrontFilterState;
  maxCatalogPrice: number;
  firstResult: number;
  lastResult: number;
  total: number;
}

const SORT_OPTIONS: { value: StorefrontProductSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price: Low to high" },
  { value: "price-high", label: "Price: High to low" },
  { value: "name-a-z", label: "Name: A–Z" },
  { value: "name-z-a", label: "Name: Z–A" },
];

export default function ProductFilters({
  categories,
  filters,
  maxCatalogPrice,
  firstResult,
  lastResult,
  total,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [priceFrom, setPriceFrom] = useState(
    filters.minPrice === null ? "" : String(filters.minPrice),
  );
  const [priceTo, setPriceTo] = useState(
    filters.maxPrice === null ? "" : String(filters.maxPrice),
  );

  useEffect(() => {
    setPriceFrom(filters.minPrice === null ? "" : String(filters.minPrice));
    setPriceTo(filters.maxPrice === null ? "" : String(filters.maxPrice));
  }, [filters.minPrice, filters.maxPrice]);

  const navigate = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [name, value] of Object.entries(updates)) {
      if (value) next.set(name, value);
      else next.delete(name);
    }
    next.delete("page");
    const query = next.toString();
    startTransition(() =>
      router.push(`${pathname}${query ? `?${query}` : ""}`, {
        scroll: false,
      }),
    );
  };
  const toggleListValue = (
    name: "category" | "availability",
    current: string[],
    value: string,
  ) => {
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    navigate({ [name]: next.join(",") });
  };
  const applyPrice = () => {
    const from = priceFrom === "" ? null : Math.max(0, Number(priceFrom));
    const to = priceTo === "" ? null : Math.max(0, Number(priceTo));
    if (
      (from !== null && !Number.isFinite(from)) ||
      (to !== null && !Number.isFinite(to))
    ) {
      return;
    }
    const minimum = from !== null && to !== null && from > to ? to : from;
    const maximum = from !== null && to !== null && from > to ? from : to;
    navigate({
      minPrice: minimum === null ? "" : String(minimum),
      maxPrice: maximum === null ? "" : String(maximum),
    });
  };
  const availableCategories = categories.filter(
    (category) => !category.isDefault,
  );
  const categoryBySlug = new Map(
    availableCategories.map((category) => [
      category.categoryUrl.current,
      category,
    ]),
  );
  const categoryById = new Map(
    availableCategories.map((category) => [category._id, category]),
  );
  const categoryOptions = availableCategories.map((category) => ({
    id: category.categoryUrl.current,
    name: category.categoryName,
    parentId: category.parentId
      ? (categoryById.get(category.parentId)?.categoryUrl.current ?? null)
      : null,
    depth: category.depth,
  }));
  const hasPrice = filters.minPrice !== null || filters.maxPrice !== null;
  const activeCount =
    filters.categories.length +
    filters.availability.length +
    (hasPrice ? 1 : 0) +
    (filters.search ? 1 : 0);
  const categoryLabel = filters.categories.length
    ? `${filters.categories.length} ${filters.categories.length === 1 ? "category" : "categories"}`
    : "Categories";
  const availabilityLabel = filters.availability.length
    ? filters.availability.length === 2
      ? "All stock"
      : filters.availability[0] === "in-stock"
        ? "In stock"
        : "Out of stock"
    : "Availability";
  const priceLabel = hasPrice
    ? `৳${(filters.minPrice ?? 0).toLocaleString()} – ৳${(
        filters.maxPrice ?? maxCatalogPrice
      ).toLocaleString()}`
    : "Price";

  return (
    <div className="mb-7 space-y-3 sm:mb-9">
      <div className="rounded-2xl border border-border bg-card/70 p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 scrollbar-hide xl:flex-wrap xl:overflow-visible xl:pb-0">
            <div className="mr-1 hidden items-center gap-2 text-sm font-medium text-foreground lg:flex">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <SlidersHorizontal className="size-4" />
              </span>
              Filters
              <span
                aria-hidden={activeCount === 0}
                className={`min-w-6 rounded-full bg-primary px-2 py-0.5 text-center text-xs text-primary-foreground ${activeCount === 0 ? "invisible" : ""}`}
              >
                {activeCount || 0}
              </span>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isPending}
                  className={`h-11 shrink-0 rounded-full px-4 ${filters.categories.length ? "border-primary/40 bg-primary/5 text-primary" : ""}`}
                >
                  <Tags className="size-4" />
                  {categoryLabel}
                  <ChevronDown className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-[min(25rem,calc(100vw-2rem))]"
              >
                <CategoryMultiSelectPanel
                  options={categoryOptions}
                  selected={filters.categories}
                  variant="brand"
                  onToggle={(slug) =>
                    toggleListValue("category", filters.categories, slug)
                  }
                  onClear={() => navigate({ category: "" })}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isPending}
                  className={`h-11 shrink-0 rounded-full px-4 ${filters.availability.length ? "border-primary/40 bg-primary/5 text-primary" : ""}`}
                >
                  <PackageCheck className="size-4" />
                  {availabilityLabel}
                  <ChevronDown className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold">Availability</p>
                  <p className="text-xs text-muted-foreground">
                    Choose one or both options
                  </p>
                </div>
                <div className="space-y-1 p-2">
                  {[
                    ["in-stock", "In stock"],
                    ["out-of-stock", "Out of stock"],
                  ].map(([value, label]) => {
                    const checked = filters.availability.includes(
                      value as "in-stock" | "out-of-stock",
                    );
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          toggleListValue(
                            "availability",
                            filters.availability,
                            value,
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition hover:bg-muted"
                      >
                        <span
                          className={`flex size-4 items-center justify-center rounded border ${checked ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}
                        >
                          {checked ? <Check className="size-3" /> : null}
                        </span>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isPending}
                  className={`h-11 shrink-0 rounded-full px-4 ${hasPrice ? "border-primary/40 bg-primary/5 text-primary" : ""}`}
                >
                  <CircleDollarSign className="size-4" />
                  {priceLabel}
                  <ChevronDown className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Price range</p>
                    <p className="text-xs text-muted-foreground">
                      Up to ৳{maxCatalogPrice.toLocaleString()}
                    </p>
                  </div>
                  {hasPrice ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate({ minPrice: "", maxPrice: "" })}
                    >
                      Clear
                    </Button>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1.5 text-xs text-muted-foreground">
                    Minimum
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={priceFrom}
                      onChange={(event) => setPriceFrom(event.target.value)}
                      placeholder="৳0"
                      className="h-11"
                    />
                  </label>
                  <label className="space-y-1.5 text-xs text-muted-foreground">
                    Maximum
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={priceTo}
                      onChange={(event) => setPriceTo(event.target.value)}
                      placeholder={`৳${maxCatalogPrice}`}
                      className="h-11"
                    />
                  </label>
                </div>
                <Button
                  type="button"
                  className="mt-4 h-11 w-full rounded-full"
                  onClick={applyPrice}
                >
                  Apply price
                </Button>
              </PopoverContent>
            </Popover>
          </div>

          <Select
            value={filters.sort}
            onValueChange={(value) =>
              navigate({
                sort: value === "featured" ? "" : value,
              })
            }
            disabled={isPending}
          >
            <SelectTrigger className="h-11 w-full rounded-full bg-background px-4 sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeCount ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Active
          </span>
          {filters.search ? (
            <button
              type="button"
              onClick={() => navigate({ search: "" })}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs transition hover:bg-muted/80"
            >
              Search: {filters.search} <X className="size-3" />
            </button>
          ) : null}
          {filters.categories.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() =>
                navigate({
                  category: filters.categories
                    .filter((value) => value !== slug)
                    .join(","),
                })
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs transition hover:bg-muted/80"
            >
              {categoryBySlug.get(slug)?.categoryName ?? slug}
              <X className="size-3" />
            </button>
          ))}
          {filters.availability.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                navigate({
                  availability: filters.availability
                    .filter((item) => item !== value)
                    .join(","),
                })
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs transition hover:bg-muted/80"
            >
              {value === "in-stock" ? "In stock" : "Out of stock"}
              <X className="size-3" />
            </button>
          ))}
          {hasPrice ? (
            <button
              type="button"
              onClick={() => navigate({ minPrice: "", maxPrice: "" })}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs transition hover:bg-muted/80"
            >
              {priceLabel} <X className="size-3" />
            </button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => startTransition(() => router.push(pathname))}
          >
            Clear all
          </Button>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-sm text-muted-foreground">
          Showing {firstResult.toLocaleString()}–{lastResult.toLocaleString()}{" "}
          of {total.toLocaleString()} products
        </p>
        {isPending ? (
          <span className="text-xs text-primary">Updating…</span>
        ) : null}
      </div>
    </div>
  );
}
