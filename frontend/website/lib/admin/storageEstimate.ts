export const ESTIMATED_IMAGES_PER_PRODUCT = 5;
export const EXPECTED_OPTIMIZED_IMAGE_BYTES = 800_000;
export const ESTIMATED_IMAGE_RANGE_BYTES = {
  low: 600_000,
  high: 1_000_000,
} as const;
export const STORAGE_HEADROOM_RATIO = 0.1;

export interface ProductCapacityEstimate {
  expectedProducts: number;
  lowerProducts: number;
  upperProducts: number;
  usableBytes: number;
}

export type ProductCapacityLevel = "low" | "limited" | "healthy";

export function productCapacityLevel(products: number): ProductCapacityLevel {
  if (products < 20) return "low";
  if (products < 50) return "limited";
  return "healthy";
}

export function estimateProductCapacity(
  remainingBytes: number,
): ProductCapacityEstimate {
  const safeRemaining = Number.isFinite(remainingBytes)
    ? Math.max(0, remainingBytes)
    : 0;
  const usableBytes = Math.floor(safeRemaining * (1 - STORAGE_HEADROOM_RATIO));
  const productsAt = (averageImageBytes: number) =>
    Math.floor(
      usableBytes / (averageImageBytes * ESTIMATED_IMAGES_PER_PRODUCT),
    );

  return {
    expectedProducts: productsAt(EXPECTED_OPTIMIZED_IMAGE_BYTES),
    lowerProducts: productsAt(ESTIMATED_IMAGE_RANGE_BYTES.high),
    upperProducts: productsAt(ESTIMATED_IMAGE_RANGE_BYTES.low),
    usableBytes,
  };
}
