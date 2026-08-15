"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Minus,
  Package,
  Star,
  RotateCcw,
  Wallet,
  Heart,
  Ruler,
} from "lucide-react";
import { toast } from "sonner";
import type { TransformedProduct, ProductStock } from "@/type/productType";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useStoreName } from "@/components/providers/StoreBrandProvider";
import { trackAddToCart } from "@/utility/analytics/facebookPixelEvents";
import { cn } from "@/lib/utils";
import { getProductSizeOptions } from "@/lib/products/variants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SizeChart from "./SizeChart";

interface ProductInfoProps {
  product: TransformedProduct;
  stock?: ProductStock[];
}

export default function ProductInfo({ product, stock }: ProductInfoProps) {
  const storeName = useStoreName();
  const isSized = product.sizingMode === "required";
  const sizeOptions = isSized
    ? getProductSizeOptions(product.sizeChart ?? [], stock ?? [])
    : [];

  const stockForSize = (size: string) =>
    stock?.find((item) => item.size === size);

  const isFullyOutOfStock = isSized
    ? sizeOptions.every((size) => (stockForSize(size)?.quantity ?? 0) <= 0)
    : (stock?.[0]?.quantity ?? 0) <= 0;

  const getInitialSize = (): string | null => {
    if (!isSized || isFullyOutOfStock) return null;
    return (
      sizeOptions.find((size) => (stockForSize(size)?.quantity ?? 0) > 0) ??
      null
    );
  };

  const [selectedSize, setSelectedSize] = useState<string | null>(
    getInitialSize(),
  );
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const { addItem, isItemInCart } = useCartStore();
  const isFavorite = useWishlistStore((s) => s.isFavorite(product.id));
  const toggleFavorite = useWishlistStore((s) => s.toggleItem);
  const { format, code } = useCurrency();
  const router = useRouter();

  const hasSizeChart = (product.sizeChart?.length ?? 0) > 0;
  const selectedVariant = isSized
    ? selectedSize
      ? stockForSize(selectedSize)
      : null
    : stock?.[0];
  const maxQuantity = selectedVariant?.quantity || 0;
  const effectivePrice = product.currentPrice;
  const isInCart = selectedVariant ? isItemInCart(selectedVariant.id) : false;

  useEffect(() => {
    if (!selectedVariant) {
      setQuantity(0);
    } else if (maxQuantity === 0) {
      setQuantity(0);
    } else if (quantity > maxQuantity || quantity === 0) {
      setQuantity(1);
    }
  }, [selectedVariant, maxQuantity, quantity]);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (maxQuantity > 0 && next > maxQuantity) return maxQuantity;
      return next;
    });
  };

  const handleAddToCart = () => {
    if (!selectedVariant || maxQuantity === 0 || quantity === 0) return;
    addItem({
      id: product.id,
      variantId: selectedVariant.id,
      title: product.title,
      image: product.image,
      currentPrice: effectivePrice,
      originalPrice: product.originalPrice,
      size: selectedVariant.size,
      quantity,
    });
    trackAddToCart(product.id, effectivePrice, code, quantity);
  };

  const handleBuyNow = () => {
    if (!selectedVariant || maxQuantity === 0 || quantity === 0) return;
    addItem({
      id: product.id,
      variantId: selectedVariant.id,
      title: product.title,
      image: product.image,
      currentPrice: effectivePrice,
      originalPrice: product.originalPrice,
      size: selectedVariant.size,
      quantity,
    });
    trackAddToCart(product.id, effectivePrice, code, quantity);
    router.push("/cart");
  };

  return (
    <div className="space-y-6">
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary">
        {storeName}
      </p>
      <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground lg:text-4xl">
        {product.title}
      </h1>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl font-medium text-foreground lg:text-3xl">
            {format(product.currentPrice)}
          </span>
          {product.discount && product.discount > 0 && (
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              {product.discount}% OFF
            </span>
          )}
        </div>
        {product.originalPrice > product.currentPrice && (
          <span className="block text-sm text-muted-foreground line-through">
            {format(product.originalPrice)}
          </span>
        )}
        <p className="text-sm text-muted-foreground">Tax included.</p>
      </div>

      {isSized && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="block text-sm font-normal text-foreground">
              Size
            </label>
            {hasSizeChart && (
              <button
                type="button"
                onClick={() => setSizeGuideOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground underline-offset-4 transition hover:text-primary hover:underline"
              >
                <Ruler className="size-3.5" />
                Size chart
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {sizeOptions.map((size) => {
              const sizeStock = stockForSize(size);
              const isAvailable = (sizeStock?.quantity || 0) > 0;
              const isSelected = selectedSize === size;

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => isAvailable && setSelectedSize(size)}
                  disabled={!isAvailable}
                  className={cn(
                    "size-12 rounded-full border text-sm font-medium transition-colors",
                    isSelected
                      ? "border-foreground bg-foreground text-background"
                      : isAvailable
                        ? "border-border bg-card text-foreground hover:border-foreground"
                        : "cursor-not-allowed border-border/10 bg-muted text-foreground/30",
                  )}
                  title={!isAvailable ? "Out of stock" : undefined}
                >
                  {size}
                </button>
              );
            })}
          </div>
          {!selectedSize && isFullyOutOfStock && (
            <p className="mt-2 text-xs text-red-500">
              All sizes are out of stock
            </p>
          )}
        </div>
      )}

      {!isSized && isFullyOutOfStock && (
        <p className="text-xs text-red-500">Out of stock</p>
      )}

      <div className="space-y-3">
        <label className="block text-sm font-normal text-foreground">
          Quantity
        </label>
        <div className="flex w-fit items-center rounded-full border border-foreground/20">
          <button
            type="button"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
            className="grid size-11 place-items-center text-base transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Minus className="size-4" />
          </button>
          <input
            type="number"
            value={quantity}
            readOnly
            className="w-16 border-0 bg-transparent text-center text-base focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleQuantityChange(1)}
            disabled={maxQuantity > 0 && quantity >= maxQuantity}
            className="grid size-11 place-items-center text-base transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="size-4" />
          </button>
        </div>
        {selectedVariant && maxQuantity > 0 && maxQuantity <= 5 && (
          <p className="text-xs text-primary">Only {maxQuantity} left</p>
        )}
        {selectedVariant && maxQuantity === 0 && (
          <p className="text-xs text-red-500">Out of stock</p>
        )}
      </div>

      <div className="space-y-3 pt-4">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={
            !selectedVariant || isInCart || maxQuantity === 0 || quantity === 0
          }
          className={cn(
            "w-full rounded-full border px-4 py-3.5 text-sm font-medium transition-colors duration-200",
            !selectedVariant || isInCart || maxQuantity === 0 || quantity === 0
              ? "cursor-not-allowed border-border/10 bg-muted text-foreground/40"
              : "border-foreground text-foreground hover:bg-foreground hover:text-background",
          )}
        >
          {!selectedVariant
            ? isSized
              ? "Select a size"
              : "Out of stock"
            : isInCart
              ? "Added to cart"
              : maxQuantity === 0
                ? "Out of stock"
                : "Add to cart"}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!selectedVariant || maxQuantity === 0 || quantity === 0}
          className="w-full rounded-full bg-primary px-4 py-3.5 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buy it now
        </button>
        <button
          type="button"
          onClick={() => {
            const added = toggleFavorite({
              id: product.id,
              title: product.title,
              image: product.image,
              href: product.href,
              currentPrice: product.currentPrice,
              originalPrice: product.originalPrice,
            });
            toast.success(
              added ? "Saved to favorites" : "Removed from favorites",
            );
          }}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-3.5 text-sm font-medium transition-colors duration-200",
            isFavorite
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-foreground hover:border-primary hover:text-primary",
          )}
        >
          <Heart className={cn("size-4", isFavorite && "fill-current")} />
          {isFavorite ? "Saved to favorites" : "Add to favorites"}
        </button>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <div className="flex items-center gap-3">
          <Package className="size-5 text-foreground" />
          <span className="text-sm text-foreground">
            2 to 3 working days for metro cities
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Package className="size-5 text-foreground" />
          <span className="text-sm text-foreground">
            3 to 5 working days for rest of Bangladesh.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Star className="size-5 text-foreground" />
          <span className="text-sm text-foreground">Experience the Luxury</span>
        </div>
        <div className="flex items-center gap-3">
          <RotateCcw className="size-5 text-foreground" />
          <span className="text-sm text-foreground">Easy Return</span>
        </div>
        <div className="flex items-center gap-3">
          <Wallet className="size-5 text-foreground" />
          <span className="text-sm text-foreground">Full Cash On Delivery</span>
        </div>
      </div>

      {hasSizeChart && (
        <Dialog open={sizeGuideOpen} onOpenChange={setSizeGuideOpen}>
          <DialogContent className="max-w-md border-border bg-card">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                Size chart
              </DialogTitle>
            </DialogHeader>
            <SizeChart sizeChart={product.sizeChart} compact />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
