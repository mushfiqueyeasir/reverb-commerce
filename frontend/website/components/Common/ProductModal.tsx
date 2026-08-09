"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, Minus } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ProductCardProps } from "./ProductCard";
import ImageLoader from "./ImageLoader";
import { useCartStore } from "@/store/cartStore";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { trackAddToCart } from "@/utility/analytics/facebookPixelEvents";
import { getProductSizeOptions } from "@/lib/products/variants";

interface ProductModalProps extends ProductCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductModal({
  id,
  title,
  image,
  originalPrice,
  currentPrice,
  discount,
  href,
  stock,
  sizingMode,
  sizeChart,
  open,
  onOpenChange,
}: ProductModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();
  const { format, code } = useCurrency();
  const router = useRouter();

  const isSized = sizingMode === "required";
  const sizes = isSized
    ? getProductSizeOptions(sizeChart ?? [], stock ?? [])
    : [];
  const selectedVariant = stock?.find(
    (variant) => variant.id === selectedVariantId,
  );
  const maxQuantity = selectedVariant?.quantity || 0;
  const effectivePrice = currentPrice;

  useEffect(() => {
    if (open) {
      const availableSizes = isSized
        ? getProductSizeOptions(sizeChart ?? [], stock ?? [])
        : [];
      const firstAvailable = isSized
        ? availableSizes
            .map((size) => stock?.find((variant) => variant.size === size))
            .find((variant) => (variant?.quantity ?? 0) > 0)
        : stock?.find((variant) => variant.quantity > 0);
      setSelectedVariantId(firstAvailable?.id ?? null);
      setQuantity(1);
    }
  }, [open, stock, isSized, sizeChart]);

  useEffect(() => {
    if (maxQuantity === 0) {
      setQuantity(0);
    } else if (maxQuantity > 0 && quantity > maxQuantity) {
      setQuantity(maxQuantity);
    } else if (maxQuantity > 0 && quantity === 0) {
      setQuantity(1);
    }
  }, [selectedVariantId, maxQuantity, quantity]);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const newQuantity = prev + delta;
      if (newQuantity < 1) return 1;
      if (maxQuantity > 0 && newQuantity > maxQuantity) return maxQuantity;
      return newQuantity;
    });
  };

  const handleAddToCart = () => {
    if (!selectedVariant || maxQuantity === 0 || quantity === 0) return;
    addItem({
      id,
      variantId: selectedVariant.id,
      title,
      image,
      currentPrice: effectivePrice,
      originalPrice,
      size: selectedVariant.size,
      quantity,
    });
    // Track AddToCart event for Meta catalog ads
    trackAddToCart(id, effectivePrice, code, quantity);
    onOpenChange(false);
  };

  const handleBuyNow = () => {
    if (!selectedVariant || maxQuantity === 0 || quantity === 0) return;
    addItem({
      id,
      variantId: selectedVariant.id,
      title,
      image,
      currentPrice: effectivePrice,
      originalPrice,
      size: selectedVariant.size,
      quantity,
    });
    // Track AddToCart event for Meta catalog ads
    trackAddToCart(id, effectivePrice, code, quantity);
    onOpenChange(false);
    router.push("/cart");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92dvh,860px)] w-[calc(100%-1rem)] max-w-5xl gap-0 overflow-hidden overflow-y-auto rounded-2xl p-0 sm:w-[calc(100%-2rem)] lg:max-h-none">
        <div className="flex flex-col lg:flex-row">
          <div className="relative aspect-[4/5] max-h-[38dvh] w-full shrink-0 sm:max-h-[42dvh] lg:aspect-auto lg:h-[600px] lg:max-h-none lg:w-1/2">
            <ImageLoader
              src={image}
              alt={title}
              width={1000}
              height={1000}
              className="h-full w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div className="flex w-full shrink-0 flex-col justify-between p-4 sm:p-6 lg:w-1/2 lg:p-8">
            <div className="space-y-5 sm:space-y-6">
              <h2 className="font-display text-xl leading-tight tracking-tight text-foreground sm:text-2xl lg:text-3xl">
                {title}
              </h2>

              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xl font-medium text-foreground lg:text-2xl">
                    {format(currentPrice)}
                  </span>
                  {discount && discount > 0 && (
                    <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white">
                      {discount}% OFF
                    </span>
                  )}
                </div>
                {originalPrice > currentPrice && (
                  <span className="text-sm text-gray-500 line-through block">
                    {format(originalPrice)}
                  </span>
                )}
                <p className="text-sm text-gray-600">Tax included.</p>
              </div>

              {isSized && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-2 block text-sm text-foreground">
                      Size
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {sizes.map((size) => {
                      const sizeStock = stock?.find((s) => s.size === size);
                      const isAvailable = (sizeStock?.quantity || 0) > 0;
                      const isSelected = selectedVariantId === sizeStock?.id;

                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() =>
                            isAvailable &&
                            setSelectedVariantId(sizeStock?.id ?? null)
                          }
                          disabled={!isAvailable}
                          className={`size-11 rounded-full border text-sm font-medium transition-colors ${
                            isSelected
                              ? "border-foreground bg-foreground text-background"
                              : isAvailable
                                ? "border-border bg-card text-foreground hover:border-foreground"
                                : "cursor-not-allowed border-border bg-foreground/5 text-foreground/30"
                          }`}
                          title={!isAvailable ? "Out of stock" : undefined}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-sm text-foreground">
                  Quantity
                </label>
                <div className="flex w-fit items-center rounded-full border border-border">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="grid size-11 place-items-center transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    readOnly
                    aria-label="Quantity"
                    className="w-12 border-0 bg-transparent text-center text-base focus:outline-none sm:w-16"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    disabled={maxQuantity > 0 && quantity >= maxQuantity}
                    aria-label="Increase quantity"
                    className="grid size-11 place-items-center transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {maxQuantity > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Available: {maxQuantity}{" "}
                    {maxQuantity === 1 ? "item" : "items"}
                  </p>
                )}
                {maxQuantity === 0 && (
                  <p className="text-xs text-red-500">Out of stock</p>
                )}
              </div>

              <div className="space-y-3 pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={
                    !selectedVariant || maxQuantity === 0 || quantity === 0
                  }
                  className="h-12 w-full rounded-full border border-foreground px-4 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-foreground"
                >
                  Add to cart
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={
                    !selectedVariant || maxQuantity === 0 || quantity === 0
                  }
                  className="h-12 w-full rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Buy it now
                </button>
              </div>

              <Link
                href={href}
                className="group flex items-center gap-2 text-sm text-foreground hover:underline"
                onClick={() => onOpenChange(false)}
              >
                View full details
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
