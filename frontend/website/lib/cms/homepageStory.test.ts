import { describe, expect, it } from "vitest";
import {
  LEGACY_FABRIC_STORY_CARDS,
  parseHomepageStoryConfig,
} from "./homepageStory";

describe("parseHomepageStoryConfig", () => {
  it("keeps an empty tenant-neutral story free of clothing content", () => {
    const story = parseHomepageStoryConfig({});
    expect(story.layout).toBe("simple");
    expect(story.cards).toEqual([]);
    expect(story.imageValue).toBeNull();
  });

  it("preserves the legacy VE Gear fabric story", () => {
    const story = parseHomepageStoryConfig({ variant: "fabric" });
    expect(story.layout).toBe("feature");
    expect(story.imageValue).toBe("240 GSM Cotton");
    expect(story.cards).toEqual(LEGACY_FABRIC_STORY_CARDS);
  });

  it("respects explicit empty cards and normalizes configured cards", () => {
    expect(
      parseHomepageStoryConfig({ variant: "fabric", cards: [] }).cards,
    ).toEqual([]);
    expect(
      parseHomepageStoryConfig({
        cards: [
          {
            id: "authentic",
            icon: "award",
            label: "Authentic",
            detail: "Japan sourced",
          },
          { icon: "unknown", label: "Care", detail: "Helpful service" },
        ],
      }).cards,
    ).toEqual([
      {
        id: "authentic",
        icon: "award",
        label: "Authentic",
        detail: "Japan sourced",
      },
      {
        id: "story-card-2",
        icon: "sparkles",
        label: "Care",
        detail: "Helpful service",
      },
    ]);
  });
});
