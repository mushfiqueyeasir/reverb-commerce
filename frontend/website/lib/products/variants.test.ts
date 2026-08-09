import { describe, expect, it } from "vitest";
import { getProductSizeOptions } from "./variants";

describe("product size options", () => {
  it("uses the size chart while stock controls availability separately", () => {
    expect(
      getProductSizeOptions(
        [
          { size: "M", chest: "22", length: "28" },
          { size: "L", chest: "23", length: "29" },
          { size: "XL", chest: "24.5", length: "30" },
          { size: "2XL", chest: "26", length: "31" },
        ],
        [{ id: "variant-m", size: "M", color: null, quantity: 30 }],
      ),
    ).toEqual(["M", "L", "XL", "2XL"]);
  });

  it("uses inventory sizes when no size chart is configured", () => {
    expect(
      getProductSizeOptions(
        [],
        [{ id: "variant-42", size: "42", color: null, quantity: 5 }],
      ),
    ).toEqual(["42"]);
  });

  it("removes duplicate and empty size labels", () => {
    expect(
      getProductSizeOptions(
        [
          { size: "M", chest: "22", length: "28" },
          { size: " M ", chest: "22", length: "28" },
          { size: "", chest: "", length: "" },
        ],
        [],
      ),
    ).toEqual(["M"]);
  });
});
