import { describe, expect, it } from "vitest";
import {
  ABOUT_SECTION_TYPES,
  DEFAULT_ABOUT_SECTIONS,
  getAboutSectionDisplayName,
  getAboutSectionFamily,
  getAboutSectionMetadata,
  getAboutSectionVersion,
  normalizeAboutSections,
  normalizeAboutSectionType,
  type AboutSectionRow,
} from "./aboutSections";

function legacySections(): AboutSectionRow[] {
  return DEFAULT_ABOUT_SECTIONS.slice(0, 6).map((section) => ({
    ...section,
    config: { ...section.config },
  }));
}

describe("about section normalization", () => {
  it("preserves six-row stores and appends disabled V2 designs", () => {
    const existing = legacySections();
    existing[2] = {
      ...existing[2],
      id: "custom-story",
      sort: 20,
      config: { title: "A custom story" },
    };

    const normalized = normalizeAboutSections(existing);

    expect(normalized).toHaveLength(12);
    expect(
      normalized.find((section) => section.type === "story"),
    ).toMatchObject({
      id: "custom-story",
      sort: 20,
      config: { title: "A custom story" },
    });
    expect(normalized.slice(6).map((section) => section.type)).toEqual([
      "hero_v2",
      "stats_v2",
      "story_v2",
      "values_v2",
      "craft_v2",
      "cta_v2",
    ]);
    expect(normalized.slice(6).every((section) => !section.active)).toBe(true);
    expect(new Set(normalized.map((section) => section.type)).size).toBe(12);
    expect(normalized[6].sort).toBe(21);
  });

  it("supports persisted seed rows without timestamps", () => {
    const seeded = {
      id: "seed-hero",
      type: "hero",
      title: "Seed hero",
      sort: 0,
      active: true,
      config: { image_path: "hero.png" },
    };

    const normalized = normalizeAboutSections([seeded], {
      appendMissing: false,
    });

    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toMatchObject({
      id: "seed-hero",
      type: "hero",
      created_at: "1970-01-01T00:00:00.000Z",
      updated_at: "1970-01-01T00:00:00.000Z",
      config: {
        image_path: "hero.png",
        headline_line1: "Designed with purpose.",
      },
    });
  });

  it("rejects unknown, duplicate, and malformed rows", () => {
    const valid = legacySections()[0];
    const duplicate = { ...valid, id: "duplicate-hero" };
    const unknown = { ...valid, id: "unknown", type: "video" };
    const malformed = { ...valid, id: "bad-sort", sort: Number.NaN };

    expect(normalizeAboutSectionType("video")).toBeNull();
    expect(
      normalizeAboutSections(
        [valid, duplicate, unknown, malformed, null, "hero"],
        { appendMissing: false },
      ),
    ).toEqual([valid]);
    expect(normalizeAboutSections([], { appendMissing: false })).toEqual([]);
  });

  it("exposes family, version, and display metadata for every design", () => {
    expect(ABOUT_SECTION_TYPES).toHaveLength(12);
    expect(
      ABOUT_SECTION_TYPES.every(
        (type) => getAboutSectionMetadata(type) !== null,
      ),
    ).toBe(true);
    expect(getAboutSectionFamily("craft_v2")).toBe("craft");
    expect(getAboutSectionVersion("craft_v2")).toBe(2);
    expect(getAboutSectionDisplayName("craft_v2")).toBe("Craft - Blueprint");
    expect(getAboutSectionMetadata("unknown")).toBeNull();
  });
});
