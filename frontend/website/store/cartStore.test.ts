import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "./cartStore";

const item = (variantId: string, size: string | null) => ({
  id: "product-1",
  variantId,
  title: "Test product",
  image: "/test.png",
  currentPrice: 100,
  originalPrice: 120,
  size,
});

describe("cart variant identity", () => {
  beforeEach(() => useCartStore.setState({ items: [] }));

  it("merges quantities for the same variant", () => {
    useCartStore.getState().addItem({ ...item("variant-m", "M"), quantity: 1 });
    useCartStore.getState().addItem({ ...item("variant-m", "M"), quantity: 2 });

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  it("supports a size-free variant without a synthetic size", () => {
    useCartStore
      .getState()
      .addItem({ ...item("variant-general", null), quantity: 1 });

    expect(useCartStore.getState().items[0]).toMatchObject({
      variantId: "variant-general",
      size: null,
    });
  });

  it("keeps different variants as separate cart lines", () => {
    useCartStore.getState().addItem(item("variant-m", "M"));
    useCartStore.getState().addItem(item("variant-l", "L"));

    expect(useCartStore.getState().items).toHaveLength(2);
  });
});
