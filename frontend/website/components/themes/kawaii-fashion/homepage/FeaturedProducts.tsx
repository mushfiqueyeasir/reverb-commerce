"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Heart, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import SectionHeading from "./SectionHeading";
import { useMarqueeCarousel } from "./useMarqueeCarousel";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useProductCardCopy } from "@/components/providers/ProductCardCopyProvider";
import { useWishlistStore } from "@/store/wishlistStore";
import { cn } from "@/lib/utils";
import type { TransformedProduct } from "@/type/productType";

interface KawaiiFashionFeaturedProductsProps {
  products: TransformedProduct[];
  title?: string | null;
  subtitle?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string;
  listLabel?: string | null;
  uncategorizedLabelTemplate?: string | null;
}

function numberedLabel(template: string, index: number) {
  return template.replaceAll("{number}", String(index + 1).padStart(2, "0"));
}

export default function KawaiiFashionFeaturedProducts({
  products,
  title,
  subtitle,
  eyebrow,
  ctaLabel,
  ctaHref = "/product",
  listLabel,
  uncategorizedLabelTemplate,
}: KawaiiFashionFeaturedProductsProps) {
  const { format } = useCurrency();
  const {
    trackRef,
    handlePointerDown,
    handlePointerMove,
    endDrag,
    onMouseEnter,
    onMouseLeave,
  } = useMarqueeCarousel();

  const normalizedListLabel = listLabel?.trim();
  const normalizedUncategorizedTemplate = uncategorizedLabelTemplate?.trim();

  if (products.length === 0) return null;

  return (
    <section className="relative bg-surface py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
        />
      </div>
      <div className="relative mx-auto mt-10 max-w-[1600px] sm:mt-14">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-surface to-transparent sm:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-surface to-transparent sm:w-16" />
        <div
          ref={trackRef}
          role="list"
          aria-label={normalizedListLabel || undefined}
          className="scrollbar-hide touch-pan-y select-none overflow-x-auto px-4 sm:px-6 lg:px-10"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className="flex w-max gap-3 pe-3 sm:gap-5 sm:pe-5">
            {[false, true].map((duplicate) => (
              <div
                key={duplicate ? "duplicate" : "original"}
                className="flex gap-3 pe-3 sm:gap-5 sm:pe-5"
                aria-hidden={duplicate || undefined}
              >
                {products.map((product, index) => (
                  <ProductCard
                    key={`${product.id}-${duplicate ? "duplicate" : "original"}`}
                    product={product}
                    index={index}
                    format={format}
                    uncategorizedLabelTemplate={normalizedUncategorizedTemplate}
                    duplicate={duplicate}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductCard({
  product,
  index,
  format,
  uncategorizedLabelTemplate,
  duplicate,
}: {
  product: TransformedProduct;
  index: number;
  format: (value: number) => string;
  uncategorizedLabelTemplate?: string;
  duplicate: boolean;
}) {
  const image = product.image.trim();
  const hoverImage = product.hoverImage?.trim();
  const reduced = product.originalPrice > product.currentPrice;
  const category = product.categories[0]?.categoryName?.trim();
  const uncategorizedLabel = uncategorizedLabelTemplate
    ? numberedLabel(uncategorizedLabelTemplate, index)
    : undefined;
  const productCardCopy = useProductCardCopy();
  const isFavorite = useWishlistStore((s) => s.isFavorite(product.id));
  const toggleItem = useWishlistStore((s) => s.toggleItem);

  return (
    <div className="w-[min(76vw,17rem)] shrink-0">
      <article className="group">
        <div className="relative aspect-[3/4] overflow-hidden border border-border bg-card">
          <Link
            href={product.href}
            tabIndex={duplicate ? -1 : undefined}
            className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          >
            {image ? (
              <Image
                src={image}
                alt={product.title}
                fill
                draggable={false}
                sizes="(max-width: 640px) 76vw, 20rem"
                className="pointer-events-none object-cover transition-transform duration-700 group-hover:scale-[1.025] motion-reduce:transition-none"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-card text-muted-foreground">
                <ImageIcon className="size-8" aria-hidden="true" />
              </div>
            )}
            {image && hoverImage ? (
              <Image
                src={hoverImage}
                alt=""
                fill
                draggable={false}
                sizes="(max-width: 640px) 76vw, 20rem"
                className="pointer-events-none object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none"
              />
            ) : null}
          </Link>
          <button
            type="button"
            aria-label={
              isFavorite
                ? productCardCopy.removeFavoriteAriaLabel
                : productCardCopy.addFavoriteAriaLabel
            }
            aria-pressed={isFavorite}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              const added = toggleItem({
                id: product.id,
                title: product.title,
                image,
                href: product.href,
                currentPrice: product.currentPrice,
                originalPrice: product.originalPrice,
              });
              toast.success(
                added
                  ? productCardCopy.favoriteSavedToast
                  : productCardCopy.favoriteRemovedToast,
              );
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
          <span className="absolute bottom-3 right-3 grid size-10 place-items-center bg-primary text-primary-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 motion-reduce:transition-none sm:bottom-4 sm:right-4">
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </span>
        </div>
        <Link
          href={product.href}
          tabIndex={duplicate ? -1 : undefined}
          className="block pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
        >
          {category || uncategorizedLabel ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {category || uncategorizedLabel}
            </p>
          ) : null}
          <h3 className="mt-1 line-clamp-2 font-display text-base font-semibold leading-snug tracking-[-0.025em] text-foreground sm:text-lg">
            {product.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-semibold text-foreground">
              {format(product.currentPrice)}
            </span>
            {reduced ? (
              <span className="text-xs text-muted-foreground line-through">
                {format(product.originalPrice)}
              </span>
            ) : null}
          </div>
        </Link>
      </article>
    </div>
  );
}