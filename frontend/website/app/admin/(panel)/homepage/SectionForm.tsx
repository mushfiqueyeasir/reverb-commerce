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
  type BannerRow,
  type BannerStatItem,
  type HomepageSectionRow,
  type HomepageSectionType,
} from "@/type/db";
import { AdminCard } from "@/components/admin/AdminCard";
import {
  FormActions,
  FormField,
  adminInputClass,
  adminSelectClass,
  adminTextareaClass,
} from "@/components/admin/FormField";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
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

const TYPE_INFO: Record<HomepageSectionType, string> = {
  banner:
    "Top banner carousel — slides, stats bar, supporting copy, and marquee.",
  categories: "Category grid from your Catalog → Categories.",
  featured: "Product grid from your latest active products.",
  reviews: "Review photos and quotes from Content → Reviews.",
  promo: "Promo band driven by an active promotion.",
  richtext: "Custom rich-text block for brand story or notes.",
};

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
  banners = [],
  canWrite = false,
  initialTab = "content",
}: {
  section: HomepageSectionRow;
  promotions?: PromotionOption[];
  banners?: BannerRow[];
  canWrite?: boolean;
  initialTab?: "content" | "slides";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const config = section.config ?? {};
  const [tab, setTab] = useState<"content" | "slides">(
    initialTab === "slides" ? "slides" : "content",
  );

  const [title, setTitle] = useState(section.title ?? "");
  const [subtitle, setSubtitle] = useState(section.subtitle ?? "");
  const [body, setBody] = useState(section.body ?? "");
  const [active, setActive] = useState(section.active ?? true);

  const [eyebrow, setEyebrow] = useState(strConfig(config, "eyebrow"));
  const [limit, setLimit] = useState(
    String(numConfig(config, "limit", section.type === "reviews" ? 6 : 8)),
  );
  const [ctaLabel, setCtaLabel] = useState(
    strConfig(
      config,
      "cta_label",
      section.type === "promo" ? "Shop the drop" : "",
    ),
  );
  const [ctaUrl, setCtaUrl] = useState(
    strConfig(config, "cta_url", "/product"),
  );
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
    const nextConfig: Record<string, unknown> = {
      ...config,
      eyebrow: eyebrow.trim() || null,
      cta_label: ctaLabel.trim() || null,
      cta_url: ctaUrl.trim() || null,
    };

    if (section.type === "featured" || section.type === "reviews") {
      nextConfig.limit = Math.max(1, Number(limit) || 8);
    }
    if (section.type === "banner") {
      nextConfig.show_marquee = showMarquee;
      nextConfig.description = description.trim() || DEFAULT_BANNER_DESCRIPTION;
      nextConfig.stats = stats.map((s) => ({
        label: s.label.trim(),
        value: s.value.trim(),
      }));
      nextConfig.marquee_items = marqueeItems
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (section.type === "promo") {
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

  if (section.type === "banner") {
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
              description="Stats bar, supporting copy, and marquee under the carousel."
            >
              <div className="space-y-5">
                <FormField label="Section type">
                  <div className="flex h-11 items-center">
                    <Badge variant="secondary" className="capitalize">
                      {section.type}
                    </Badge>
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
                        <FormField label="Label" htmlFor={`stat-label-${i}`}>
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
                        <FormField label="Value" htmlFor={`stat-value-${i}`}>
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
                          Each phrase scrolls in the ticker under the banner.
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
      <AdminCard title="Section content" description={TYPE_INFO[section.type]}>
        <div className="space-y-5">
          <FormField label="Section type">
            <div className="flex h-11 items-center">
              <Badge variant="secondary" className="capitalize">
                {section.type}
              </Badge>
            </div>
          </FormField>

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
                section.type === "categories"
                  ? "Collections"
                  : section.type === "reviews"
                    ? "Community"
                    : "Featured"
              }
              className={adminInputClass}
            />
          </FormField>
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

          {(section.type === "featured" || section.type === "reviews") && (
            <FormField
              label={
                section.type === "featured"
                  ? "Products to show"
                  : "Reviews to show"
              }
              htmlFor="limit"
              hint="How many items appear in this section."
            >
              <Input
                id="limit"
                type="number"
                min={1}
                max={24}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className={`${adminInputClass} w-full sm:w-32`}
              />
            </FormField>
          )}

          {section.type === "promo" && (
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

          {(section.type === "featured" ||
            section.type === "categories" ||
            section.type === "reviews") && (
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

          {section.type === "richtext" && (
            <FormField label="Body">
              <RichTextEditor value={body} onChange={setBody} />
            </FormField>
          )}

          {section.type === "categories" && (
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
          )}

          {activeToggle}
        </div>
      </AdminCard>

      {formActions}
    </div>
  );
}
