"use client";

import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import ImageLoader from "@/components/Common/ImageLoader";
import type { ProductCardVariant } from "@/components/Common/ProductCard";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useStoreName } from "@/components/providers/StoreBrandProvider";
import { useWishlistStore } from "@/store/wishlistStore";
import { toast } from "sonner";

export default function WishlistPageScreen({
  productCardVariant = "default",
}: {
  productCardVariant?: ProductCardVariant;
}) {
  const { items, removeItem, clear } = useWishlistStore();
  const { format } = useCurrency();
  const storeName = useStoreName();

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-[1600px] px-5 pb-24 pt-24 sm:px-6 md:px-10 md:pt-36">
        <div className="py-16 text-center sm:py-20">
          <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full border border-border bg-card">
            <Heart className="size-6 text-muted-foreground" />
          </div>
          <h2 className="font-display text-3xl font-bold">No favorites yet</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
            Tap the heart on any product to save it here. Favorites stay on this
            device.
          </p>
          <Link
            href="/product"
            className="mt-7 inline-flex h-12 items-center rounded-full bg-foreground px-7 text-sm font-semibold uppercase tracking-wider text-background transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
          >
            Browse products
          </Link>
        </div>
      </section>
    );
  }

  const isKawaii = productCardVariant === "kawaii-fashion";

  return (
    <section className="mx-auto max-w-[1600px] px-5 pb-24 pt-24 sm:px-6 md:px-10 md:pt-36">
      <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between lg:mb-10">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Favorites
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {items.length} saved {items.length === 1 ? "item" : "items"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => {
              clear();
              toast.success("Favorites cleared");
            }}
            className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary-readable hover:underline"
          >
            Clear all
          </button>
          <Link
            href="/product"
            className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary-readable hover:underline"
          >
            Continue shopping
          </Link>
        </div>
      </div>

      {isKawaii ? (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-5 lg:gap-x-7 lg:gap-y-12">
          {items.map((item) => (
            <li key={item.id}>
              <article className="group">
                <div className="relative aspect-[3/4] overflow-hidden border border-border bg-card">
                  <Link
                    href={item.href}
                    className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                  >
                    <ImageLoader
                      src={item.image}
                      alt={item.title}
                      width={750}
                      height={1000}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025] motion-reduce:transition-none"
                    />
                  </Link>
                  <button
                    type="button"
                    aria-label="Remove from favorites"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeItem(item.id);
                      toast.success("Removed from favorites");
                    }}
                    className="absolute right-3 top-3 grid size-10 place-items-center border border-primary bg-primary text-primary-foreground backdrop-blur-sm transition-colors sm:right-4 sm:top-4"
                  >
                    <Heart className="size-4 fill-current" />
                  </button>
                </div>
                <Link
                  href={item.href}
                  className="block pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
                >
                  <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {storeName}
                  </p>
                  <h3 className="mt-1 line-clamp-2 font-display text-base font-semibold leading-snug tracking-[-0.025em] text-foreground sm:text-lg">
                    {item.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="font-semibold text-foreground">
                      {format(item.currentPrice)}
                    </span>
                    {item.originalPrice > item.currentPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        {format(item.originalPrice)}
                      </span>
                    )}
                  </div>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
          {items.map((item) => (
            <li key={item.id}>
              <article className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 hover:border-foreground/20 hover:ring-glow">
                <div className="relative aspect-[4/5] overflow-hidden bg-surface">
                  <Link href={item.href} className="block h-full w-full">
                    <ImageLoader
                      src={item.image}
                      alt={item.title}
                      width={800}
                      height={1000}
                      className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
                    />
                  </Link>

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-90" />

                  <button
                    type="button"
                    aria-label="Remove from favorites"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeItem(item.id);
                      toast.success("Removed from favorites");
                    }}
                    className="absolute right-2.5 top-2.5 grid size-11 place-items-center rounded-full border border-border bg-background/60 text-foreground backdrop-blur-md transition hover:border-primary hover:bg-primary hover:text-primary-foreground sm:right-4 sm:top-4"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <Link
                    href={item.href}
                    className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-center rounded-full bg-foreground/95 px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-background backdrop-blur-md transition-all duration-500 sm:inset-x-4 sm:bottom-4 sm:px-5 sm:py-3 sm:text-[12px] sm:tracking-[0.2em] md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
                  >
                    View Product
                  </Link>
                </div>

                <Link
                  href={item.href}
                  className="flex items-start justify-between gap-3 p-3 sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-base font-semibold tracking-tight sm:text-lg">
                      {item.title}
                    </h3>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {storeName}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                      {format(item.currentPrice)}
                    </div>
                    {item.originalPrice > item.currentPrice && (
                      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground line-through">
                        {format(item.originalPrice)}
                      </div>
                    )}
                  </div>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
