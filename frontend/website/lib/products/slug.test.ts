import { describe, expect, it } from "vitest";
import { chooseUniqueProductSlug, productSlugBase } from "./slug";

describe("product slugs", () => {
  it("generates a URL-safe slug from the title", () => {
    expect(productSlugBase("  Limited Edition Ride Tee!  ")).toBe(
      "limited-edition-ride-tee",
    );
  });

  it("uses a stable fallback when a title has no ASCII slug characters", () => {
    expect(productSlugBase("!!!")).toBe("product");
  });

  it("adds the first available numeric suffix for duplicate titles", () => {
    expect(
      chooseUniqueProductSlug("Signature Tee", [
        "signature-tee",
        "signature-tee-2",
        "signature-tee-4",
      ]),
    ).toBe("signature-tee-3");
  });

  it("does not change an available slug", () => {
    expect(chooseUniqueProductSlug("Signature Tee", [])).toBe("signature-tee");
  });
});
