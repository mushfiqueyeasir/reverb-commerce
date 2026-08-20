"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import CheckoutOrderSummary from "./CheckoutOrderSummary";
import CheckoutForm from "./CheckoutForm";
import Link from "next/link";
import { trackInitiateCheckout } from "@/utility/analytics/facebookPixelEvents";
import type { DeliveryCharges } from "@/lib/delivery";

interface CheckoutPageScreenProps {
  deliveryCharges: DeliveryCharges;
  bkashEnabled?: boolean;
  otpEnabled?: boolean;
}

export default function CheckoutPageScreen({
  deliveryCharges,
  bkashEnabled = false,
  otpEnabled = false,
}: CheckoutPageScreenProps) {
  const { items, getTotal, getItemCount, hasHydrated } = useCartStore();

  useEffect(() => {
    if (items.length > 0) {
      const productIds = items.map((item) => item.id);
      const totalValue = getTotal();
      const numItems = getItemCount();
      trackInitiateCheckout(productIds, totalValue, "USD", numItems);
    }
  }, [items, getTotal, getItemCount]);

  if (!hasHydrated) {
    return (
      <section className="mx-auto max-w-[1600px] px-5 pb-24 pt-24 sm:px-6 md:px-10 md:pt-36">
        <h1 className="mb-8 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Checkout
        </h1>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="h-6 w-20 animate-pulse rounded-md bg-foreground/[0.08]" />
              <div className="h-12 w-full animate-pulse rounded-lg bg-foreground/[0.08]" />
            </div>
            <div className="space-y-4">
              <div className="h-6 w-24 animate-pulse rounded-md bg-foreground/[0.08]" />
              <div className="h-12 w-full animate-pulse rounded-lg bg-foreground/[0.08]" />
              <div className="h-12 w-full animate-pulse rounded-lg bg-foreground/[0.08]" />
              <div className="h-12 w-full animate-pulse rounded-lg bg-foreground/[0.08]" />
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="h-64 w-full max-w-sm animate-pulse rounded-2xl bg-foreground/[0.08]" />
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-[1600px] px-5 pb-24 pt-24 sm:px-6 md:px-10 md:pt-36">
        <h1 className="mb-6 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Checkout
        </h1>
        <div className="py-16 text-center">
          <p className="mb-4 text-lg text-muted-foreground">
            Your cart is empty
          </p>
          <Link
            href="/product"
            className="font-medium text-primary-readable underline-offset-4 hover:underline"
          >
            Continue shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1600px] px-5 pb-24 pt-24 sm:px-6 md:px-10 md:pt-36">
      <h1 className="mb-8 font-display text-4xl font-bold tracking-tight sm:text-5xl">
        Checkout
      </h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-14">
        <CheckoutForm
          deliveryCharges={deliveryCharges}
          bkashEnabled={bkashEnabled}
          otpEnabled={otpEnabled}
        />
        <div className="lg:sticky lg:top-28 lg:self-start">
          <CheckoutOrderSummary deliveryCharges={deliveryCharges} />
        </div>
      </div>
    </section>
  );
}
