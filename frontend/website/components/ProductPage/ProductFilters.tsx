"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  CircleDollarSign,
  PackageCheck,
  Search,
  SlidersHorizontal,
  Tags,
  X,
} from "lucide-react";
import { CategoryMultiSelectPanel } from "@/components/Common/CategoryMultiSelectPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/type/categoryType";
import type { StorefrontProductSort } from "@/utility/getProducts";
import type { ProductCardVariant } from "@/components/Common/ProductCard";
import ProductGridSkeleton from "./ProductGridSkeleton";

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
  children?: ReactNode;
  productCardVariant?: ProductCardVariant;
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
  children,
  productCardVariant = "default",
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
  const [searchDraft, setSearchDraft] = useState(filters.search);

  const navigate = useCallback(
    (updates: Record<string, string>) => {
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
    },
    [router, pathname, searchParams, startTransition],
  );

  useEffect(() => {
    setPriceFrom(filters.minPrice === null ? "" : String(filters.minPrice));
    setPriceTo(filters.maxPrice === null ? "" : String(filters.maxPrice));
  }, [filters.minPrice, filters.maxPrice]);

  const searchAppliedRef = useRef(filters.search);
  useEffect(() => {
    if (searchAppliedRef.current === filters.search) return;
    searchAppliedRef.current = filters.search;
    setSearchDraft(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const trimmed = searchDraft.trim();
    if (trimmed === filters.search) return;
    const timeout = setTimeout(() => navigate({ search: trimmed }), 350);
    return () => clearTimeout(timeout);
  }, [searchDraft, filters.search, navigate]);
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
  const priceLabel = hasPrice
    ? `৳${(filters.minPrice ?? 0).toLocaleString()} – ৳${(
        filters.maxPrice ?? maxCatalogPrice
      ).toLocaleString()}`
    : "Price";

  const sectionLabel = (icon: ReactNode, label: string, count = 0) => (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary-readable">
        {icon}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground">
        {label}
      </span>
      {count ? (
        <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
          {count}
        </span>
      ) : null}
    </div>
  );

  const categoriesPanel = (
    <div>
      {sectionLabel(
        <Tags className="size-3.5" />,
        "Categories",
        filters.categories.length,
      )}
      <CategoryMultiSelectPanel
        options={categoryOptions}
        selected={filters.categories}
        variant="brand"
        onToggle={(slug) =>
          toggleListValue("category", filters.categories, slug)
        }
        onClear={() => navigate({ category: "" })}
      />
    </div>
  );

  const availabilityPanel = (
    <div>
      {sectionLabel(
        <PackageCheck className="size-3.5" />,
        "Availability",
        filters.availability.length,
      )}
      <div className="space-y-1">
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
                toggleListValue("availability", filters.availability, value)
              }
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                checked
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-md border-2 ${checked ? "border-primary bg-primary/20 text-foreground" : "border-foreground/40 bg-background"}`}
              >
                {checked ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : null}
              </span>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const pricePanel = (
    <div>
      {sectionLabel(
        <CircleDollarSign className="size-3.5" />,
        "Price",
        hasPrice ? 1 : 0,
      )}
      <p className="mb-3 text-xs text-muted-foreground">
        Up to ৳{maxCatalogPrice.toLocaleString()}
      </p>
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
            className="h-10 rounded-xl"
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
            className="h-10 rounded-xl"
          />
        </label>
      </div>
      <Button
        type="button"
        className="mt-3 h-10 w-full rounded-full"
        onClick={applyPrice}
      >
        Apply price
      </Button>
    </div>
  );

  const searchPanel = (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={searchDraft}
        onChange={(event) => setSearchDraft(event.target.value)}
        placeholder="Search products"
        className="h-10 rounded-full pl-10 pr-9"
        aria-label="Search products"
      />
      {searchDraft ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setSearchDraft("")}
          className="absolute right-3 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );

  const sortPanel = (
    <div className="relative">
      <Select
        value={filters.sort}
        onValueChange={(value) =>
          navigate({
            sort: value === "featured" ? "" : value,
          })
        }
        disabled={isPending}
      >
        <SelectTrigger className="h-11 w-full rounded-full bg-background px-4">
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
  );

  const filterSections = (
    <div className="space-y-7">
      {categoriesPanel}
      {availabilityPanel}
      {pricePanel}
    </div>
  );

  const sidebar = (
    <aside className="hidden lg:block">
      <div className="sticky top-32 space-y-7 rounded-2xl border border-border bg-card/60 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary-readable">
              <SlidersHorizontal className="size-4" />
            </span>
            Filters
            {activeCount ? (
              <span className="min-w-6 rounded-full bg-primary px-2 py-0.5 text-center text-xs font-semibold text-primary-foreground">
                {activeCount}
              </span>
            ) : null}
          </div>
          {activeCount ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-full text-xs"
              onClick={() => startTransition(() => router.push(pathname))}
            >
              Clear all
            </Button>
          ) : null}
        </div>
        {filterSections}
      </div>
    </aside>
  );

  const mobileDrawer = (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            disabled={isPending}
            className="relative h-11 w-full rounded-full px-4"
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {activeCount ? (
              <span className="ml-1 flex min-w-6 items-center justify-center rounded-full bg-primary px-2 py-0.5 text-center text-xs font-semibold text-primary-foreground">
                {activeCount}
              </span>
            ) : null}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="flex flex-col gap-0 overflow-hidden p-4"
        >
          <SheetTitle className="sr-only">Filters</SheetTitle>
          <div className="min-h-0 flex-1 overflow-y-auto pb-4 pt-1">
            {filterSections}
            {activeCount ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-6 h-8 rounded-full text-xs"
                onClick={() => startTransition(() => router.push(pathname))}
              >
                Clear all
              </Button>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );

  return (
    <div className="mb-7 gap-8 lg:mb-12 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
      <div className="hidden lg:block">{sidebar}</div>
      <div className="min-w-0">
        <div className="mb-4 grid grid-cols-2 gap-3 sm:hidden">
          {mobileDrawer}
          {sortPanel}
        </div>
        <div className="mb-4 hidden sm:block lg:hidden">{mobileDrawer}</div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 sm:max-w-md">{searchPanel}</div>
          <div className="hidden w-64 sm:block">{sortPanel}</div>
        </div>
        {activeCount ? (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active
            </span>
            {filters.search ? (
              <button
                type="button"
                onClick={() => navigate({ search: "" })}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs transition hover:border-primary/50 hover:bg-primary/5"
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
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs transition hover:border-primary/50 hover:bg-primary/5"
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
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs transition hover:border-primary/50 hover:bg-primary/5"
              >
                {value === "in-stock" ? "In stock" : "Out of stock"}
                <X className="size-3" />
              </button>
            ))}
            {hasPrice ? (
              <button
                type="button"
                onClick={() => navigate({ minPrice: "", maxPrice: "" })}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs transition hover:border-primary/50 hover:bg-primary/5"
              >
                {priceLabel} <X className="size-3" />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="mb-6 flex items-center justify-between gap-3 px-1">
          <p className="text-sm text-muted-foreground">
            Showing {firstResult.toLocaleString()}–{lastResult.toLocaleString()}{" "}
            of {total.toLocaleString()} products
          </p>
        </div>

        {isPending ? (
          <ProductGridSkeleton variant={productCardVariant} />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
