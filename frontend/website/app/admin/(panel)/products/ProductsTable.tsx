"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { AdminList } from "@/components/admin/AdminList";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney, formatNumber } from "@/lib/admin/format";
import { deleteProduct } from "./actions";

export interface ProductTableRow {
  id: string;
  title: string;
  slug: string;
  status: "active" | "draft" | "archived";
  current_price: number;
  mainImage: string | null;
  totalStock: number;
  categories: string[];
  sort: number;
}

export interface ProductFilterOption {
  id: string;
  name: string;
  depth: number;
}

const STATUS_VARIANT: Record<
  ProductTableRow["status"],
  "success" | "warning" | "secondary"
> = {
  active: "success",
  draft: "warning",
  archived: "secondary",
};

export function ProductsTable({
  data,
  symbol,
  canWrite,
  page,
  pageSize,
  total,
  search,
  category,
  categories,
}: {
  data: ProductTableRow[];
  symbol: string;
  canWrite: boolean;
  page: number;
  pageSize: number;
  total: number;
  search: string;
  category: string;
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
      if (value && value !== "all") next.set(name, value);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <form onSubmit={submitSearch} className="flex min-w-0 flex-1 gap-2">
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
          <Button type="submit" variant="outline" disabled={isPending}>
            Search
          </Button>
        </form>
        <Select
          value={category || "all"}
          onValueChange={(value) => navigate({ category: value })}
          disabled={isPending}
        >
          <SelectTrigger className="h-10 w-full rounded-full sm:w-[17rem]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.depth > 0 ? "— ".repeat(option.depth) : ""}
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {search || category ? (
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => {
              setSearchValue("");
              startTransition(() => router.push(pathname));
            }}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      <AdminList
        items={data}
        emptyMessage={
          search || category
            ? "No products match these filters."
            : "No products yet."
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
