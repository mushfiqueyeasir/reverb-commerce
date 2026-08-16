"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_BANNER_DESCRIPTION,
  DEFAULT_BANNER_MARQUEE,
  DEFAULT_BANNER_STATS,
  isBannerSectionType,
  type BannerRow,
  type BannerStatItem,
  type HomepageSectionRow,
} from "@/type/db";
import {
  getHomepageSectionDisplayName,
  getHomepageSectionFamily,
  getHomepageSectionVersion,
  parseKawaiiGuaranteesConfig,
  type HomepageSectionFamily,
  type KawaiiGuaranteeItem,
} from "@/lib/cms/homepageSections";
import {
  parseHomepageStoryConfig,
  STORY_CARD_ICONS,
  type HomepageStoryCard,
  type StoryCardIcon,
} from "@/lib/cms/homepageStory";
import { BUCKETS } from "@/lib/supabase/config";
import {
  STOREFRONT_THEME_REGISTRY,
  type StorefrontThemeSectionField,
} from "@/lib/theme/manifest";
import { AdminCard } from "@/components/admin/AdminCard";
import {
  FormActions,
  FormField,
  adminInputClass,
  adminSelectClass,
  adminTextareaClass,
} from "@/components/admin/FormField";
import {
  ImageUploader,
  type UploadedImage,
} from "@/components/admin/ImageUploader";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { SortableList } from "@/components/admin/SortableList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BannersTable } from "../banners/BannersTable";
import { saveSection } from "./actions";

const FAMILY_INFO: Record<HomepageSectionFamily, string> = {
  banner:
    "Banner carousel with independently managed slides and supporting copy.",
  categories: "Category grid from your Catalog → Categories.",
  featured: "Product grid from your latest active products.",
  reviews: "Review photos and quotes from Content → Reviews.",
  promo: "Promotion block driven by a selected promotion.",
  richtext: "Custom rich-text block for brand story or notes.",
  guarantees: "Three shopping reassurance cards shown by Kawaii Fashion.",
  studio_notes: "Kawaii Fashion studio note and contact call to action.",
  ai_search:
    "Kawaii Fashion promo introducing the AI shopping advisor and opening the advisor directly.",
};

const MIN_LIMIT = 1;
const MAX_LIMIT = 24;
const MAX_FEATURED_LIMIT = 5;
const MAX_FEATURED_V2_LIMIT = 6;
const MAX_MOSAIC_CATEGORIES = 4;

function clampLimit(value: number, maximum = MAX_LIMIT): number {
  return Math.min(maximum, Math.max(MIN_LIMIT, Math.floor(value)));
}

function clampFeaturedLimit(value: number, maximum: number): number {
  const limit = clampLimit(value, maximum);
  return limit === maximum - 1 ? maximum : limit;
}

export interface HomepageCategoryOption {
  id: string;
  name: string;
}

export interface PromotionOption {
  id: string;
  title: string;
  active: boolean;
}

function strConfig(
  config: Record<string, unknown>,
  key: string,
  fallback = "",
): string {
  const v = config[key];
  return typeof v === "string" ? v : fallback;
}

function numConfig(
  config: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const v = config[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function stringArrayConfig(
  config: Record<string, unknown>,
  key: string,
): string[] | null {
  const value = config[key];
  if (!Array.isArray(value)) return null;
  return [
    ...new Set(
      value.filter((item): item is string => typeof item === "string"),
    ),
  ];
}

function boolConfig(
  config: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  const v = config[key];
  return typeof v === "boolean" ? v : fallback;
}

function parseStats(config: Record<string, unknown>): BannerStatItem[] {
  const raw = config.stats;
  if (!Array.isArray(raw) || !raw.length) {
    return DEFAULT_BANNER_STATS.map((s) => ({ ...s }));
  }
  const parsed = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      return {
        label: typeof o.label === "string" ? o.label : "",
        value: typeof o.value === "string" ? o.value : "",
      };
    })
    .filter((x): x is BannerStatItem => Boolean(x));
  while (parsed.length < 4) parsed.push({ label: "", value: "" });
  return parsed.slice(0, 4);
}

function parseMarqueeItems(config: Record<string, unknown>): string[] {
  const raw = config.marquee_items;
  if (Array.isArray(raw) && raw.length) {
    const parsed = raw
      .map((x) => (typeof x === "string" ? x : ""))
      .filter((x) => x.trim().length > 0);
    if (parsed.length) return parsed;
  }
  return [...DEFAULT_BANNER_MARQUEE];
}

function emptyGuaranteeItems(): [
  KawaiiGuaranteeItem,
  KawaiiGuaranteeItem,
  KawaiiGuaranteeItem,
] {
  return [
    { title: "", body: "" },
    { title: "", body: "" },
    { title: "", body: "" },
  ];
}

export function SectionForm({
  section,
  promotions = [],
  categories = [],
  banners = [],
  canWrite = false,
  initialTab = "content",
  themeId,
}: {
  section: HomepageSectionRow;
  promotions?: PromotionOption[];
  categories?: HomepageCategoryOption[];
  banners?: BannerRow[];
  canWrite?: boolean;
  initialTab?: "content" | "slides";
  themeId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const config = section.config ?? {};
  const storyConfig = parseHomepageStoryConfig(config);
  const guaranteesConfig = parseKawaiiGuaranteesConfig(config);
  const family = getHomepageSectionFamily(section.type);
  const version = getHomepageSectionVersion(section.type);
  const displayName =
    getHomepageSectionDisplayName(section.type) ?? section.type;
  const admin = STOREFRONT_THEME_REGISTRY[themeId]?.admin;
  const isKawaii = admin?.kawaiiLabels ?? false;
  const sectionFieldGroups = admin?.sectionFieldGroups ?? [];
  const extraFieldGroups = sectionFieldGroups.filter(
    (group) => group.family === family,
  );
  const maxMosaicCategories =
    admin?.maxMosaicCategories ?? MAX_MOSAIC_CATEGORIES;
  const featuredLimit = admin?.featuredLimit ?? null;
  const bannerSectionType = isBannerSectionType(section.type)
    ? section.type
    : null;
  const isBanner = family === "banner";
  const hasRequiredLimit = family === "featured" || family === "reviews";
  const hasOptionalLimit = family === "categories" && version === 2;
  const showsEyebrow =
    family === "categories" ||
    family === "featured" ||
    family === "reviews" ||
    family === "richtext" ||
    family === "studio_notes";
  const showsCta =
    family === "categories" ||
    family === "featured" ||
    family === "reviews" ||
    family === "richtext" ||
    family === "studio_notes";
  const limitMaximum =
    family === "featured"
      ? (featuredLimit ??
        (section.type === "featured_v2"
          ? MAX_FEATURED_V2_LIMIT
          : MAX_FEATURED_LIMIT))
      : MAX_LIMIT;
  const limitFallback =
    family === "reviews" ? 24 : family === "featured" ? limitMaximum : 8;
  const [tab, setTab] = useState<"content" | "slides">(
    initialTab === "slides" ? "slides" : "content",
  );

  const [title, setTitle] = useState(section.title ?? "");
  const [subtitle, setSubtitle] = useState(section.subtitle ?? "");
  const [body, setBody] = useState(section.body ?? "");
  const [active, setActive] = useState(section.active ?? true);
  const [guaranteesLabel, setGuaranteesLabel] = useState(
    guaranteesConfig?.accessibleLabel ?? "",
  );
  const [guaranteeItems, setGuaranteeItems] = useState(() =>
    guaranteesConfig
      ? guaranteesConfig.items.map((item) => ({ ...item }))
      : emptyGuaranteeItems(),
  );

  const [eyebrow, setEyebrow] = useState(strConfig(config, "eyebrow"));
  const [limit, setLimit] = useState(() => {
    if (hasOptionalLimit && typeof config.limit !== "number") return "";
    const configuredLimit = numConfig(config, "limit", limitFallback);
    return String(
      family === "featured" && !isKawaii
        ? clampFeaturedLimit(configuredLimit, limitMaximum)
        : clampLimit(configuredLimit, limitMaximum),
    );
  });
  const [ctaLabel, setCtaLabel] = useState(
    strConfig(
      config,
      "cta_label",
      isKawaii
        ? ""
        : family === "promo"
          ? "Shop the drop"
          : family === "featured"
            ? "View all products"
            : "",
    ),
  );
  const [ctaUrl, setCtaUrl] = useState(
    strConfig(
      config,
      "cta_url",
      family === "reviews"
        ? "/reviews"
        : family === "studio_notes"
          ? ""
          : "/product",
    ),
  );
  const [categoryIds, setCategoryIds] = useState(() => {
    const configured = stringArrayConfig(config, "category_ids");
    const initial =
      configured ??
      categories.slice(0, maxMosaicCategories).map((category) => category.id);
    const available = new Set(categories.map((category) => category.id));
    return initial
      .filter((categoryId) => available.has(categoryId))
      .slice(0, maxMosaicCategories);
  });
  const [storyLayout, setStoryLayout] = useState(storyConfig.layout);
  const [storyImages, setStoryImages] = useState<UploadedImage[]>(
    storyConfig.imagePath
      ? [{ path: storyConfig.imagePath, alt: storyConfig.imageAlt }]
      : [],
  );
  const [storyImageBusy, setStoryImageBusy] = useState(false);
  const [storyImageAlt, setStoryImageAlt] = useState(
    storyConfig.imageAlt ?? "",
  );
  const [storyImageLabel, setStoryImageLabel] = useState(
    storyConfig.imageLabel ?? "",
  );
  const [storyImageValue, setStoryImageValue] = useState(
    storyConfig.imageValue ?? "",
  );
  const [storyImageTag, setStoryImageTag] = useState(
    storyConfig.imageTag ?? "",
  );
  const [storyCopyLabel, setStoryCopyLabel] = useState(
    storyConfig.copyLabel ?? "",
  );
  const [storyCardsLabel, setStoryCardsLabel] = useState(
    storyConfig.cardsLabel ?? "",
  );
  const [pillLabel, setPillLabel] = useState(strConfig(config, "pill_label"));
  const [aiSearchImage, setAiSearchImage] = useState<UploadedImage[]>(() =>
    strConfig(config, "image_path")
      ? [
          {
            path: strConfig(config, "image_path"),
            alt: strConfig(config, "image_alt") || null,
          },
        ]
      : [],
  );
  const [aiSearchImageAlt, setAiSearchImageAlt] = useState(
    strConfig(config, "image_alt"),
  );
  const [aiSearchImageBusy, setAiSearchImageBusy] = useState(false);
  const [storyCards, setStoryCards] = useState<HomepageStoryCard[]>(
    storyConfig.cards,
  );
  const [showMarquee, setShowMarquee] = useState(
    boolConfig(config, "show_marquee", true),
  );
  const [promotionId, setPromotionId] = useState(
    strConfig(config, "promotion_id") || "__latest__",
  );
  const [promoImage, setPromoImage] = useState<UploadedImage[]>(() =>
    strConfig(config, "image_path")
      ? [
          {
            path: strConfig(config, "image_path"),
            alt: strConfig(config, "image_alt") || null,
          },
        ]
      : [],
  );
  const [promoImageAlt, setPromoImageAlt] = useState(
    strConfig(config, "image_alt"),
  );
  const [promoImageBusy, setPromoImageBusy] = useState(false);
  const [description, setDescription] = useState(
    strConfig(
      config,
      "description",
      isKawaii ? "" : DEFAULT_BANNER_DESCRIPTION,
    ),
  );
  const [extraText, setExtraText] = useState(() => {
    const initial: Record<string, string> = {};
    for (const group of extraFieldGroups) {
      for (const field of group.fields) {
        initial[field.key] = strConfig(config, field.key);
      }
    }
    return initial;
  });
  const [stats, setStats] = useState<BannerStatItem[]>(() =>
    parseStats(config),
  );
  const [marqueeItems, setMarqueeItems] = useState<string[]>(() =>
    parseMarqueeItems(config),
  );
  const selectedCategories = categoryIds
    .map((categoryId) =>
      categories.find((category) => category.id === categoryId),
    )
    .filter((category): category is HomepageCategoryOption =>
      Boolean(category),
    );
  const availableCategories = categories.filter(
    (category) => !categoryIds.includes(category.id),
  );

  const updateExtraText = (key: string, value: string) => {
    setExtraText((current) => ({ ...current, [key]: value }));
  };

  const updateGuaranteeItem = (
    index: number,
    key: keyof KawaiiGuaranteeItem,
    value: string,
  ) => {
    setGuaranteeItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  const updateStat = (
    index: number,
    key: keyof BannerStatItem,
    value: string,
  ) => {
    setStats((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [key]: value } : s)),
    );
  };

  const updateMarqueeItem = (index: number, value: string) => {
    setMarqueeItems((prev) =>
      prev.map((item, i) => (i === index ? value : item)),
    );
  };

  const addMarqueeItem = () => {
    setMarqueeItems((prev) => [...prev, ""]);
  };

  const removeMarqueeItem = (index: number) => {
    setMarqueeItems((prev) => {
      if (prev.length <= 1) return [""];
      return prev.filter((_, i) => i !== index);
    });
  };

  const addStoryCard = () => {
    if (storyCards.length >= 6) return;
    setStoryCards((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        icon: "sparkles",
        label: "",
        detail: "",
      },
    ]);
  };
  const updateStoryCard = (
    id: string,
    key: "icon" | "label" | "detail",
    value: string,
  ) => {
    setStoryCards((current) =>
      current.map((card) => {
        if (card.id !== id) return card;
        if (key === "icon") {
          return { ...card, icon: value as StoryCardIcon };
        }
        return key === "label"
          ? { ...card, label: value }
          : { ...card, detail: value };
      }),
    );
  };
  const removeStoryCard = (id: string) => {
    setStoryCards((current) => current.filter((card) => card.id !== id));
  };

  const onTabChange = (value: string) => {
    const next = value === "slides" ? "slides" : "content";
    setTab(next);
    router.replace(`/admin/homepage/${section.id}?tab=${next}`, {
      scroll: false,
    });
  };

  const submit = () => {
    const nextConfig: Record<string, unknown> = { ...config };

    if (showsEyebrow) nextConfig.eyebrow = eyebrow.trim() || null;
    if (showsCta || family === "promo") {
      nextConfig.cta_label = ctaLabel.trim() || null;
      nextConfig.cta_url = ctaUrl.trim() || null;
    }
    for (const group of extraFieldGroups) {
      for (const field of group.fields) {
        nextConfig[field.key] = (extraText[field.key] ?? "").trim() || null;
      }
    }
    if (hasRequiredLimit) {
      const parsedLimit = Number(limit);
      const value =
        limit.trim() && Number.isFinite(parsedLimit)
          ? parsedLimit
          : limitFallback;
      nextConfig.limit =
        family === "featured" && !isKawaii
          ? clampFeaturedLimit(value, limitMaximum)
          : clampLimit(value, limitMaximum);
    }
    if (hasOptionalLimit) {
      const value = Number(limit);
      nextConfig.limit =
        limit.trim() && Number.isFinite(value) ? clampLimit(value) : null;
    }
    if (section.type === "categories") {
      nextConfig.category_ids = categoryIds.slice(0, maxMosaicCategories);
    }
    if (section.type === "guarantees") {
      nextConfig.accessible_label = guaranteesLabel.trim();
      nextConfig.items = guaranteeItems.map((item) => ({
        title: item.title.trim(),
        body: item.body.trim(),
      }));
    }
    if (section.type === "ai_search") {
      nextConfig.eyebrow = eyebrow.trim() || null;
      nextConfig.pill_label = pillLabel.trim() || null;
      nextConfig.cta_label = ctaLabel.trim() || null;
      nextConfig.image_path = aiSearchImage[0]?.path ?? null;
      nextConfig.image_alt = aiSearchImageAlt.trim() || null;
    }
    if (family === "richtext") {
      nextConfig.layout =
        section.type === "richtext_v2" ? "feature" : storyLayout;
      nextConfig.image_path = storyImages[0]?.path ?? null;
      nextConfig.image_bucket = "branding";
      nextConfig.image_alt = storyImageAlt.trim() || null;
      nextConfig.image_label = storyImageLabel.trim() || null;
      nextConfig.image_value = storyImageValue.trim() || null;
      nextConfig.image_tag = storyImageTag.trim() || null;
      nextConfig.copy_label = storyCopyLabel.trim() || null;
      nextConfig.cards_label = storyCardsLabel.trim() || null;
      nextConfig.cards = storyCards.slice(0, 6).map((card) => ({
        id: card.id,
        icon: card.icon,
        label: card.label.trim(),
        detail: card.detail.trim(),
      }));
    }
    if (isBanner) {
      nextConfig.description =
        description.trim() || (isKawaii ? null : DEFAULT_BANNER_DESCRIPTION);
      if (version === 1 && !isKawaii) {
        nextConfig.show_marquee = showMarquee;
        nextConfig.stats = stats.map((s) => ({
          label: s.label.trim(),
          value: s.value.trim(),
        }));
        nextConfig.marquee_items = marqueeItems
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }
    if (family === "promo") {
      nextConfig.promotion_id =
        promotionId === "__latest__" ? null : promotionId;
      nextConfig.image_path = promoImage[0]?.path ?? null;
      nextConfig.image_alt = promoImageAlt.trim() || null;
    }

    startTransition(async () => {
      const res = await saveSection({
        id: section.id,
        type: section.type,
        title: title.trim() || null,
        subtitle: subtitle.trim() || null,
        body: body.trim() || null,
        active,
        config: nextConfig,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Section updated");
      router.push("/admin/homepage");
      router.refresh();
    });
  };

  const extraField = (field: StorefrontThemeSectionField) => (
    <FormField
      label={field.label}
      htmlFor={`theme-field-${field.key}`}
      hint={field.hint}
    >
      {field.kind === "textarea" ? (
        <Textarea
          id={`theme-field-${field.key}`}
          value={extraText[field.key] ?? ""}
          onChange={(event) => updateExtraText(field.key, event.target.value)}
          rows={3}
          className={adminTextareaClass}
        />
      ) : (
        <Input
          id={`theme-field-${field.key}`}
          value={extraText[field.key] ?? ""}
          onChange={(event) => updateExtraText(field.key, event.target.value)}
          className={adminInputClass}
        />
      )}
    </FormField>
  );

  const extraFieldGroupsMarkup = extraFieldGroups.map((group) => (
    <div
      key={group.family}
      className="space-y-5 rounded-xl border border-border bg-background/50 p-4"
    >
      <div>
        <p className="text-sm font-medium text-foreground">{group.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {group.description}
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {group.fields.map((field) => (
          <div
            key={field.key}
            className={field.kind === "textarea" ? "sm:col-span-2" : undefined}
          >
            {extraField(field)}
          </div>
        ))}
      </div>
    </div>
  ));

  const formActions = (
    <FormActions>
      <Button
        variant="outline"
        onClick={() => router.push("/admin/homepage")}
        disabled={pending}
        className="rounded-full px-6"
      >
        Cancel
      </Button>
      <Button
        onClick={submit}
        disabled={
          pending || storyImageBusy || aiSearchImageBusy || promoImageBusy
        }
        className="rounded-full px-6"
      >
        {pending ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Save className="mr-2 size-4" />
        )}
        Save changes
      </Button>
    </FormActions>
  );

  const activeToggle = (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">Active</p>
        <p className="text-xs text-muted-foreground">
          Show this section on the homepage
        </p>
      </div>
      <Switch id="active" checked={active} onCheckedChange={setActive} />
    </div>
  );

  if (bannerSectionType) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Tabs value={tab} onValueChange={onTabChange} className="w-full">
          <TabsList className="flex h-auto w-fit flex-wrap justify-start gap-1 rounded-xl bg-card p-1">
            <TabsTrigger value="content" className="rounded-lg px-4">
              Content
            </TabsTrigger>
            <TabsTrigger value="slides" className="rounded-lg px-4">
              Slides
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-6 space-y-8">
            <AdminCard
              title="Banner content"
              description={
                version === 1 && !isKawaii
                  ? "Stats bar, supporting copy, and marquee under the carousel."
                  : version === 1 && isKawaii
                    ? "Supporting copy and labels for the Kawaii carousel."
                    : FAMILY_INFO.banner
              }
            >
              <div className="space-y-5">
                <FormField label="Section type">
                  <div className="flex h-11 items-center">
                    <Badge variant="secondary">{displayName}</Badge>
                  </div>
                </FormField>

                <FormField
                  label="Supporting copy"
                  htmlFor="description"
                  hint="Short paragraph under the slide headline."
                >
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className={adminTextareaClass}
                  />
                </FormField>

                {extraFieldGroupsMarkup}

                {version === 1 && !isKawaii ? (
                  <>
                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        Stats bar
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Four label / value pairs shown along the bottom of the
                        banner.
                      </p>
                      <div className="space-y-3">
                        {stats.map((stat, i) => (
                          <div
                            key={i}
                            className="grid gap-3 rounded-xl border border-border bg-background/40 p-3 sm:grid-cols-2"
                          >
                            <FormField
                              label="Label"
                              htmlFor={`stat-label-${i}`}
                            >
                              <Input
                                id={`stat-label-${i}`}
                                value={stat.label}
                                onChange={(e) =>
                                  updateStat(i, "label", e.target.value)
                                }
                                placeholder="Weight"
                                className={adminInputClass}
                              />
                            </FormField>
                            <FormField
                              label="Value"
                              htmlFor={`stat-value-${i}`}
                            >
                              <Input
                                id={`stat-value-${i}`}
                                value={stat.value}
                                onChange={(e) =>
                                  updateStat(i, "value", e.target.value)
                                }
                                placeholder="Quality"
                                className={adminInputClass}
                              />
                            </FormField>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Show marquee
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Scrolling ticker under the banner
                        </p>
                      </div>
                      <Switch
                        checked={showMarquee}
                        onCheckedChange={setShowMarquee}
                      />
                    </div>

                    {showMarquee ? (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                              Marquee items
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Each phrase scrolls in the ticker under the
                              banner.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={addMarqueeItem}
                          >
                            <Plus className="size-4" /> Add item
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {marqueeItems.map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Input
                                id={`marquee-${i}`}
                                value={item}
                                onChange={(e) =>
                                  updateMarqueeItem(i, e.target.value)
                                }
                                placeholder="e.g. LIMITED DROP"
                                className={adminInputClass}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 rounded-full"
                                onClick={() => removeMarqueeItem(i)}
                                aria-label="Remove marquee item"
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : null}

                {activeToggle}
              </div>
            </AdminCard>
            {formActions}
          </TabsContent>

          <TabsContent value="slides" className="mt-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Image slides for the banner carousel. Drag to reorder. Empty or
                all inactive = banner stays hidden.
              </p>
              {canWrite ? (
                <Button asChild className="rounded-full">
                  <Link
                    href={`/admin/homepage/banners/new?section=${section.id}`}
                  >
                    <Plus className="mr-2 size-4" />
                    New slide
                  </Link>
                </Button>
              ) : null}
            </div>
            <BannersTable
              data={banners}
              canWrite={canWrite}
              sectionType={bannerSectionType}
              editBasePath="/admin/homepage/banners"
              sectionId={section.id}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  if (section.type === "guarantees") {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <AdminCard
          title="Shopping guarantees"
          description={FAMILY_INFO.guarantees}
        >
          <div className="space-y-5">
            <FormField
              label="Accessible label"
              htmlFor="accessible_label"
              hint="Describes this group to screen readers."
            >
              <Input
                id="accessible_label"
                value={guaranteesLabel}
                onChange={(event) => setGuaranteesLabel(event.target.value)}
                className={adminInputClass}
              />
            </FormField>
            <div className="space-y-4">
              {guaranteeItems.map((item, index) => (
                <div
                  key={index}
                  className="grid gap-4 rounded-xl border border-border bg-background/50 p-4 sm:grid-cols-2"
                >
                  <FormField
                    label={`Item ${index + 1} title`}
                    htmlFor={`guarantee-title-${index}`}
                  >
                    <Input
                      id={`guarantee-title-${index}`}
                      value={item.title}
                      onChange={(event) =>
                        updateGuaranteeItem(index, "title", event.target.value)
                      }
                      className={adminInputClass}
                    />
                  </FormField>
                  <FormField
                    label={`Item ${index + 1} body`}
                    htmlFor={`guarantee-body-${index}`}
                  >
                    <Textarea
                      id={`guarantee-body-${index}`}
                      value={item.body}
                      onChange={(event) =>
                        updateGuaranteeItem(index, "body", event.target.value)
                      }
                      rows={3}
                      className={adminTextareaClass}
                    />
                  </FormField>
                </div>
              ))}
            </div>
            {activeToggle}
          </div>
        </AdminCard>
        {formActions}
      </div>
    );
  }

  if (section.type === "studio_notes") {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <AdminCard title="Studio notes" description={FAMILY_INFO.studio_notes}>
          <div className="space-y-5">
            <FormField label="Eyebrow" htmlFor="eyebrow">
              <Input
                id="eyebrow"
                value={eyebrow}
                onChange={(event) => setEyebrow(event.target.value)}
                className={adminInputClass}
              />
            </FormField>
            <FormField label="Heading" htmlFor="title">
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={adminInputClass}
              />
            </FormField>
            <FormField label="Body" htmlFor="subtitle">
              <Textarea
                id="subtitle"
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
                rows={3}
                className={adminTextareaClass}
              />
            </FormField>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Button label" htmlFor="cta_label">
                <Input
                  id="cta_label"
                  value={ctaLabel}
                  onChange={(event) => setCtaLabel(event.target.value)}
                  className={adminInputClass}
                />
              </FormField>
              <FormField label="Button link" htmlFor="cta_url">
                <Input
                  id="cta_url"
                  value={ctaUrl}
                  onChange={(event) => setCtaUrl(event.target.value)}
                  className={adminInputClass}
                />
              </FormField>
            </div>
            {activeToggle}
          </div>
        </AdminCard>
        {formActions}
      </div>
    );
  }

  if (section.type === "ai_search") {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <AdminCard title="AI search" description={FAMILY_INFO.ai_search}>
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Eyebrow" htmlFor="eyebrow">
                <Input
                  id="eyebrow"
                  value={eyebrow}
                  onChange={(event) => setEyebrow(event.target.value)}
                  className={adminInputClass}
                />
              </FormField>
              <FormField
                label="Pill label"
                htmlFor="pill_label"
                hint="Small badge shown above the heading."
              >
                <Input
                  id="pill_label"
                  value={pillLabel}
                  onChange={(event) => setPillLabel(event.target.value)}
                  className={adminInputClass}
                />
              </FormField>
            </div>
            <FormField label="Heading" htmlFor="title">
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={adminInputClass}
              />
            </FormField>
            <FormField label="Body" htmlFor="subtitle">
              <Textarea
                id="subtitle"
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
                rows={3}
                className={adminTextareaClass}
              />
            </FormField>
            <FormField label="Button label" htmlFor="cta_label">
              <Input
                id="cta_label"
                value={ctaLabel}
                onChange={(event) => setCtaLabel(event.target.value)}
                className={adminInputClass}
              />
            </FormField>
            <FormField
              label="Image"
              hint="Shown beside the copy. The button opens the AI shopping advisor."
            >
              <ImageUploader
                bucket={BUCKETS.branding}
                value={aiSearchImage}
                onChange={setAiSearchImage}
                maxFiles={1}
                maxFileSizeMb={4}
                optimizeToWebp
                fileNamePrefix={`${section.type}-hero`}
                onBusyChange={setAiSearchImageBusy}
                disabled={pending || aiSearchImageBusy}
                label="Upload AI search image"
                preview="cover"
              />
            </FormField>
            <FormField label="Image alt text" htmlFor="ai-search-image-alt">
              <Input
                id="ai-search-image-alt"
                value={aiSearchImageAlt}
                onChange={(event) => setAiSearchImageAlt(event.target.value)}
                placeholder="Describe the image"
                className={adminInputClass}
              />
            </FormField>
            {activeToggle}
          </div>
        </AdminCard>
        {formActions}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <AdminCard
        title="Section content"
        description={family ? FAMILY_INFO[family] : undefined}
      >
        <div className="space-y-5">
          <FormField label="Section type">
            <div className="flex h-11 items-center">
              <Badge variant="secondary">{displayName}</Badge>
            </div>
          </FormField>

          {showsEyebrow ? (
            <FormField
              label="Eyebrow"
              htmlFor="eyebrow"
              hint="Small label above the heading (optional)."
            >
              <Input
                id="eyebrow"
                value={eyebrow}
                onChange={(e) => setEyebrow(e.target.value)}
                placeholder={
                  family === "categories"
                    ? "Collections"
                    : family === "reviews"
                      ? "Community"
                      : family === "richtext"
                        ? "Our manifesto"
                        : "Featured"
                }
                className={adminInputClass}
              />
            </FormField>
          ) : null}
          <FormField label="Heading" htmlFor="title">
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Main section heading"
              className={adminInputClass}
            />
          </FormField>
          <FormField label="Subtitle" htmlFor="subtitle">
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Supporting line"
              className={adminInputClass}
            />
          </FormField>

          {extraFieldGroupsMarkup}

          {hasRequiredLimit || hasOptionalLimit ? (
            <FormField
              label={
                family === "featured"
                  ? "Products to show"
                  : family === "reviews"
                    ? "Reviews to show"
                    : "Categories to show"
              }
              htmlFor="limit"
              hint={
                hasOptionalLimit
                  ? "Leave blank to show every category."
                  : `Choose between ${MIN_LIMIT} and ${limitMaximum} items.`
              }
            >
              <Input
                id="limit"
                type="number"
                min={MIN_LIMIT}
                max={limitMaximum}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder={hasOptionalLimit ? "All" : undefined}
                className={`${adminInputClass} w-full sm:w-32`}
              />
            </FormField>
          ) : null}

          {family === "promo" && (
            <>
              <FormField
                label="Promotion"
                hint="Which active promotion feeds this band."
              >
                <Select value={promotionId} onValueChange={setPromotionId}>
                  <SelectTrigger className={adminSelectClass}>
                    <SelectValue placeholder="Latest active" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__latest__">
                      Latest active promotion
                    </SelectItem>
                    {promotions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                        {!p.active ? " (inactive)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Button label" htmlFor="cta_label">
                  <Input
                    id="cta_label"
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    placeholder="Shop the drop"
                    className={adminInputClass}
                  />
                </FormField>
                <FormField label="Button link" htmlFor="cta_url">
                  <Input
                    id="cta_url"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="/product"
                    className={adminInputClass}
                  />
                </FormField>
              </div>
              <FormField
                label="Banner image"
                hint="Your own homepage banner image. Independent of the promotion record used by the store popup."
              >
                <ImageUploader
                  bucket={BUCKETS.branding}
                  value={promoImage}
                  onChange={setPromoImage}
                  maxFiles={1}
                  maxFileSizeMb={4}
                  optimizeToWebp
                  fileNamePrefix="promo-section"
                  onBusyChange={setPromoImageBusy}
                  disabled={pending || promoImageBusy}
                  label="Upload banner image"
                  preview="cover"
                />
              </FormField>
              <FormField
                label="Image alt text"
                htmlFor="promo-image-alt"
                hint="Optional. Used when the banner image is shown."
              >
                <Input
                  id="promo-image-alt"
                  value={promoImageAlt}
                  onChange={(event) => setPromoImageAlt(event.target.value)}
                  placeholder="Describe the banner image"
                  className={adminInputClass}
                />
              </FormField>
            </>
          )}

          {showsCta && (
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Button label"
                htmlFor="cta_label"
                hint="Optional link shown near the heading."
              >
                <Input
                  id="cta_label"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder="View all"
                  className={adminInputClass}
                />
              </FormField>
              <FormField label="Button link" htmlFor="cta_url">
                <Input
                  id="cta_url"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="/product"
                  className={adminInputClass}
                />
              </FormField>
            </div>
          )}

          {family === "richtext" ? (
            <>
              <FormField label="Body">
                <RichTextEditor value={body} onChange={setBody} />
              </FormField>

              <div className="space-y-5 rounded-xl border border-border bg-background/50 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Story design
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Configure the image, overlay details, and ordered highlight
                    cards used by this Story section.
                  </p>
                </div>

                {section.type === "richtext" ? (
                  <FormField
                    label="Layout"
                    hint="Simple shows centered copy. Feature adds the image and cards."
                  >
                    <Select
                      value={storyLayout}
                      onValueChange={(value) =>
                        setStoryLayout(value as "simple" | "feature")
                      }
                    >
                      <SelectTrigger className={adminSelectClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple text</SelectItem>
                        <SelectItem value="feature">
                          Feature image and cards
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                ) : null}

                <ImageUploader
                  bucket={BUCKETS.branding}
                  value={storyImages}
                  onChange={setStoryImages}
                  maxFiles={1}
                  maxFileSizeMb={4}
                  optimizeToWebp
                  fileNamePrefix={`${section.type}-story`}
                  onBusyChange={setStoryImageBusy}
                  disabled={pending || storyImageBusy}
                  label="Upload Story image"
                  preview="cover"
                />

                <FormField label="Image alt text" htmlFor="story-image-alt">
                  <Input
                    id="story-image-alt"
                    value={storyImageAlt}
                    onChange={(event) => setStoryImageAlt(event.target.value)}
                    placeholder="Describe the image"
                    className={adminInputClass}
                  />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField label="Overlay label" htmlFor="story-image-label">
                    <Input
                      id="story-image-label"
                      value={storyImageLabel}
                      onChange={(event) =>
                        setStoryImageLabel(event.target.value)
                      }
                      placeholder="e.g. Authentic"
                      className={adminInputClass}
                    />
                  </FormField>
                  <FormField label="Overlay value" htmlFor="story-image-value">
                    <Input
                      id="story-image-value"
                      value={storyImageValue}
                      onChange={(event) =>
                        setStoryImageValue(event.target.value)
                      }
                      placeholder="e.g. Sourced from Japan"
                      className={adminInputClass}
                    />
                  </FormField>
                  <FormField label="Overlay tag" htmlFor="story-image-tag">
                    <Input
                      id="story-image-tag"
                      value={storyImageTag}
                      onChange={(event) => setStoryImageTag(event.target.value)}
                      placeholder="e.g. // STORY 01"
                      className={adminInputClass}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Copy label" htmlFor="story-copy-label">
                    <Input
                      id="story-copy-label"
                      value={storyCopyLabel}
                      onChange={(event) =>
                        setStoryCopyLabel(event.target.value)
                      }
                      placeholder="e.g. Our approach"
                      className={adminInputClass}
                    />
                  </FormField>
                  <FormField label="Cards heading" htmlFor="story-cards-label">
                    <Input
                      id="story-cards-label"
                      value={storyCardsLabel}
                      onChange={(event) =>
                        setStoryCardsLabel(event.target.value)
                      }
                      placeholder="e.g. Why shop with us"
                      className={adminInputClass}
                    />
                  </FormField>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Highlight cards
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Add, edit, remove, and drag up to six cards.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={addStoryCard}
                      disabled={storyCards.length >= 6}
                    >
                      <Plus className="size-4" /> Add card
                    </Button>
                  </div>
                  {storyCards.length ? (
                    <SortableList
                      items={storyCards}
                      onReorder={setStoryCards}
                      getLabel={(card) => card.label || "Story card"}
                      renderItem={(card) => (
                        <div className="grid gap-3 rounded-xl border border-border bg-card p-3 sm:grid-cols-[10rem_1fr_1fr_auto] sm:items-end">
                          <FormField label="Icon">
                            <Select
                              value={card.icon}
                              onValueChange={(value) =>
                                updateStoryCard(card.id, "icon", value)
                              }
                            >
                              <SelectTrigger className={adminSelectClass}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STORY_CARD_ICONS.map((icon) => (
                                  <SelectItem key={icon} value={icon}>
                                    {icon.charAt(0).toUpperCase() +
                                      icon.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormField>
                          <FormField label="Label">
                            <Input
                              value={card.label}
                              onChange={(event) =>
                                updateStoryCard(
                                  card.id,
                                  "label",
                                  event.target.value,
                                )
                              }
                              placeholder="e.g. Authentic"
                              className={adminInputClass}
                            />
                          </FormField>
                          <FormField label="Detail">
                            <Input
                              value={card.detail}
                              onChange={(event) =>
                                updateStoryCard(
                                  card.id,
                                  "detail",
                                  event.target.value,
                                )
                              }
                              placeholder="e.g. Directly sourced"
                              className={adminInputClass}
                            />
                          </FormField>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-10 rounded-full"
                            onClick={() => removeStoryCard(card.id)}
                            aria-label={`Remove ${card.label || "Story card"}`}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    />
                  ) : (
                    <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                      No highlight cards configured.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}

          {section.type === "categories" ? (
            <div className="space-y-4 rounded-xl border border-border bg-background/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Mosaic categories
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose up to {maxMosaicCategories} categories and drag them
                    into display order.
                  </p>
                </div>
                <div className="w-full sm:w-64">
                  <Select
                    value="__add__"
                    disabled={
                      categoryIds.length >= maxMosaicCategories ||
                      availableCategories.length === 0
                    }
                    onValueChange={(categoryId) => {
                      if (categoryId === "__add__") return;
                      setCategoryIds((current) =>
                        [...current, categoryId].slice(0, maxMosaicCategories),
                      );
                    }}
                  >
                    <SelectTrigger className={adminSelectClass}>
                      <SelectValue placeholder="Add category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__add__" disabled>
                        Add category
                      </SelectItem>
                      {availableCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedCategories.length ? (
                <SortableList
                  items={selectedCategories}
                  onReorder={(items) =>
                    setCategoryIds(items.map((category) => category.id))
                  }
                  getLabel={(category) => category.name}
                  renderItem={(category, index) => (
                    <div className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {category.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-full"
                        onClick={() =>
                          setCategoryIds((current) =>
                            current.filter(
                              (categoryId) => categoryId !== category.id,
                            ),
                          )
                        }
                        aria-label={`Remove ${category.name}`}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  Add at least one category to show the Mosaic section.
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Names and images are managed in{" "}
                <Link
                  href="/admin/categories"
                  className="text-primary underline-offset-2 hover:underline"
                >
                  Catalog → Categories
                </Link>
                .
              </p>
            </div>
          ) : family === "categories" ? (
            <p className="rounded-xl border border-border bg-background/50 px-4 py-3 text-sm text-muted-foreground">
              Category cards come from{" "}
              <Link
                href="/admin/categories"
                className="text-primary underline-offset-2 hover:underline"
              >
                Catalog → Categories
              </Link>
              . Edit images and names there.
            </p>
          ) : null}

          {activeToggle}
        </div>
      </AdminCard>

      {formActions}
    </div>
  );
}
