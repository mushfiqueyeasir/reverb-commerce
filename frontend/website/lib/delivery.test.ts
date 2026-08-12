import { describe, expect, it } from "vitest";
import { normalizeDeliveryCharges, shippingCostForZone } from "./delivery";

describe("delivery charges", () => {
  it("keeps legacy settings on paid delivery", () => {
    expect(
      normalizeDeliveryCharges({ insideDhaka: 80, outsideDhaka: 140 }),
    ).toEqual({
      insideDhaka: 80,
      outsideDhaka: 140,
      freeDelivery: false,
    });
  });

  it("preserves configured rates while delivery is free", () => {
    const charges = normalizeDeliveryCharges({
      insideDhaka: 80,
      outsideDhaka: 140,
      freeDelivery: true,
    });

    expect(charges).toEqual({
      insideDhaka: 80,
      outsideDhaka: 140,
      freeDelivery: true,
    });
    expect(shippingCostForZone(charges, "inside-dhaka")).toBe(0);
    expect(shippingCostForZone(charges, "outside-dhaka")).toBe(0);
  });

  it("uses configured rates when free delivery is disabled", () => {
    const charges = normalizeDeliveryCharges({
      insideDhaka: 75,
      outsideDhaka: 125,
      freeDelivery: false,
    });

    expect(shippingCostForZone(charges, "inside-dhaka")).toBe(75);
    expect(shippingCostForZone(charges, "outside-dhaka")).toBe(125);
  });

  it("falls back invalid rates and requires a boolean toggle", () => {
    expect(
      normalizeDeliveryCharges({
        insideDhaka: -1,
        outsideDhaka: "invalid",
        freeDelivery: "true",
      }),
    ).toEqual({
      insideDhaka: 70,
      outsideDhaka: 120,
      freeDelivery: false,
    });
  });
});
