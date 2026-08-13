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
  type HomepageSectionV1Type,
} from "@/type/db";
import {
  getHomepageSectionDisplayName,
  getHomepageSectionFamily,
  getHomepageSectionVersion,
} from "@/lib/cms/homepageSections";
import { AdminCard } from "@/components/admin/AdminCard";
import {
  FormActions,
  FormField,
  adminInputClass,
  adminSelectClass,
  adminTextareaClass,
} from "@/components/admin/FormField";
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

const FAMILY_INFO: Record<HomepageSectionV1Type, string> = {
  banner:
    "Banner carousel with independently managed slides and supporting copy.",
  categories: "Category grid from your Catalog → Categories.",
  featured: "Product grid from your latest active products.",
  reviews: "Review photos and quotes from Content → Reviews.",
  promo: "Promotion block driven by a selected promotion.",
  richtext: "Custom rich-text block for brand story or notes.",
};

const MIN_LIMIT = 1;
const MAX_LIMIT = 24;
const MAX_FEATURED_LIMIT = 4;
const MAX_MOSAIC_CATEGORIES = 4;

function clampLimit(value: number, maximum = MAX_LIMIT): number {
  return Math.min(maximum, Math.max(MIN_LIMIT, Math.floor(value)));
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

export function SectionForm({
  section,
  promotions = [],
  categories = [],
  banners = [],
  canWrite = false,
  initialTab = "content",
}: {
  section: HomepageSectionRow;
  promotions?: PromotionOption[];
  categories?: HomepageCategoryOption[];
  banners?: BannerRow[];
  canWrite?: boolean;
  initialTab?: "content" | "slides";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const config = section.config ?? {};
  const family = getHomepageSectionFamily(section.type);
  const version = getHomepageSectionVersion(section.type);
  const displayName =
    getHomepageSectionDisplayName(section.type) ?? section.type;
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
    (family === "richtext" && version === 2);
  const showsCta =
    family === "categories" ||
    family === "featured" ||
    family === "reviews" ||
    (family === "richtext" && version === 2);
  const limitMaximum =
    section.type === "featured_v2"
      ? 5
      : family === "featured"
        ? MAX_FEATURED_LIMIT
        : MAX_LIMIT;
  const limitFallback =
    family === "reviews"
      ? 24
      : section.type === "featured_v2"
        ? 5
        : family === "featured"
          ? 4
          : 8;
  const [tab, setTab] = useState<"content" | "slides">(
    initialTab === "slides" ? "slides" : "content",
  );

  const [title, setTitle] = useState(section.title ?? "");
  const [subtitle, setSubtitle] = useState(section.subtitle ?? "");
  const [body, setBody] = useState(section.body ?? "");
  const [active, setActive] = useState(section.active ?? true);

  const [eyebrow, setEyebrow] = useState(strConfig(config, "eyebrow"));
  const [limit, setLimit] = useState(() => {
    if (hasOptionalLimit && typeof config.limit !== "number") return "";
    return String(
      clampLimit(numConfig(config, "limit", limitFallback), limitMaximum),
    );
  });
  const [ctaLabel, setCtaLabel] = useState(
    strConfig(
      config,
      "cta_label",
      family === "promo"
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
      family === "reviews" ? "/reviews" : "/product",
    ),
  );
  const [categoryIds, setCategoryIds] = useState(() => {
    const configured = stringArrayConfig(config, "category_ids");
    const initial =
      configured ??
      categories.slice(0, MAX_MOSAIC_CATEGORIES).map((category) => category.id);
    const available = new Set(categories.map((category) => category.id));
    return initial
      .filter((categoryId) => available.has(categoryId))
      .slice(0, MAX_MOSAIC_CATEGORIES);
  });
  const [showMarquee, setShowMarquee] = useState(
    boolConfig(config, "show_marquee", true),
  );
  const [promotionId, setPromotionId] = useState(
    strConfig(config, "promotion_id") || "__latest__",
  );
  const [description, setDescription] = useState(
    strConfig(config, "description", DEFAULT_BANNER_DESCRIPTION),
  );
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
    if (hasRequiredLimit) {
      const parsedLimit = Number(limit);
      const value =
        limit.trim() && Number.isFinite(parsedLimit)
          ? parsedLimit
          : limitFallback;
      nextConfig.limit = clampLimit(value, limitMaximum);
    }
    if (hasOptionalLimit) {
      const value = Number(limit);
      nextConfig.limit =
        limit.trim() && Number.isFinite(value) ? clampLimit(value) : null;
    }
    if (section.type === "categories") {
      nextConfig.category_ids = categoryIds.slice(0, MAX_MOSAIC_CATEGORIES);
    }
    if (isBanner) {
      nextConfig.description = description.trim() || DEFAULT_BANNER_DESCRIPTION;
      if (version === 1) {
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
      <Button onClick={submit} disabled={pending} className="rounded-full px-6">
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
                version === 1
                  ? "Stats bar, supporting copy, and marquee under the carousel."
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

                {version === 1 ? (
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

          {family === "richtext" && (
            <FormField label="Body">
              <RichTextEditor value={body} onChange={setBody} />
            </FormField>
          )}

          {section.type === "categories" ? (
            <div className="space-y-4 rounded-xl border border-border bg-background/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Mosaic categories
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose up to four categories and drag them into display
                    order.
                  </p>
                </div>
                <div className="w-full sm:w-64">
                  <Select
                    value="__add__"
                    disabled={
                      categoryIds.length >= MAX_MOSAIC_CATEGORIES ||
                      availableCategories.length === 0
                    }
                    onValueChange={(categoryId) => {
                      if (categoryId === "__add__") return;
                      setCategoryIds((current) =>
                        [...current, categoryId].slice(
                          0,
                          MAX_MOSAIC_CATEGORIES,
                        ),
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
