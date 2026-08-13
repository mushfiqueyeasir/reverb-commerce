export const STORY_CARD_ICONS = [
  "layers",
  "shirt",
  "scissors",
  "zap",
  "sparkles",
  "award",
] as const;

export type StoryCardIcon = (typeof STORY_CARD_ICONS)[number];

export interface HomepageStoryCard {
  id: string;
  icon: StoryCardIcon;
  label: string;
  detail: string;
}

export interface HomepageStoryConfig {
  layout: "simple" | "feature";
  imagePath: string | null;
  imageAlt: string | null;
  imageLabel: string | null;
  imageValue: string | null;
  imageTag: string | null;
  copyLabel: string | null;
  cardsLabel: string | null;
  cards: HomepageStoryCard[];
}

export const LEGACY_FABRIC_STORY_CARDS: HomepageStoryCard[] = [
  { id: "gsm", icon: "layers", label: "240 GSM", detail: "Heavyweight" },
  {
    id: "cotton",
    icon: "shirt",
    label: "100% Cotton",
    detail: "Long staple",
  },
  {
    id: "shoulder",
    icon: "scissors",
    label: "Drop Shoulder",
    detail: "Signature cut",
  },
  {
    id: "fit",
    icon: "zap",
    label: "Oversized Fit",
    detail: "Boxy, relaxed",
  },
  {
    id: "shrink",
    icon: "sparkles",
    label: "Pre-Shrunk",
    detail: "Zero surprises",
  },
  {
    id: "stitch",
    icon: "award",
    label: "Premium Stitch",
    detail: "Double-needle",
  },
];

function stringValue(config: Record<string, unknown>, key: string) {
  const value = config[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseCards(value: unknown): HomepageStoryCard[] | null {
  if (!Array.isArray(value)) return null;
  const cards: HomepageStoryCard[] = [];
  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== "object") continue;
    const card = item as Record<string, unknown>;
    const label = typeof card.label === "string" ? card.label.trim() : "";
    const detail = typeof card.detail === "string" ? card.detail.trim() : "";
    if (!label && !detail) continue;
    const icon = STORY_CARD_ICONS.includes(card.icon as StoryCardIcon)
      ? (card.icon as StoryCardIcon)
      : "sparkles";
    const id =
      typeof card.id === "string" && card.id.trim()
        ? card.id.trim()
        : `story-card-${index + 1}`;
    cards.push({ id, icon, label, detail });
  }
  return cards.slice(0, 6);
}

export function parseHomepageStoryConfig(
  config: Record<string, unknown> = {},
): HomepageStoryConfig {
  const legacyFabric = config.variant === "fabric";
  const cards = parseCards(config.cards);
  return {
    layout:
      config.layout === "feature"
        ? "feature"
        : config.layout === "simple"
          ? "simple"
          : legacyFabric
            ? "feature"
            : "simple",
    imagePath: stringValue(config, "image_path"),
    imageAlt: stringValue(config, "image_alt"),
    imageLabel:
      stringValue(config, "image_label") || (legacyFabric ? "Fabric" : null),
    imageValue:
      stringValue(config, "image_value") ||
      (legacyFabric ? "240 GSM Cotton" : null),
    imageTag:
      stringValue(config, "image_tag") || (legacyFabric ? "// LAB 04" : null),
    copyLabel:
      stringValue(config, "copy_label") ||
      (legacyFabric ? "Material Study" : null),
    cardsLabel:
      stringValue(config, "cards_label") ||
      (legacyFabric ? "Material index" : null),
    cards:
      cards ??
      (legacyFabric
        ? LEGACY_FABRIC_STORY_CARDS.map((card) => ({ ...card }))
        : []),
  };
}

export function storyConfigPayload(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const story = parseHomepageStoryConfig(config);
  return {
    layout: story.layout,
    image_path: story.imagePath,
    image_bucket: "branding",
    image_alt: story.imageAlt,
    image_label: story.imageLabel,
    image_value: story.imageValue,
    image_tag: story.imageTag,
    copy_label: story.copyLabel,
    cards_label: story.cardsLabel,
    cards: story.cards,
  };
}
