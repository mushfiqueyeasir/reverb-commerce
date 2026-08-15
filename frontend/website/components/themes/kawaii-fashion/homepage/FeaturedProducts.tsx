"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ImageIcon } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import type { TransformedProduct } from "@/type/productType";

interface KawaiiFashionFeaturedProductsProps {
  products: TransformedProduct[];
  title?: string | null;
  subtitle?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string;
}

function productBadge(product: TransformedProduct) {
  const stock = product.stock.reduce(
    (total, item) => total + Math.max(0, item.quantity || 0),
    0,
  );
  if (stock === 0) return "Sold out";
  if (product.originalPrice > product.currentPrice) return "Special price";
  return "New favorite";
}

export default function KawaiiFashionFeaturedProducts({
  products,
  title,
  subtitle,
  eyebrow,
  ctaLabel,
  ctaHref = "/product",
}: KawaiiFashionFeaturedProductsProps) {
  const { format } = useCurrency();

  if (products.length === 0) return null;

  return (
    <section className="relative bg-surface py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-6 lg:px-10">
        <SectionHeading
          eyebrow={eyebrow || "Just in"}
          title={title || "A little wardrobe refresh"}
          subtitle={subtitle}
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
        />
        <ol
          className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-12"
          aria-label="Featured products"
        >
          {products.map((product, index) => {
            const image = product.image.trim();
            const hoverImage = product.hoverImage?.trim();
            const reduced = product.originalPrice > product.currentPrice;
            const category = product.categories[0]?.categoryName;

            return (
              <li key={product.id}>
                <article className="group">
                  <Link
                    href={product.href}
                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden border border-border bg-card">
                      {image ? (
                        <Image
                          src={image}
                          alt={product.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.025] motion-reduce:transition-none"
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
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none"
                        />
                      ) : null}
                      <span className="absolute left-3 top-3 bg-background/90 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-foreground backdrop-blur-sm sm:left-4 sm:top-4 sm:text-[10px]">
                        {productBadge(product)}
                      </span>
                      <span className="absolute bottom-3 right-3 grid size-10 place-items-center bg-primary text-primary-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 motion-reduce:transition-none sm:bottom-4 sm:right-4">
                        <ArrowUpRight className="size-4" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="pt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {category ||
                          `Look ${String(index + 1).padStart(2, "0")}`}
                      </p>
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
                    </div>
                  </Link>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
