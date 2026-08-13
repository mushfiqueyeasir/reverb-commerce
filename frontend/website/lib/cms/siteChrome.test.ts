import { describe, expect, it } from "vitest";
import {
  DEFAULT_FOOTER,
  DEFAULT_NAVBAR,
  isSafeChromeHref,
  normalizeFooterConfig,
  normalizeNavbarConfig,
} from "./siteChrome";

describe("site chrome normalization", () => {
  it("returns independent defaults for missing configuration", () => {
    const navbar = normalizeNavbarConfig(undefined);
    const footer = normalizeFooterConfig(undefined);
    expect(navbar).toEqual(DEFAULT_NAVBAR);
    expect(footer).toEqual(DEFAULT_FOOTER);
    navbar.items[0].label = "Changed";
    expect(DEFAULT_NAVBAR.items[0].label).toBe("Category");
  });

  it("normalizes navbar variants, links, and duplicate category menus", () => {
    const navbar = normalizeNavbarConfig({
      variant: "unknown",
      items: [
        { id: "one", kind: "categories", label: "Shop", href: "/ignored" },
        { id: "two", kind: "categories", label: "More", href: "/more" },
        { id: "bad", kind: "link", label: "Bad", href: "javascript:alert(1)" },
      ],
    });
    expect(navbar.variant).toBe("classic");
    expect(navbar.items).toEqual([
      { id: "one", kind: "categories", label: "Shop", href: "/product" },
      { id: "two", kind: "link", label: "More", href: "/more" },
    ]);
  });

  it("supports a legacy footer description and removes unsafe links", () => {
    expect(normalizeFooterConfig(undefined, "Legacy copy").description).toBe(
      "Legacy copy",
    );
    const footer = normalizeFooterConfig({
      variant: "compact",
      description: "Custom copy",
      columns: [
        {
          id: "help",
          title: "Help",
          links: [
            { id: "safe", label: "Contact", href: "/contact-us" },
            { id: "bad", label: "Bad", href: "data:text/html,test" },
          ],
        },
      ],
      legalLinks: [],
    });
    expect(footer.variant).toBe("compact");
    expect(footer.columns[0].links).toEqual([
      { id: "safe", label: "Contact", href: "/contact-us" },
    ]);
  });
});

describe("isSafeChromeHref", () => {
  it("allows supported destinations and blocks executable URLs", () => {
    expect(isSafeChromeHref("/product?category=gear")).toBe(true);
    expect(isSafeChromeHref("https://example.com/page")).toBe(true);
    expect(isSafeChromeHref("mailto:hello@example.com")).toBe(true);
    expect(isSafeChromeHref("tel:+8801000000000")).toBe(true);
    expect(isSafeChromeHref("//example.com")).toBe(false);
    expect(isSafeChromeHref("/\\example.com/path")).toBe(false);
    expect(isSafeChromeHref("javascript:alert(1)")).toBe(false);
  });
});
