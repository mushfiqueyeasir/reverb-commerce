"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useCheckoutStore } from "@/store/checkoutStore";
import { useCartStore } from "@/store/cartStore";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Input from "@/components/Common/Input";
import Select from "@/components/Common/Select";
import { submitOrder } from "@/utility/submitOrder";
import { trackPurchase } from "@/utility/analytics/facebookPixelEvents";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { shippingCostForZone, type DeliveryCharges } from "@/lib/delivery";
import { computePromoDiscount } from "@/lib/promoCodes";
import { cn } from "@/lib/utils";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function CheckoutForm({
  deliveryCharges,
  bkashEnabled = false,
}: {
  deliveryCharges: DeliveryCharges;
  bkashEnabled?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    formData,
    appliedPromo,
    updateFormData,
    setAppliedPromo,
    saveDeliveryInfo,
    loadSavedDeliveryInfo,
  } = useCheckoutStore();
  const { items, getTotal, clearCart } = useCartStore();
  const { code, format } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const shippingCost = shippingCostForZone(
    deliveryCharges,
    formData.shippingMethod,
  );

  useEffect(() => {
    loadSavedDeliveryInfo();
  }, [loadSavedDeliveryInfo]);

  useEffect(() => {
    if (searchParams.get("payment") === "failed") {
      toast.error("bKash payment was not completed. Please try again.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!bkashEnabled && formData.paymentMethod === "bkash") {
      updateFormData({ paymentMethod: "cod" });
    }
  }, [bkashEnabled, formData.paymentMethod, updateFormData]);

  const handleCompleteOrder = async () => {
    if (!formData.emailOrPhone || !isValidEmail(formData.emailOrPhone)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!formData.firstName || !formData.lastName) {
      toast.error("Please enter your full name");
      return;
    }
    if (!formData.address || !formData.city || !formData.phone) {
      toast.error("Please complete all delivery information");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (formData.paymentMethod === "bkash" && !bkashEnabled) {
      toast.error("bKash is not available. Please choose Cash on Delivery.");
      return;
    }

    setIsSubmitting(true);

    try {
      const subtotal = getTotal();
      const shipping = shippingCostForZone(
        deliveryCharges,
        formData.shippingMethod,
      );
      const discount = appliedPromo
        ? computePromoDiscount(subtotal, appliedPromo.percent)
        : 0;
      const total = Math.max(0, subtotal - discount) + shipping;

      const orderData = {
        delivery: {
          country: formData.country,
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          phone: formData.phone,
          email: formData.emailOrPhone.trim(),
          shippingMethod: formData.shippingMethod,
        },
        items: items.map((item) => ({
          product: item.id,
          variantId: item.variantId,
          title: item.title,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.currentPrice,
        })),
        promoCode: appliedPromo?.code ?? (formData.discountCode.trim() || null),
        paymentMethod: formData.paymentMethod,
        totals: {
          subtotal,
          shipping,
          discount,
          discount_percent: appliedPromo?.percent,
          promo_code: appliedPromo?.code ?? null,
          total,
        },
      };

      const result = await submitOrder(orderData);

      if (formData.saveInfo) {
        saveDeliveryInfo();
      }

      if (result.redirectUrl) {
        toast.message("Redirecting to bKash…");
        window.location.assign(result.redirectUrl);
        return;
      }

      // Track Purchase event for Meta catalog ads
      const productIds = items.map((item) => item.id);
      const numItems = items.reduce((sum, item) => sum + item.quantity, 0);
      trackPurchase(productIds, total, code, numItems);

      toast.success("Order placed successfully!", {
        description: result.orderNumber
          ? `Order ${result.orderNumber} received. A confirmation email is on the way.`
          : "Your order has been received and will be processed shortly.",
      });
      clearCart();
      setAppliedPromo(null);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to place order. Please try again later.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Contact</h2>
        <Input
          type="email"
          placeholder="Email address"
          value={formData.emailOrPhone}
          onChange={(e) => updateFormData({ emailOrPhone: e.target.value })}
        />
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Delivery</h2>
        <Select
          value={formData.country}
          onChange={(e) => updateFormData({ country: e.target.value })}
        >
          <option value="Bangladesh">Bangladesh</option>
        </Select>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            type="text"
            placeholder="First name"
            value={formData.firstName}
            onChange={(e) => updateFormData({ firstName: e.target.value })}
          />
          <Input
            type="text"
            placeholder="Last name"
            value={formData.lastName}
            onChange={(e) => updateFormData({ lastName: e.target.value })}
          />
        </div>
        <Input
          type="text"
          placeholder="Address"
          value={formData.address}
          onChange={(e) => updateFormData({ address: e.target.value })}
        />
        <Input
          type="text"
          placeholder="City"
          value={formData.city}
          onChange={(e) => updateFormData({ city: e.target.value })}
        />
        <Input
          type="text"
          placeholder="Postal code (optional)"
          value={formData.postalCode}
          onChange={(e) => updateFormData({ postalCode: e.target.value })}
        />
        <Input
          type="tel"
          placeholder="Phone"
          value={formData.phone}
          onChange={(e) => updateFormData({ phone: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={formData.saveInfo}
            onChange={(e) => updateFormData({ saveInfo: e.target.checked })}
            className="h-4 w-4 accent-primary"
          />
          <span>Save this information for next time</span>
        </label>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Delivery area</h2>
        <p className="text-sm text-muted-foreground">
          Choose where we should deliver.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                value: "inside-dhaka" as const,
                label: "Inside Dhaka",
                amount: shippingCostForZone(deliveryCharges, "inside-dhaka"),
              },
              {
                value: "outside-dhaka" as const,
                label: "Outside Dhaka",
                amount: shippingCostForZone(deliveryCharges, "outside-dhaka"),
              },
            ] as const
          ).map((zone) => {
            const selected = formData.shippingMethod === zone.value;
            return (
              <button
                key={zone.value}
                type="button"
                onClick={() => updateFormData({ shippingMethod: zone.value })}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card hover:border-primary/50",
                )}
              >
                <span className="block font-medium">{zone.label}</span>
                <span className="mt-1 block text-muted-foreground">
                  {zone.amount === 0
                    ? "Free delivery"
                    : `${format(zone.amount)} delivery`}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Delivery charge for this order:{" "}
          <span className="text-foreground">
            {shippingCost === 0 ? "Free" : format(shippingCost)}
          </span>
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Payment</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className={cn(
              "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
              formData.paymentMethod === "cod"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card hover:border-primary/50",
            )}
            onClick={() => updateFormData({ paymentMethod: "cod" })}
          >
            <span className="block font-medium">Cash on Delivery</span>
            <span className="mt-1 block text-muted-foreground">
              Pay when your order arrives
            </span>
          </button>
          {bkashEnabled ? (
            <button
              type="button"
              className={cn(
                "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                formData.paymentMethod === "bkash"
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card hover:border-primary/50",
              )}
              onClick={() => updateFormData({ paymentMethod: "bkash" })}
            >
              <span className="flex items-center gap-3">
                <span className="grid h-9 w-16 place-items-center rounded-lg bg-white px-2 py-1">
                  <Image
                    src="/images/payments/bkash.png"
                    alt="bKash"
                    width={115}
                    height={67}
                    className="max-h-7 w-auto max-w-full object-contain"
                  />
                </span>
                <span>
                  <span className="block font-medium">bKash</span>
                  <span className="mt-0.5 block text-muted-foreground">
                    Pay securely with bKash wallet
                  </span>
                </span>
              </span>
            </button>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={handleCompleteOrder}
        disabled={isSubmitting}
        className="w-full rounded-full bg-primary px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? formData.paymentMethod === "bkash"
            ? "Starting bKash…"
            : "Placing order…"
          : formData.paymentMethod === "bkash"
            ? "Pay with bKash"
            : "Complete order"}
      </button>
    </div>
  );
}
