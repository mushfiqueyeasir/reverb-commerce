import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOMEPAGE_SECTIONS,
  HOMEPAGE_SECTION_TYPES,
  type HomepageSectionRow,
} from "../../type/db";
import {
  getHomepageSectionDisplayName,
  getHomepageSectionFamily,
  getHomepageSectionMetadata,
  getHomepageSectionVersion,
  normalizeHomepageSections,
  normalizeHomepageSectionType,
  normalizeKawaiiHomepageTextConfig,
  parseKawaiiGuaranteesConfig,
  parseKawaiiStudioNotesConfig,
} from "./homepageSections";

function legacySections(): HomepageSectionRow[] {
  return DEFAULT_HOMEPAGE_SECTIONS.slice(0, 6).map((row) => ({
    ...row,
    config: { ...row.config },
  }));
}

describe("homepage section normalization", () => {
  it("preserves six-row stores and appends every missing disabled section", () => {
    const existing = legacySections();
    existing[1] = {
      ...existing[1],
      id: "custom-categories",
      title: "Custom categories",
      sort: 20,
      config: { limit: 3 },
    };

    const normalized = normalizeHomepageSections(existing);

    expect(normalized).toHaveLength(17);
    expect(normalized.find((row) => row.type === "categories")).toEqual(
      existing[1],
    );
    expect(normalized.slice(6).map((row) => row.type)).toEqual([
      "banner_v2",
      "categories_v2",
      "featured_v2",
      "reviews_v2",
      "promo_v2",
      "richtext_v2",
      "deals",
      "new_arrivals",
      "guarantees",
      "studio_notes",
      "ai_search",
    ]);
    expect(normalized.slice(6).every((row) => !row.active)).toBe(true);
    expect(new Set(normalized.map((row) => row.type)).size).toBe(17);
    expect(normalized[6].sort).toBe(21);
  });

  it("normalizes legacy hero rows to banner", () => {
    const hero = {
      ...legacySections()[0],
      id: "legacy-hero",
      type: "hero",
      title: "Legacy hero",
    } as unknown as HomepageSectionRow;

    const normalized = normalizeHomepageSections([hero], {
      appendMissing: false,
    });

    expect(normalized).toEqual([
      { ...hero, type: "banner", config: hero.config },
    ]);
  });

  it("rejects unknown types and does not add defaults when disabled", () => {
    const unknown = {
      ...legacySections()[0],
      type: "video",
    } as unknown as HomepageSectionRow;

    expect(normalizeHomepageSectionType("video")).toBeNull();
    expect(
      normalizeHomepageSections([unknown], { appendMissing: false }),
    ).toEqual([]);
    expect(normalizeHomepageSections([], { appendMissing: false })).toEqual([]);
  });

  it("skips malformed rows without discarding valid sections", () => {
    const valid = legacySections()[0];
    const malformed = [
      null,
      "banner",
      { type: "featured" },
      { ...valid, sort: NaN },
    ];

    expect(
      normalizeHomepageSections([valid, ...malformed], {
        appendMissing: false,
      }),
    ).toEqual([valid]);
  });

  it("exposes family, version, and display metadata for every fixed type", () => {
    expect(HOMEPAGE_SECTION_TYPES).toHaveLength(17);
    expect(
      HOMEPAGE_SECTION_TYPES.every(
        (type) => getHomepageSectionMetadata(type) !== null,
      ),
    ).toBe(true);
    expect(getHomepageSectionFamily("featured_v2")).toBe("featured");
    expect(getHomepageSectionVersion("featured_v2")).toBe(2);
    expect(getHomepageSectionDisplayName("featured_v2")).toBe(
      "Products - Runway",
    );
    expect(getHomepageSectionMetadata("deals")?.productSelection).toBe("deals");
    expect(getHomepageSectionMetadata("new_arrivals")?.productSelection).toBe(
      "new-arrivals",
    );
    expect(getHomepageSectionFamily("deals")).toBe("featured");
    expect(getHomepageSectionFamily("guarantees")).toBe("guarantees");
    expect(getHomepageSectionDisplayName("studio_notes")).toBe("Studio Notes");
    expect(getHomepageSectionMetadata("unknown")).toBeNull();
  });

  it("parses complete Kawaii support configuration without fallbacks", () => {
    const guarantees = DEFAULT_HOMEPAGE_SECTIONS.find(
      (row) => row.type === "guarantees",
    )!;
    const studio = DEFAULT_HOMEPAGE_SECTIONS.find(
      (row) => row.type === "studio_notes",
    )!;

    expect(parseKawaiiGuaranteesConfig(guarantees.config)).toEqual({
      accessibleLabel: "Shopping guarantees",
      items: [
        {
          title: "Carefully packed",
          body: "Prepared with attention, from us to you.",
        },
        {
          title: "Secure checkout",
          body: "A simple and protected shopping experience.",
        },
        {
          title: "Here to help",
          body: "Friendly support before and after your order.",
        },
      ],
    });
    expect(parseKawaiiStudioNotesConfig(studio.config)).toEqual({
      eyebrow: "Notes from the studio",
      ctaLabel: "Join our list",
      ctaUrl: "/contact-us",
    });
    expect(parseKawaiiGuaranteesConfig({ items: [] })).toBeNull();
    expect(parseKawaiiStudioNotesConfig({ eyebrow: "Notes" })).toBeNull();
  });

  it("canonically trims and validates Kawaii homepage text fields", () => {
    expect(
      normalizeKawaiiHomepageTextConfig("banner", {
        edit_label: "  Kawaii fashion edit  ",
        footer_note: "   ",
        carousel_role_description: "  carousel  ",
        untouched: true,
      }),
    ).toEqual({
      config: {
        edit_label: "Kawaii fashion edit",
        footer_note: null,
        carousel_role_description: "carousel",
        untouched: true,
      },
    });
    expect(
      normalizeKawaiiHomepageTextConfig("banner", {
        carousel_role_description: "x".repeat(121),
      }).error,
    ).toMatch(/120 characters or fewer/);
    expect(
      normalizeKawaiiHomepageTextConfig("featured", {
        product_list_label: "x".repeat(121),
      }).error,
    ).toMatch(/120 characters or fewer/);
    expect(
      normalizeKawaiiHomepageTextConfig("reviews", {
        rating_aria_template: 5,
      }).error,
    ).toMatch(/must be text/);
  });
});
