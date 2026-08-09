"use client";

import { useState } from "react";
import { Loader2, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cartStore";
import { useCheckoutStore } from "@/store/checkoutStore";
import ImageLoader from "@/components/Common/ImageLoader";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import {
  deliveryZoneLabel,
  shippingCostForZone,
  type DeliveryCharges,
} from "@/lib/delivery";
import { computePromoDiscount } from "@/lib/promoCodes";

export default function CheckoutOrderSummary({
  deliveryCharges,
}: {
  deliveryCharges: DeliveryCharges;
}) {
  const { items, getTotal } = useCartStore();
  const shippingMethod = useCheckoutStore((s) => s.formData.shippingMethod);
  const discountCode = useCheckoutStore((s) => s.formData.discountCode);
  const appliedPromo = useCheckoutStore((s) => s.appliedPromo);
  const updateFormData = useCheckoutStore((s) => s.updateFormData);
  const setAppliedPromo = useCheckoutStore((s) => s.setAppliedPromo);
  const { format, code } = useCurrency();
  const [applying, setApplying] = useState(false);

  const subtotal = getTotal();
  const shipping = shippingCostForZone(deliveryCharges, shippingMethod);
  const discount = appliedPromo
    ? computePromoDiscount(subtotal, appliedPromo.percent)
    : 0;
  const total = Math.max(0, subtotal - discount) + shipping;

  const applyCode = async () => {
    const raw = discountCode.trim();
    if (!raw) {
      toast.error("Enter a promo code");
      return;
    }
    setApplying(true);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: raw, subtotal }),
      });
      const data = (await res.json()) as {
        error?: string;
        code?: string;
        percent?: number;
      };
      if (!res.ok || !data.code || data.percent == null) {
        setAppliedPromo(null);
        toast.error(data.error || "Invalid promo code");
        return;
      }
      setAppliedPromo({ code: data.code, percent: Number(data.percent) });
      updateFormData({ discountCode: data.code });
      toast.success(`${data.percent}% off applied`);
    } catch {
      toast.error("Could not apply promo code");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="w-full max-w-none rounded-2xl border border-border bg-card p-5 sm:p-6 lg:max-w-sm">
      <h2 className="mb-6 font-display text-xl font-semibold">Order summary</h2>

      <div className="mb-6 space-y-4">
        {items.map((item) => (
          <div key={item.variantId} className="flex gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <ImageLoader
                src={item.image}
                alt={item.title}
                width={80}
                height={80}
                className="h-full w-full rounded-lg object-cover"
              />
              <div className="absolute -right-2 -top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {item.quantity}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 truncate text-sm font-medium">{item.title}</p>
              {item.size && (
                <p className="mb-1 text-xs text-muted-foreground">
                  Size: {item.size}
                </p>
              )}
              <p className="text-sm">{format(item.currentPrice)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-5 space-y-2 border-t border-border pt-4">
        <label className="text-sm font-medium text-foreground">
          Promo code
        </label>
        {appliedPromo ? (
          <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-primary/10 px-3 py-2.5 text-sm">
            <span className="inline-flex items-center gap-2 font-medium">
              <Tag className="size-3.5 text-primary" />
              {appliedPromo.code} · {appliedPromo.percent}% off
            </span>
            <button
              type="button"
              aria-label="Remove promo code"
              onClick={() => {
                setAppliedPromo(null);
                updateFormData({ discountCode: "" });
              }}
              className="rounded-full p-1 text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={discountCode}
              onChange={(e) =>
                updateFormData({ discountCode: e.target.value.toUpperCase() })
              }
              placeholder="Enter code"
              className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm uppercase outline-none focus:border-primary"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={applyCode}
              disabled={applying}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background transition hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
            >
              {applying ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
            </button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Discount applies to products only — not delivery.
        </p>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{format(subtotal)}</span>
        </div>
        {discount > 0 ? (
          <div className="flex justify-between text-sm text-primary">
            <span>Promo ({appliedPromo?.percent}%)</span>
            <span>-{format(discount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Delivery · {deliveryZoneLabel(shippingMethod)}
          </span>
          <span>{format(shipping)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
          <span>Total ({code})</span>
          <span className="font-display text-xl">{format(total)}</span>
        </div>
      </div>
    </div>
  );
}
