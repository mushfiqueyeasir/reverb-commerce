"use client";

import Link from "next/link";
import { ArrowUpRight, Search, Sparkles } from "lucide-react";
import ImageLoader from "./ImageLoader";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import type { ProductSearchResult } from "@/type/productSearchType";

export default function ProductSearchResults({
  query,
  products,
  pending,
  error,
  onSelect,
}: {
  query: string;
  products: ProductSearchResult[];
  pending: boolean;
  error: string | null;
  onSelect: () => void;
}) {
  const { format } = useCurrency();

  if (!query.trim()) return null;

  if (pending) {
    return (
      <div className="mt-8 sm:mt-10">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
          Scanning live inventory
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="grid animate-pulse grid-cols-[6.5rem_1fr] overflow-hidden border border-border bg-card/30 sm:block"
            >
              <div className="aspect-[4/5] bg-foreground/5" />
              <div className="space-y-3 p-4">
                <div className="h-3 w-2/3 bg-foreground/10" />
                <div className="h-2 w-1/3 bg-foreground/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 border-l-2 border-destructive bg-destructive/5 px-5 py-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-destructive">
          Search interrupted
        </p>
        <p className="mt-2 text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mt-10 border-y border-border py-14 text-center sm:py-20">
        <span className="mx-auto grid size-12 place-items-center rounded-full border border-border text-muted-foreground">
          <Search className="size-5" />
        </span>
        <p className="mt-5 font-display text-2xl font-semibold">
          No signal found.
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          Nothing in the live collection matches “{query}”. Try a shorter
          product name or ask the AI advisor.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 sm:mt-10">
      <div className="flex items-center justify-between border-b border-border pb-3 font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
        <span>Results / “{query}”</span>
        <span className="text-foreground">
          {String(products.length).padStart(2, "0")} matches
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product, index) => (
          <Link
            key={product.id}
            href={product.href}
            onClick={onSelect}
            className="group relative grid min-w-0 grid-cols-[6.5rem_1fr] overflow-hidden border border-border bg-card/45 transition duration-500 hover:border-primary hover:ring-glow sm:block"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-muted">
              {product.image ? (
                <ImageLoader
                  src={product.image}
                  alt={product.title}
                  width={560}
                  height={700}
                  sizes="(max-width: 639px) 104px, (max-width: 1279px) 50vw, 33vw"
                  className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
                />
              ) : (
                <div className="grid h-full place-items-center">
                  <Sparkles className="size-5 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 hidden bg-gradient-to-t from-black/70 via-transparent to-transparent sm:block" />
              <span className="absolute left-3 top-3 hidden border border-white/15 bg-black/35 px-2 py-1 font-mono text-[8px] tracking-[0.2em] text-white backdrop-blur sm:block">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>

            <div className="flex min-w-0 flex-col justify-center p-4 sm:absolute sm:inset-x-0 sm:bottom-0 sm:z-10 sm:block sm:p-5">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <h3 className="min-w-0 truncate font-display text-base font-semibold sm:text-lg sm:text-white">
                  {product.title}
                </h3>
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border transition group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground sm:border-white/20 sm:text-white">
                  <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
                <span className="text-primary-readable">
                  {format(product.currentPrice)}
                </span>
                {product.originalPrice > product.currentPrice && (
                  <span className="text-muted-foreground line-through sm:text-white/45">
                    {format(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
