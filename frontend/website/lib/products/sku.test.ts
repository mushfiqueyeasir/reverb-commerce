import { describe, expect, it } from "vitest";
import { generateProductSku, generateUniqueProductSkus } from "./sku";

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

  it("disambiguates matching generated SKUs", () => {
    expect(
      generateUniqueProductSkus("Utility Bottle", [
        { id: "12345678-abcd-4000-8000-000000000001" },
        { id: "87654321-abcd-4000-8000-000000000002" },
      ]),
    ).toEqual(["UTI-BOT", "UTI-BOT-87654321"]);
  });

  it("moves every SKU to a new candidate after a database collision", () => {
    expect(
      generateUniqueProductSkus(
        "Utility Bottle",
        [{ id: "12345678-abcd-4000-8000-000000000001" }],
        2,
      ),
    ).toEqual(["UTI-BOT-12345678ABCD"]);
  });
});
