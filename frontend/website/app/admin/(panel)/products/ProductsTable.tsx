"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  ImageIcon,
  Pencil,
  Search,
  Tags,
  Trash2,
} from "lucide-react";
import { AdminList } from "@/components/admin/AdminList";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { CategoryMultiSelectPanel } from "@/components/Common/CategoryMultiSelectPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatMoney, formatNumber } from "@/lib/admin/format";
import { deleteProduct } from "./actions";

export type ProductStatus = "active" | "draft" | "archived";

export interface ProductTableRow {
  id: string;
  title: string;
  slug: string;
  status: ProductStatus;
  current_price: number;
  mainImage: string | null;
  totalStock: number;
  categories: string[];
  sort: number;
}

export interface ProductFilterOption {
  id: string;
  name: string;
  parentId: string | null;
  depth: number;
}

interface MultiSelectOption {
  value: string;
  label: string;
  depth?: number;
}

const STATUS_VARIANT: Record<
  ProductTableRow["status"],
  "success" | "warning" | "secondary"
> = {
  active: "success",
  draft: "warning",
  archived: "secondary",
};

const STATUS_OPTIONS: MultiSelectOption[] = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

function MultiSelectFilter({
  label,
  allLabel,
  singularLabel,
  selected,
  options,
  disabled,
  onChange,
}: {
  label: string;
  allLabel: string;
  singularLabel: string;
  selected: string[];
  options: MultiSelectOption[];
  disabled: boolean;
  onChange: (values: string[]) => void;
}) {
  const buttonLabel =
    selected.length === 0
      ? allLabel
      : selected.length === 1
        ? `1 ${singularLabel}`
        : `${selected.length} ${label.toLowerCase()}`;
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={`h-10 min-w-44 justify-between rounded-full px-4 font-normal ${selected.length ? "border-primary/40 bg-primary/5 text-foreground" : ""}`}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <CircleDot
              className={`size-4 shrink-0 ${selected.length ? "text-primary" : "text-muted-foreground"}`}
            />
            <span className="truncate">{buttonLabel}</span>
          </span>
          <ChevronDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))]">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">
              {selected.length ? `${selected.length} selected` : allLabel}
            </p>
          </div>
          {selected.length ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
            >
              Clear
            </Button>
          ) : null}
        </div>
        <div className="space-y-1 p-2">
          {options.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option.value)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-muted"
              >
                <span
                  className={`flex size-4 shrink-0 items-center justify-center rounded border ${checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background"}`}
                >
                  {checked ? <Check className="size-3" /> : null}
                </span>
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ProductsTable({
  data,
  symbol,
  canWrite,
  page,
  pageSize,
  total,
  search,
  selectedCategories,
  selectedStatuses,
  categories,
}: {
  data: ProductTableRow[];
  symbol: string;
  canWrite: boolean;
  page: number;
  pageSize: number;
  total: number;
  search: string;
  selectedCategories: string[];
  selectedStatuses: ProductStatus[];
  categories: ProductFilterOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(search);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setSearchValue(search), [search]);

  const navigate = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [name, value] of Object.entries(updates)) {
      if (value) next.set(name, value);
      else next.delete(name);
    }
    next.delete("page");
    const query = next.toString();
    startTransition(() =>
      router.push(`${pathname}${query ? `?${query}` : ""}`),
    );
  };
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate({ search: searchValue.trim() });
  };
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstResult = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastResult = Math.min(page * pageSize, total);
  const pageHref = (nextPage: number) => {
    const next = new URLSearchParams(searchParams.toString());
    if (nextPage > 1) next.set("page", String(nextPage));
    else next.delete("page");
    const query = next.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  };
  const hasFilters =
    Boolean(search) ||
    selectedCategories.length > 0 ||
    selectedStatuses.length > 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card/60 p-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <form
            onSubmit={submitSearch}
            className="flex min-w-0 flex-1 items-stretch gap-2"
          >
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search product titles…"
                className="h-10 rounded-full pl-10"
                maxLength={80}
                disabled={isPending}
              />
            </div>
          </form>
          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  className={`h-10 min-w-44 justify-between rounded-full px-4 font-normal ${selectedCategories.length ? "border-primary/40 bg-primary/5 text-foreground" : ""}`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Tags
                      className={`size-4 shrink-0 ${selectedCategories.length ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="truncate">
                      {selectedCategories.length
                        ? `${selectedCategories.length} ${selectedCategories.length === 1 ? "category" : "categories"}`
                        : "All categories"}
                    </span>
                  </span>
                  <ChevronDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-[min(25rem,calc(100vw-2rem))]"
              >
                <CategoryMultiSelectPanel
                  options={categories}
                  selected={selectedCategories}
                  onToggle={(id) =>
                    navigate({
                      categories: selectedCategories.includes(id)
                        ? selectedCategories
                            .filter((categoryId) => categoryId !== id)
                            .join(",")
                        : [...selectedCategories, id].join(","),
                    })
                  }
                  onClear={() => navigate({ categories: "" })}
                />
              </PopoverContent>
            </Popover>
            <MultiSelectFilter
              label="Statuses"
              allLabel="All statuses"
              singularLabel="status"
              selected={selectedStatuses}
              options={STATUS_OPTIONS}
              disabled={isPending}
              onChange={(values) => navigate({ status: values.join(",") })}
            />
            <Button
              type="button"
              variant="ghost"
              className="h-10 self-center rounded-full px-4"
              disabled={isPending || !hasFilters}
              onClick={() => {
                setSearchValue("");
                startTransition(() => router.push(pathname));
              }}
            >
              Clear all
            </Button>
          </div>
        </div>
      </div>

      <AdminList
        items={data}
        emptyMessage={
          hasFilters ? "No products match these filters." : "No products yet."
        }
        renderLeading={(item) => (
          <div className="relative size-12 overflow-hidden rounded-md border border-border bg-muted">
            {item.mainImage ? (
              <Image
                src={item.mainImage}
                alt={item.title}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <ImageIcon className="size-4" />
              </div>
            )}
          </div>
        )}
        renderTitle={(item) => item.title}
        renderSubtitle={(item) => item.slug}
        renderMeta={(item) => (
          <>
            <Badge variant={STATUS_VARIANT[item.status]} className="capitalize">
              {item.status}
            </Badge>
            <Badge variant="outline">
              {formatMoney(item.current_price, symbol)}
            </Badge>
            <Badge variant="outline">
              Stock {formatNumber(item.totalStock)}
            </Badge>
            {item.categories.slice(0, 2).map((itemCategory) => (
              <Badge key={itemCategory} variant="secondary">
                {itemCategory}
              </Badge>
            ))}
          </>
        )}
        renderTrailing={(item) => (
          <>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <Link href={`/admin/products/${item.id}`} aria-label="Edit">
                <Pencil className="size-4" />
              </Link>
            </Button>
            {canWrite ? (
              <ConfirmDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                }
                title="Delete product"
                description={`Delete "${item.title}"? Images and variants will also be removed.`}
                confirmLabel="Delete"
                action={() => deleteProduct(item.id)}
                onDone={() => router.refresh()}
              />
            ) : null}
          </>
        )}
      />

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {firstResult.toLocaleString()}–{lastResult.toLocaleString()}{" "}
          of {total.toLocaleString()} products
        </p>
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(page - 1)}>
                <ChevronLeft /> Previous
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft /> Previous
            </Button>
          )}
          <span className="min-w-20 text-center text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(page + 1)}>
                Next <ChevronRight />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next <ChevronRight />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
