import { describe, expect, it } from "vitest";
import {
  DEFAULT_FOOTER,
  DEFAULT_NAVBAR,
  interpolateChromeTemplate,
  isSafeChromeHref,
  normalizeFooterConfig,
  normalizeNavbarConfig,
  resolveKawaiiAnnouncement,
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

  it("normalizes navbar announcement content", () => {
    const navbar = normalizeNavbarConfig({
      announcement: {
        text: `  Free\n delivery   ${"x".repeat(200)}  `,
        active: true,
        url: " javascript:alert(1) ",
      },
    });
    expect(navbar.announcement).toEqual({
      text: `Free delivery ${"x".repeat(146)}`,
      active: true,
      url: null,
    });
    expect(navbar.announcement?.text).toHaveLength(160);
    expect(
      normalizeNavbarConfig({
        announcement: { text: "   ", active: true, url: "/product" },
      }).announcement,
    ).toEqual({ text: "", active: false, url: "/product" });
    expect(
      normalizeNavbarConfig({
        announcement: { text: "Sale", active: 1, url: "https://example.com" },
      }).announcement,
    ).toEqual({ text: "Sale", active: false, url: "https://example.com" });
  });

  it("normalizes nested Kawaii copy without sharing defaults", () => {
    const navbar = normalizeNavbarConfig({
      copy: {
        mobileHomeLabel: "Start",
        shopAllTemplate: "Browse {label}",
      },
      productCardCopy: {
        addFavoriteAriaLabel: "  Keep this  ",
        favoriteSavedToast: "x".repeat(200),
        quickAddButtonLabel: "",
      },
    });
    const footer = normalizeFooterConfig({
      copy: { copyrightTemplate: "{storeName} / {year}" },
    });

    expect(navbar.copy.mobileHomeLabel).toBe("Start");
    expect(navbar.copy.shopAllTemplate).toBe("Browse {label}");
    expect(navbar.copy.mobileBagLabel).toBe("Bag");
    expect(navbar.productCardCopy.addFavoriteAriaLabel).toBe("Keep this");
    expect(navbar.productCardCopy.favoriteSavedToast).toHaveLength(160);
    expect(navbar.productCardCopy.quickAddButtonLabel).toBe("Quick Add");
    expect(navbar.productCardCopy.soldOutButtonLabel).toBe("Sold Out");
    expect(footer.copy.copyrightTemplate).toBe("{storeName} / {year}");
    expect(footer.copy.facebookAriaLabel).toBe("Facebook");
    navbar.copy.mobileHomeLabel = "Changed";
    navbar.productCardCopy.quickAddButtonLabel = "Changed";
    expect(DEFAULT_NAVBAR.copy.mobileHomeLabel).toBe("Home");
    expect(DEFAULT_NAVBAR.productCardCopy.quickAddButtonLabel).toBe(
      "Quick Add",
    );
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

describe("resolveKawaiiAnnouncement", () => {
  const legacy = { text: "Legacy", active: true, url: "/legacy" };

  it("uses legacy settings only when navbar announcement is null", () => {
    expect(resolveKawaiiAnnouncement(null, legacy)).toEqual({
      text: "Legacy",
      active: true,
      url: "/legacy",
    });
  });

  it("lets an explicitly inactive navbar announcement suppress legacy", () => {
    expect(
      resolveKawaiiAnnouncement(
        { text: "Native", active: false, url: "/native" },
        legacy,
      ),
    ).toEqual({ text: "Native", active: false, url: "/native" });
  });
});

describe("interpolateChromeTemplate", () => {
  it("replaces only explicitly allowed tokens as plain text", () => {
    expect(
      interpolateChromeTemplate(
        "Shop {label} at {storeName} {year}",
        { label: "<b>Beauty</b>", storeName: "Kawaii", year: 2026 },
        ["label"],
      ),
    ).toBe("Shop <b>Beauty</b> at {storeName} {year}");
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
