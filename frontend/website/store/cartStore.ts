import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  variantId: string;
  title: string;
  image: string;
  currentPrice: number;
  originalPrice: number;
  size: string | null;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  isItemInCart: (variantId: string) => boolean;
  getTotal: () => number;
  getItemCount: () => number;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { variantId, quantity = 1 } = item;
        const currentState = get();
        const existingItem = currentState.items.find(
          (i) => i.variantId === variantId,
        );

        if (existingItem) {
          set({
            ...currentState,
            items: currentState.items.map((i) =>
              i.variantId === variantId
                ? { ...i, quantity: i.quantity + quantity }
                : i,
            ),
          });
        } else {
          set({
            ...currentState,
            items: [...currentState.items, { ...item, quantity }],
          });
        }
      },

      removeItem: (variantId) => {
        const currentState = get();
        set({
          ...currentState,
          items: currentState.items.filter((i) => i.variantId !== variantId),
        });
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }

        const currentState = get();
        set({
          ...currentState,
          items: currentState.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i,
          ),
        });
      },

      isItemInCart: (variantId) => {
        return get().items.some((i) => i.variantId === variantId);
      },

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.currentPrice * item.quantity,
          0,
        );
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      clearCart: () => {
        const currentState = get();
        set({ ...currentState, items: [] });
      },
    }),
    {
      name: "cart-storage",
      version: 2,
      migrate: (persisted, version) =>
        version < 2 ? { items: [] } : (persisted as CartStore),
    },
  ),
);
