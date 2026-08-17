import type { ProductCardVariant } from "@/components/Common/ProductCard";
import { cn } from "@/lib/utils";

interface ProductGridSkeletonProps {
  variant?: ProductCardVariant;
  count?: number;
}

export default function ProductGridSkeleton({
  variant = "default",
  count = 10,
}: ProductGridSkeletonProps) {
  const isKawaii = variant === "kawaii-fashion";
  const isZaro = variant === "zaro-fashion";

  return (
    <div
      aria-hidden
      className={
        isKawaii
          ? "grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-5 lg:gap-x-7 lg:gap-y-12"
          : isZaro
            ? "grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4"
            : "grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-3 xl:grid-cols-5"
      }
    >
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={index}
          className={cn(
            isKawaii || isZaro
              ? "group"
              : "group relative overflow-hidden rounded-2xl border border-border bg-card",
          )}
        >
          <div
            className={cn(
              "animate-pulse overflow-hidden bg-muted/70",
              isKawaii
                ? "aspect-[3/4] border border-border bg-card"
                : isZaro
                  ? "aspect-[3/4] rounded-[8px]"
                  : "aspect-[4/5] bg-surface",
            )}
          >
            <div className="h-full w-full bg-muted/70" />
          </div>
          <div
            className={cn(
              isKawaii ? "pt-4" : isZaro ? "px-1 pt-3" : "p-3 sm:p-4",
            )}
          >
            <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-muted/70" />
            <div className="mt-2.5 h-4 w-11/12 animate-pulse rounded-full bg-muted/70" />
            <div className="mt-1.5 h-4 w-2/3 animate-pulse rounded-full bg-muted/70" />
            <div className="mt-3 h-4 w-1/4 animate-pulse rounded-full bg-muted/70" />
          </div>
        </article>
      ))}
    </div>
  );
}
