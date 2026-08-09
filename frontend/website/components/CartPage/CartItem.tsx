"use client";

import { useCartStore } from "@/store/cartStore";
import ImageLoader from "@/components/Common/ImageLoader";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { Plus, Minus, Trash2 } from "lucide-react";

interface CartItemProps {
  item: {
    id: string;
    variantId: string;
    title: string;
    image: string;
    currentPrice: number;
    size: string | null;
    quantity: number;
  };
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const { format } = useCurrency();
  const itemTotal = item.currentPrice * item.quantity;

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 md:grid md:grid-cols-12 md:items-center">
      <div className="col-span-6 flex min-w-0 gap-3 sm:gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-24 md:h-32 md:w-32">
          <ImageLoader
            src={item.image}
            alt={item.title}
            width={128}
            height={128}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
            VE Gear
          </p>
          <h3 className="mb-1 truncate text-sm font-medium md:text-base">
            {item.title}
          </h3>
          <p className="mb-1 text-xs text-muted-foreground">
            {format(item.currentPrice)}
          </p>
          {item.size && (
            <p className="text-xs text-muted-foreground">Size: {item.size}</p>
          )}
        </div>
      </div>

      <div className="col-span-3 flex items-center justify-between gap-2 md:justify-start">
        <div className="flex w-fit items-center overflow-hidden rounded-full border border-border">
          <button
            type="button"
            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
            disabled={item.quantity === 1}
            aria-label="Decrease quantity"
            className={`grid size-11 place-items-center transition-colors ${
              item.quantity === 1
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-foreground/5"
            }`}
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            value={item.quantity}
            readOnly
            aria-label="Quantity"
            className="w-10 border-0 bg-transparent text-center text-base focus:outline-none sm:w-12"
          />
          <button
            type="button"
            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
            aria-label="Increase quantity"
            className="grid size-11 place-items-center transition-colors hover:bg-foreground/5"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => removeItem(item.variantId)}
          className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-primary"
          aria-label="Remove item"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <div className="col-span-3 flex items-center justify-between md:justify-end">
        <span className="text-xs uppercase tracking-wider text-muted-foreground md:hidden">
          Total
        </span>
        <span className="font-display text-base font-semibold tabular-nums">
          {format(itemTotal)}
        </span>
      </div>
    </div>
  );
}
