"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ImageIcon,
  Loader2,
  PackageOpen,
  Save,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/admin/format";
import { cn } from "@/lib/utils";
import { updateVariantStock } from "./actions";

export interface InventoryVariant {
  id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
}

export interface InventoryProduct {
  id: string;
  title: string;
  imageUrl: string | null;
  variants: InventoryVariant[];
}

function StockEditor({
  variant,
  label,
  canWrite,
}: {
  variant: InventoryVariant;
  label: string;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(variant.stock_quantity));
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setValue(String(variant.stock_quantity));
  }, [variant.stock_quantity]);

  const parsedValue = Number(value);
  const valid =
    value !== "" && Number.isFinite(parsedValue) && parsedValue >= 0;
  const nextStock = valid ? Math.trunc(parsedValue) : 0;
  const dirty = valid && nextStock !== variant.stock_quantity;

  const save = () => {
    startTransition(async () => {
      const res = await updateVariantStock(variant.id, nextStock);
      if (res && "error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      setValue(String(nextStock));
      toast.success("Stock updated");
      router.refresh();
    });
  };

  return (
    <form
      className="flex w-full items-center gap-2 sm:w-auto"
      onSubmit={(event) => {
        event.preventDefault();
        if (dirty) save();
      }}
    >
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!canWrite || pending}
        aria-label={`Stock for ${label}`}
        className="h-10 w-full min-w-0 rounded-full sm:w-24"
      />
      {canWrite ? (
        <Button
          type="submit"
          size="icon"
          variant="outline"
          disabled={!dirty || pending}
          className="size-10 shrink-0 rounded-full"
          aria-label={`Save stock for ${label}`}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
        </Button>
      ) : null}
    </form>
  );
}

function getVariantCountLabel(variants: InventoryVariant[]) {
  const sizeCount = new Set(
    variants.map((variant) => variant.size).filter(Boolean),
  ).size;

  if (sizeCount === 0) {
    return `${variants.length} inventory option${variants.length === 1 ? "" : "s"}`;
  }

  const sizes = `${sizeCount} size${sizeCount === 1 ? "" : "s"}`;
  return variants.length === sizeCount
    ? sizes
    : `${sizes} · ${variants.length} variants`;
}

function getVariantLabel(variant: InventoryVariant) {
  return variant.size ? `Size ${variant.size}` : "General inventory";
}

export function InventoryTable({
  data,
  canWrite,
}: {
  data: InventoryProduct[];
  canWrite: boolean;
}) {
  const [lowOnly, setLowOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = data.filter((product) => {
    const hasLowStock = product.variants.some(
      (variant) => variant.stock_quantity <= variant.low_stock_threshold,
    );
    if (lowOnly && !hasLowStock) return false;
    if (!normalizedQuery) return true;

    return (
      product.title.toLowerCase().includes(normalizedQuery) ||
      product.variants.some((variant) =>
        [variant.size, variant.color, variant.sku].some((value) =>
          (value ?? "").toLowerCase().includes(normalizedQuery),
        ),
      )
    );
  });

  const toggleExpanded = (productId: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, sizes or SKUs…"
            className="h-11 rounded-full border-border bg-card/60 pl-9"
          />
        </div>
        <Button
          variant={lowOnly ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setLowOnly((v) => !v)}
        >
          {lowOnly ? "Showing low stock" : "Low stock only"}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-border bg-card/80 px-4 py-12 text-center">
          <PackageOpen className="mb-3 size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {data.length === 0
              ? "No inventory found."
              : "No products match these filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((product) => {
            const isExpanded = expanded.has(product.id);
            const totalStock = product.variants.reduce(
              (total, variant) => total + variant.stock_quantity,
              0,
            );
            const lowCount = product.variants.filter(
              (variant) =>
                variant.stock_quantity <= variant.low_stock_threshold,
            ).length;

            return (
              <article
                key={product.id}
                className="overflow-hidden rounded-xl border border-border bg-card/80"
              >
                <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <ImageIcon className="size-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate font-medium text-foreground">
                        {product.title}
                      </h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {getVariantCountLabel(product.variants)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {product.variants.length === 0 ? (
                          <Badge variant="secondary">No inventory</Badge>
                        ) : totalStock <= 0 ? (
                          <Badge variant="destructive">Out of stock</Badge>
                        ) : lowCount > 0 ? (
                          <Badge variant="warning">{lowCount} low stock</Badge>
                        ) : (
                          <Badge variant="success">In stock</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3 sm:justify-end sm:border-0 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Combined stock
                      </p>
                      <p className="text-xl font-semibold tabular-nums text-foreground">
                        {formatNumber(totalStock)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-10 rounded-full"
                      onClick={() => toggleExpanded(product.id)}
                      aria-expanded={isExpanded}
                      aria-controls={`inventory-${product.id}`}
                      aria-label={`${isExpanded ? "Hide" : "Show"} stock breakdown for ${product.title}`}
                    >
                      <ChevronDown
                        className={cn(
                          "size-4 transition-transform",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </Button>
                  </div>
                </div>

                {isExpanded ? (
                  <div
                    id={`inventory-${product.id}`}
                    className="border-t border-border bg-muted/20"
                  >
                    <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto] gap-4 border-b border-border/60 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:grid">
                      <span>Size / option</span>
                      <span>SKU</span>
                      <span>Status</span>
                      <span className="pr-12 text-right">Stock</span>
                    </div>

                    {product.variants.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                        Add an inventory option from the product editor.
                      </p>
                    ) : (
                      <div className="divide-y divide-border/60">
                        {product.variants.map((variant) => {
                          const label = getVariantLabel(variant);
                          const isOut = variant.stock_quantity <= 0;
                          const isLow =
                            variant.stock_quantity <=
                            variant.low_stock_threshold;

                          return (
                            <div
                              key={variant.id}
                              className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto] sm:items-center sm:gap-4"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                  {label}
                                </p>
                                {variant.color ? (
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {variant.color}
                                  </p>
                                ) : null}
                              </div>
                              <p className="truncate text-xs text-muted-foreground">
                                {variant.sku ?? "No SKU"}
                              </p>
                              <div>
                                {isOut ? (
                                  <Badge variant="destructive">Out</Badge>
                                ) : isLow ? (
                                  <Badge variant="warning">Low</Badge>
                                ) : (
                                  <Badge variant="success">In stock</Badge>
                                )}
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  Low at {variant.low_stock_threshold}
                                </p>
                              </div>
                              <StockEditor
                                variant={variant}
                                label={`${product.title}, ${label}`}
                                canWrite={canWrite}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
