"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import ProductModal from "./ProductModal";
import ImageLoader from "./ImageLoader";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useProductCardCopy } from "@/components/providers/ProductCardCopyProvider";
import { useStoreName } from "@/components/providers/StoreBrandProvider";
import { useWishlistStore } from "@/store/wishlistStore";
import { cn } from "@/lib/utils";
import type { ProductSizeChartRow, ProductStock } from "@/type/productType";

export type ProductCardVariant = "default" | "kawaii-fashion";

export interface ProductCardProps {
  id: string;
  title: string;
  image: string;
  hoverImage?: string;
  images?: string[];
  originalPrice: number;
  currentPrice: number;
  discount?: number;
  href: string;
  stock?: ProductStock[];
  sizingMode: "none" | "required";
  sizeChart?: ProductSizeChartRow[];
  label?: string;
  variant?: ProductCardVariant;
}

export default function ProductCard({
  id,
  title,
  image,
  hoverImage,
  images,
  originalPrice,
  currentPrice,
  discount,
  href,
  stock,
  sizingMode,
  sizeChart,
  label,
  variant = "default",
}: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { format } = useCurrency();
  const productCardCopy = useProductCardCopy();
  const storeName = useStoreName();
  const isFavorite = useWishlistStore((s) => s.isFavorite(id));
  const toggleItem = useWishlistStore((s) => s.toggleItem);

  const isOutOfStock = (() => {
    if (!stock || stock.length === 0) return true;
    return stock.reduce((sum, item) => sum + (item.quantity || 0), 0) === 0;
  })();

  if (variant === "kawaii-fashion") {
    return (
      <>
        <article className="group">
          <div className="relative aspect-[3/4] overflow-hidden border border-border bg-card">
            <Link
              href={href}
              className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
            >
              <ImageLoader
                src={image}
                alt={title}
                width={750}
                height={1000}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025] motion-reduce:transition-none"
              />
              {hoverImage && (
                <div className="absolute inset-0">
                  <ImageLoader
                    src={hoverImage}
                    alt=""
                    width={750}
                    height={1000}
                    className="h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none"
                  />
                </div>
              )}
            </Link>

            <button
              type="button"
              aria-label={
                isFavorite
                  ? productCardCopy.removeFavoriteAriaLabel
                  : productCardCopy.addFavoriteAriaLabel
              }
              aria-pressed={isFavorite}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleItem({
                  id,
                  title,
                  image,
                  href,
                  currentPrice,
                  originalPrice,
                });
              }}
              className={cn(
                "absolute right-3 top-3 grid size-10 place-items-center border backdrop-blur-sm transition-colors sm:right-4 sm:top-4",
                isFavorite
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background/90 text-foreground hover:border-primary hover:text-primary",
              )}
            >
              <Heart className={cn("size-4", isFavorite && "fill-current")} />
            </button>

            <button
              type="button"
              onClick={() => !isOutOfStock && setIsModalOpen(true)}
              disabled={isOutOfStock}
              className={cn(
                "absolute inset-x-3 bottom-3 flex min-h-10 items-center justify-between bg-primary px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-all duration-300 sm:inset-x-4 sm:bottom-4 sm:text-[11px] md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 motion-reduce:transition-none",
                isOutOfStock &&
                  "translate-y-0 cursor-not-allowed bg-foreground/90 opacity-100 text-background md:translate-y-0 md:opacity-100",
              )}
            >
              {isOutOfStock
                ? productCardCopy.soldOutButtonLabel
                : productCardCopy.quickAddButtonLabel}
              <Plus className="size-4 shrink-0" />
            </button>
          </div>

          <Link
            href={href}
            className="block pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
          >
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {label || storeName}
            </p>
            <h3 className="mt-1 line-clamp-2 font-display text-base font-semibold leading-snug tracking-[-0.025em] text-foreground sm:text-lg">
              {title}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="font-semibold text-foreground">
                {format(currentPrice)}
              </span>
              {originalPrice > currentPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  {format(originalPrice)}
                </span>
              )}
            </div>
          </Link>
        </article>

        <ProductModal
          id={id}
          title={title}
          image={image}
          hoverImage={hoverImage}
          images={images}
          originalPrice={originalPrice}
          currentPrice={currentPrice}
          discount={discount}
          href={href}
          stock={stock}
          sizingMode={sizingMode}
          sizeChart={sizeChart}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      </>
    );
  }

  return (
    <>
      <article className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 hover:border-foreground/20 hover:ring-glow">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface">
          <Link href={href} className="block h-full w-full">
            <ImageLoader
              src={image}
              alt={title}
              width={800}
              height={1000}
              className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
            />
            {hoverImage && (
              <div className="invisible absolute inset-0 bg-surface group-hover:visible">
                <ImageLoader
                  src={hoverImage}
                  alt={title}
                  width={800}
                  height={1000}
                  className="h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              </div>
            )}
          </Link>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-90" />

          <button
            type="button"
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
            aria-pressed={isFavorite}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleItem({
                id,
                title,
                image,
                href,
                currentPrice,
                originalPrice,
              });
            }}
            className={cn(
              "absolute right-2.5 top-2.5 grid size-11 place-items-center rounded-full border backdrop-blur-md transition sm:right-4 sm:top-4",
              isFavorite
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background/60 text-foreground hover:bg-primary hover:text-primary-foreground",
            )}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
          </button>

          {/* Always visible on phone; hover-reveal from md up */}
          <button
            type="button"
            onClick={() => !isOutOfStock && setIsModalOpen(true)}
            disabled={isOutOfStock}
            className={cn(
              "absolute inset-x-2.5 bottom-2.5 flex items-center justify-between rounded-full px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] backdrop-blur-md transition-all duration-500 sm:inset-x-4 sm:bottom-4 sm:px-5 sm:py-3 sm:text-[12px] sm:tracking-[0.2em]",
              isOutOfStock
                ? "translate-y-0 opacity-100 bg-foreground/95 text-background disabled:cursor-not-allowed"
                : "translate-y-0 opacity-100 bg-primary text-primary-foreground md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100",
            )}
          >
            {isOutOfStock ? "Sold Out" : "Quick Add"}
            <Plus className="h-4 w-4 shrink-0" />
          </button>
        </div>

        <Link
          href={href}
          className="flex items-start justify-between gap-3 p-3 sm:p-5"
        >
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-base font-semibold tracking-tight sm:text-lg">
              {title}
            </h3>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {storeName}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-display text-lg font-semibold tracking-tight sm:text-xl">
              {format(currentPrice)}
            </div>
            {originalPrice > currentPrice && (
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground line-through">
                {format(originalPrice)}
              </div>
            )}
          </div>
        </Link>
      </article>

      <ProductModal
        id={id}
        title={title}
        image={image}
        hoverImage={hoverImage}
        images={images}
        originalPrice={originalPrice}
        currentPrice={currentPrice}
        discount={discount}
        href={href}
        stock={stock}
        sizingMode={sizingMode}
        sizeChart={sizeChart}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
