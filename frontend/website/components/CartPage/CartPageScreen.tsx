"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import CartItemsList from "./CartItemsList";
import CartSummary from "./CartSummary";
import EmptyCart from "./EmptyCart";

export default function CartPageScreen() {
  const { items, getTotal, hasHydrated } = useCartStore();

  if (!hasHydrated) {
    return (
      <section className="mx-auto max-w-[1600px] px-5 pb-24 pt-24 sm:px-6 md:px-10 md:pt-36">
        <div className="mb-8 h-12 w-56 animate-pulse rounded-md bg-foreground/[0.08] sm:h-14" />
        <div className="flex flex-col gap-8">
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="h-28 w-full animate-pulse rounded-2xl bg-foreground/[0.08]"
              />
            ))}
          </div>
          <div className="h-48 w-full max-w-sm animate-pulse rounded-2xl bg-foreground/[0.08] lg:self-end" />
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-[1600px] px-6 pb-24 pt-24 md:px-10 md:pt-36">
        <EmptyCart />
      </section>
    );
  }

  const total = getTotal();

  return (
    <section className="mx-auto max-w-[1600px] px-5 pb-24 pt-24 sm:px-6 md:px-10 md:pt-36">
      <div className="mb-8 flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between lg:mb-10">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Your cart
        </h1>
        <Link
          href="/product"
          className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary-readable hover:underline"
        >
          Continue shopping
        </Link>
      </div>

      <div className="flex flex-col gap-8">
        <CartItemsList />
        <CartSummary total={total} />
      </div>
    </section>
  );
}
