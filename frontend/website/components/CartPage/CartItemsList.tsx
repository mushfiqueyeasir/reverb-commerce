"use client";

import { useCartStore } from "@/store/cartStore";
import CartItem from "./CartItem";
import CartHeader from "./CartHeader";

export default function CartItemsList() {
  const { items } = useCartStore();

  return (
    <div className="w-full">
      <CartHeader />

      <div className="space-y-6">
        {items.map((item) => (
          <CartItem key={item.variantId} item={item} />
        ))}
      </div>
    </div>
  );
}
