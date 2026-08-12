"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getAboutSectionDisplayName,
  getAboutSectionFamily,
  getAboutSectionVersion,
  type AboutCraftItem,
  type AboutSectionFamily,
  type AboutSectionRow,
  type AboutStatItem,
  type AboutValueItem,
} from "@/lib/cms/aboutSections";
import { BUCKETS } from "@/lib/supabase/config";
import {
  ImageUploader,
  type UploadedImage,
} from "@/components/admin/ImageUploader";
import { AdminCard } from "@/components/admin/AdminCard";
import {
  FormActions,
  FormField,
  adminInputClass,
  adminTextareaClass,
} from "@/components/admin/FormField";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { saveAboutSection } from "./actions";

const TYPE_INFO: Record<AboutSectionFamily, string> = {
  hero: "Full-bleed hero with headline, supporting line, image, and CTAs.",
  stats: "Four label / value pairs under the hero.",
  story: "Two-column story with image and rich text.",
  values: "Three value cards with titles and descriptions.",
  craft: "Fabric / material section with image and feature grid.",
  cta: "Closing community call-to-action band.",
};

function str(config: Record<string, unknown>, key: string, fallback = "") {
  const v = config[key];
  return typeof v === "string" ? v : fallback;
}

function parseStats(config: Record<string, unknown>): AboutStatItem[] {
  const raw = config.items;
  if (!Array.isArray(raw) || !raw.length) {
    return [
      { label: "Focus", value: "Quality" },
      { label: "Design", value: "Considered" },
      { label: "Service", value: "Reliable" },
      { label: "Community", value: "Growing" },
    ];
  }
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      return {
        label: typeof o.label === "string" ? o.label : "",
        value: typeof o.value === "string" ? o.value : "",
      };
    })
    .filter((x): x is AboutStatItem => Boolean(x))
    .slice(0, 4);
}

function parseValues(config: Record<string, unknown>): AboutValueItem[] {
  const raw = config.items;
  if (!Array.isArray(raw) || !raw.length) {
    return [
      { title: "", body: "" },
      { title: "", body: "" },
      { title: "", body: "" },
    ];
  }
  const parsed = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      return {
        title: typeof o.title === "string" ? o.title : "",
        body: typeof o.body === "string" ? o.body : "",
      };
    })
    .filter((x): x is AboutValueItem => Boolean(x));
  while (parsed.length < 3) parsed.push({ title: "", body: "" });
  return parsed.slice(0, 6);
}

function parseCraft(config: Record<string, unknown>): AboutCraftItem[] {
  const raw = config.items;
  if (!Array.isArray(raw) || !raw.length) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      return {
        label: typeof o.label === "string" ? o.label : "",
        sub: typeof o.sub === "string" ? o.sub : "",
        icon: typeof o.icon === "string" ? o.icon : "Layers",
      };
    })
    .filter((x): x is AboutCraftItem => Boolean(x));
}

export function AboutSectionForm({ section }: { section: AboutSectionRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const config = section.config ?? {};
  const family = getAboutSectionFamily(section.type) ?? "hero";
  const version = getAboutSectionVersion(section.type);
  const displayName = getAboutSectionDisplayName(section.type) ?? section.type;

  const [title, setTitle] = useState(section.title ?? "");
  const [active, setActive] = useState(section.active);

  const [eyebrow, setEyebrow] = useState(str(config, "eyebrow"));
  const [headline1, setHeadline1] = useState(str(config, "headline_line1"));
  const [headline2, setHeadline2] = useState(str(config, "headline_line2"));
  const [subtitle, setSubtitle] = useState(str(config, "subtitle"));
  const [sectionTitle, setSectionTitle] = useState(str(config, "title"));
  const [titleLine1, setTitleLine1] = useState(str(config, "title_line1"));
  const [titleLine2, setTitleLine2] = useState(str(config, "title_line2"));
  const [body, setBody] = useState(str(config, "body"));
  const [bodyHtml, setBodyHtml] = useState(str(config, "body_html"));
  const [extra, setExtra] = useState(str(config, "extra"));
  const [ctaPrimaryLabel, setCtaPrimaryLabel] = useState(
    str(config, "cta_primary_label"),
  );
  const [ctaPrimaryUrl, setCtaPrimaryUrl] = useState(
    str(config, "cta_primary_url", "/product"),
  );
  const [ctaSecondaryLabel, setCtaSecondaryLabel] = useState(
    str(config, "cta_secondary_label"),
  );
  const [ctaSecondaryUrl, setCtaSecondaryUrl] = useState(
    str(config, "cta_secondary_url"),
  );
  const [fabricLabel, setFabricLabel] = useState(str(config, "fabric_label"));
  const [fabricValue, setFabricValue] = useState(str(config, "fabric_value"));
  const [fabricTag, setFabricTag] = useState(str(config, "fabric_tag"));
  const [stats, setStats] = useState(() => parseStats(config));
  const [values, setValues] = useState(() => parseValues(config));
  const [craftItems, setCraftItems] = useState(() => parseCraft(config));

  const bucket =
    str(config, "image_bucket") === "branding"
      ? BUCKETS.branding
      : BUCKETS.banner;
  const [images, setImages] = useState<UploadedImage[]>(
    str(config, "image_path") ? [{ path: str(config, "image_path") }] : [],
  );

  const submit = () => {
    const nextConfig: Record<string, unknown> = { ...config };

    if (family === "hero") {
      nextConfig.eyebrow = eyebrow.trim();
      nextConfig.headline_line1 = headline1.trim();
      nextConfig.headline_line2 = headline2.trim();
      nextConfig.subtitle = subtitle.trim();
      nextConfig.cta_primary_label = ctaPrimaryLabel.trim();
      nextConfig.cta_primary_url = ctaPrimaryUrl.trim();
      nextConfig.cta_secondary_label = ctaSecondaryLabel.trim();
      nextConfig.cta_secondary_url = ctaSecondaryUrl.trim();
      nextConfig.image_path = images[0]?.path ?? null;
      nextConfig.image_bucket = "banner";
    }
    if (family === "stats") {
      nextConfig.items = stats.map((s) => ({
        label: s.label.trim(),
        value: s.value.trim(),
      }));
    }
    if (family === "story") {
      nextConfig.eyebrow = eyebrow.trim();
      nextConfig.title = sectionTitle.trim();
      nextConfig.body_html = bodyHtml;
      nextConfig.extra = extra.trim();
      nextConfig.image_path = images[0]?.path ?? null;
      nextConfig.image_bucket = "banner";
    }
    if (family === "values") {
      nextConfig.eyebrow = eyebrow.trim();
      nextConfig.title = sectionTitle.trim();
      nextConfig.items = values
        .map((v) => ({ title: v.title.trim(), body: v.body.trim() }))
        .filter((v) => v.title || v.body);
    }
    if (family === "craft") {
      nextConfig.eyebrow = eyebrow.trim();
      nextConfig.title_line1 = titleLine1.trim();
      nextConfig.title_line2 = titleLine2.trim();
      nextConfig.body = body.trim();
      nextConfig.fabric_label = fabricLabel.trim();
      nextConfig.fabric_value = fabricValue.trim();
      nextConfig.fabric_tag = fabricTag.trim();
      nextConfig.image_path = images[0]?.path ?? null;
      nextConfig.image_bucket = "branding";
      nextConfig.items = craftItems.map((c) => ({
        label: c.label.trim(),
        sub: c.sub.trim(),
        icon: c.icon.trim() || "Layers",
      }));
    }
    if (family === "cta") {
      nextConfig.eyebrow = eyebrow.trim();
      nextConfig.title = sectionTitle.trim();
      nextConfig.body = body.trim();
      nextConfig.cta_primary_label = ctaPrimaryLabel.trim();
      nextConfig.cta_primary_url = ctaPrimaryUrl.trim();
      nextConfig.cta_secondary_label = ctaSecondaryLabel.trim();
      nextConfig.cta_secondary_url = ctaSecondaryUrl.trim();
    }

    startTransition(async () => {
      const res = await saveAboutSection({
        id: section.id,
        type: section.type,
        title: title.trim() || displayName,
        active,
        config: nextConfig,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Section updated");
      router.push("/admin/about");
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <AdminCard title="Section content" description={TYPE_INFO[family]}>
        <div className="space-y-5">
          <FormField label="Design">
            <div className="flex h-11 items-center gap-2">
              <Badge variant="secondary">{displayName}</Badge>
              {version && version > 1 ? (
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                  (v{version})
                </span>
              ) : null}
            </div>
          </FormField>

          <FormField label="Admin label" htmlFor="admin_title">
            <Input
              id="admin_title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={adminInputClass}
            />
          </FormField>

          {(family === "hero" ||
            family === "story" ||
            family === "values" ||
            family === "craft" ||
            family === "cta") && (
            <FormField label="Eyebrow" htmlFor="eyebrow">
              <Input
                id="eyebrow"
                value={eyebrow}
                onChange={(e) => setEyebrow(e.target.value)}
                className={adminInputClass}
              />
            </FormField>
          )}

          {family === "hero" && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Headline line 1" htmlFor="h1">
                  <Input
                    id="h1"
                    value={headline1}
                    onChange={(e) => setHeadline1(e.target.value)}
                    className={adminInputClass}
                  />
                </FormField>
                <FormField label="Headline line 2" htmlFor="h2">
                  <Input
                    id="h2"
                    value={headline2}
                    onChange={(e) => setHeadline2(e.target.value)}
                    className={adminInputClass}
                  />
                </FormField>
              </div>
              <FormField label="Supporting line" htmlFor="subtitle">
                <Textarea
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  rows={3}
                  className={adminTextareaClass}
                />
              </FormField>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Primary CTA label">
                  <Input
                    value={ctaPrimaryLabel}
                    onChange={(e) => setCtaPrimaryLabel(e.target.value)}
                    className={adminInputClass}
                  />
                </FormField>
                <FormField label="Primary CTA link">
                  <Input
                    value={ctaPrimaryUrl}
                    onChange={(e) => setCtaPrimaryUrl(e.target.value)}
                    className={adminInputClass}
                  />
                </FormField>
                <FormField label="Secondary CTA label">
                  <Input
                    value={ctaSecondaryLabel}
                    onChange={(e) => setCtaSecondaryLabel(e.target.value)}
                    className={adminInputClass}
                  />
                </FormField>
                <FormField label="Secondary CTA link">
                  <Input
                    value={ctaSecondaryUrl}
                    onChange={(e) => setCtaSecondaryUrl(e.target.value)}
                    className={adminInputClass}
                  />
                </FormField>
              </div>
              <FormField label="Hero image">
                <ImageUploader
                  bucket={bucket}
                  value={images}
                  onChange={setImages}
                  label="Upload hero image"
                  maxFileSizeMb={6}
                />
              </FormField>
            </>
          )}

          {family === "stats" && (
            <div className="space-y-3">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="grid gap-3 rounded-xl border border-border bg-background/40 p-3 sm:grid-cols-2"
                >
                  <FormField label="Label">
                    <Input
                      value={stat.label}
                      onChange={(e) =>
                        setStats((prev) =>
                          prev.map((s, idx) =>
                            idx === i ? { ...s, label: e.target.value } : s,
                          ),
                        )
                      }
                      className={adminInputClass}
                    />
                  </FormField>
                  <FormField label="Value">
                    <Input
                      value={stat.value}
                      onChange={(e) =>
                        setStats((prev) =>
                          prev.map((s, idx) =>
                            idx === i ? { ...s, value: e.target.value } : s,
                          ),
                        )
                      }
                      className={adminInputClass}
                    />
                  </FormField>
                </div>
              ))}
            </div>
          )}

          {family === "story" && (
            <>
              <FormField label="Heading" htmlFor="story_title">
                <Input
                  id="story_title"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  className={adminInputClass}
                />
              </FormField>
              <FormField label="Story body">
                <RichTextEditor value={bodyHtml} onChange={setBodyHtml} />
              </FormField>
              <FormField label="Extra paragraph" htmlFor="extra">
                <Textarea
                  id="extra"
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  rows={4}
                  className={adminTextareaClass}
                />
              </FormField>
              <FormField label="Side image">
                <ImageUploader
                  bucket={bucket}
                  value={images}
                  onChange={setImages}
                  label="Upload story image"
                  maxFileSizeMb={6}
                />
              </FormField>
            </>
          )}

          {family === "values" && (
            <>
              <FormField label="Heading" htmlFor="values_title">
                <Input
                  id="values_title"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  className={adminInputClass}
                />
              </FormField>
              <div className="space-y-3">
                {values.map((value, i) => (
                  <div
                    key={i}
                    className="space-y-3 rounded-xl border border-border bg-background/40 p-3"
                  >
                    <FormField label={`Value ${i + 1} title`}>
                      <Input
                        value={value.title}
                        onChange={(e) =>
                          setValues((prev) =>
                            prev.map((v, idx) =>
                              idx === i ? { ...v, title: e.target.value } : v,
                            ),
                          )
                        }
                        className={adminInputClass}
                      />
                    </FormField>
                    <FormField label="Body">
                      <Textarea
                        value={value.body}
                        onChange={(e) =>
                          setValues((prev) =>
                            prev.map((v, idx) =>
                              idx === i ? { ...v, body: e.target.value } : v,
                            ),
                          )
                        }
                        rows={3}
                        className={adminTextareaClass}
                      />
                    </FormField>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() =>
                    setValues((prev) => [...prev, { title: "", body: "" }])
                  }
                >
                  <Plus className="size-4" /> Add value
                </Button>
              </div>
            </>
          )}

          {family === "craft" && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Title line 1">
                  <Input
                    value={titleLine1}
                    onChange={(e) => setTitleLine1(e.target.value)}
                    className={adminInputClass}
                  />
                </FormField>
                <FormField label="Title line 2">
                  <Input
                    value={titleLine2}
                    onChange={(e) => setTitleLine2(e.target.value)}
                    className={adminInputClass}
                  />
                </FormField>
              </div>
              <FormField label="Body">
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className={adminTextareaClass}
                />
              </FormField>
              <div className="grid gap-5 sm:grid-cols-3">
                <FormField label="Fabric label">
                  <Input
                    value={fabricLabel}
                    onChange={(e) => setFabricLabel(e.target.value)}
                    className={adminInputClass}
                  />
                </FormField>
                <FormField label="Fabric value">
                  <Input
                    value={fabricValue}
                    onChange={(e) => setFabricValue(e.target.value)}
                    className={adminInputClass}
                  />
                </FormField>
                <FormField label="Fabric tag">
                  <Input
                    value={fabricTag}
                    onChange={(e) => setFabricTag(e.target.value)}
                    className={adminInputClass}
                  />
                </FormField>
              </div>
              <FormField label="Fabric image">
                <ImageUploader
                  bucket={BUCKETS.branding}
                  value={images}
                  onChange={setImages}
                  label="Upload fabric image"
                  maxFileSizeMb={6}
                />
              </FormField>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Feature cards
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() =>
                      setCraftItems((prev) => [
                        ...prev,
                        { label: "", sub: "", icon: "Layers" },
                      ])
                    }
                  >
                    <Plus className="size-4" /> Add
                  </Button>
                </div>
                {craftItems.map((item, i) => (
                  <div
                    key={i}
                    className="grid gap-3 rounded-xl border border-border bg-background/40 p-3 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    <FormField label="Label">
                      <Input
                        value={item.label}
                        onChange={(e) =>
                          setCraftItems((prev) =>
                            prev.map((c, idx) =>
                              idx === i ? { ...c, label: e.target.value } : c,
                            ),
                          )
                        }
                        className={adminInputClass}
                      />
                    </FormField>
                    <FormField label="Subtitle">
                      <Input
                        value={item.sub}
                        onChange={(e) =>
                          setCraftItems((prev) =>
                            prev.map((c, idx) =>
                              idx === i ? { ...c, sub: e.target.value } : c,
                            ),
                          )
                        }
                        className={adminInputClass}
                      />
                    </FormField>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={() =>
                          setCraftItems((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {family === "cta" && (
            <>
              <FormField label="Heading" htmlFor="cta_title">
                <Input
                  id="cta_title"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  className={adminInputClass}
                />
              </FormField>
              <FormField label="Body">
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className={adminTextareaClass}
                />
              </FormField>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Primary CTA label">
                  <Input
                    value={ctaPrimaryLabel}
                    onChange={(e) => setCtaPrimaryLabel(e.target.value)}
                    className={adminInputClass}
                  />
                </FormField>
                <FormField label="Primary CTA link">
                  <Input
                    value={ctaPrimaryUrl}
                    onChange={(e) => setCtaPrimaryUrl(e.target.value)}
                    className={adminInputClass}
                  />
                </FormField>
                <FormField label="Secondary CTA label">
                  <Input
                    value={ctaSecondaryLabel}
                    onChange={(e) => setCtaSecondaryLabel(e.target.value)}
                    className={adminInputClass}
                  />
                </FormField>
                <FormField label="Secondary CTA link">
                  <Input
                    value={ctaSecondaryUrl}
                    onChange={(e) => setCtaSecondaryUrl(e.target.value)}
                    className={adminInputClass}
                  />
                </FormField>
              </div>
            </>
          )}

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">
                Show this section on the About page
              </p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>
      </AdminCard>

      <FormActions>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/about")}
          disabled={pending}
          className="rounded-full px-6"
        >
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={pending}
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
    </div>
  );
}
