import { describe, expect, it } from "vitest";
import { generateProductSku } from "./sku";

describe("product SKU generation", () => {
  it("combines product, color, and size tokens", () => {
    expect(generateProductSku("Nike Air Max", "Black", "42")).toBe(
      "NIK-AIR-MAX-BLK-42",
    );
  });

  it("omits size and color for a size-free product", () => {
    expect(generateProductSku("Bike Helmet")).toBe("BIK-HEL");
  });

  it("normalizes punctuation and accents", () => {
    expect(generateProductSku("Café Racer", "Mid-night", "M/L")).toBe(
      "CAF-RAC-MIT-ML",
    );
  });
});
