import { describe, expect, it } from "vitest";
import {
  estimateProductCapacity,
  ESTIMATED_IMAGES_PER_PRODUCT,
  EXPECTED_OPTIMIZED_IMAGE_BYTES,
  productCapacityLevel,
} from "./storageEstimate";

describe("product storage capacity estimate", () => {
  it("uses five compressed images and keeps ten percent headroom", () => {
    expect(ESTIMATED_IMAGES_PER_PRODUCT).toBe(5);
    expect(EXPECTED_OPTIMIZED_IMAGE_BYTES).toBe(800_000);
    expect(estimateProductCapacity(900_000_000)).toEqual({
      expectedProducts: 202,
      lowerProducts: 162,
      upperProducts: 270,
      usableBytes: 810_000_000,
    });
  });

  it("floors partial product capacity", () => {
    expect(estimateProductCapacity(10_000_000).expectedProducts).toBe(2);
  });

  it("never returns negative capacity", () => {
    expect(estimateProductCapacity(-1)).toEqual({
      expectedProducts: 0,
      lowerProducts: 0,
      upperProducts: 0,
      usableBytes: 0,
    });
  });

  it("assigns capacity color levels at the configured thresholds", () => {
    expect(productCapacityLevel(19)).toBe("low");
    expect(productCapacityLevel(20)).toBe("limited");
    expect(productCapacityLevel(49)).toBe("limited");
    expect(productCapacityLevel(50)).toBe("healthy");
  });
});
