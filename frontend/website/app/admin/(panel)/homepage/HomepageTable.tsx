"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, GripVertical, Pencil } from "lucide-react";
import { toast } from "sonner";
import BannerV2 from "@/components/HomePage/BannerV2";
import CategorySection from "@/components/HomePage/Category";
import CategoryV2 from "@/components/HomePage/CategoryV2";
import FeaturedProducts from "@/components/HomePage/FeaturedProducts";
import FeaturedProductsV2 from "@/components/HomePage/FeaturedProductsV2";
import Hero from "@/components/HomePage/Hero";
import Marquee from "@/components/HomePage/Marquee";
import PromoStrip from "@/components/HomePage/PromoStrip";
import PromoV2 from "@/components/HomePage/PromoV2";
import ReviewSlider from "@/components/HomePage/ReviewSlider";
import ReviewsV2 from "@/components/HomePage/ReviewsV2";
import RichTextSection from "@/components/HomePage/RichTextSection";
import RichTextSectionV2 from "@/components/HomePage/RichTextSectionV2";
import type { Category } from "@/type/categoryType";
import {
  DEFAULT_BANNER_DESCRIPTION,
  DEFAULT_BANNER_MARQUEE,
  DEFAULT_BANNER_STATS,
  type BannerStatItem,
  type HomepageSectionRow,
} from "@/type/db";
import type { TransformedProduct } from "@/type/productType";
import type { Promotion } from "@/type/promotionType";
import type { TransformedReview } from "@/type/reviewType";
import type { Banner } from "@/utility/getBanners";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  getHomepageSectionDisplayName,
  getHomepageSectionFamily,
  getHomepageSectionVersion,
} from "@/lib/cms/homepageSections";
import { cn } from "@/lib/utils";
import { toggleSection, reorderSections } from "./actions";

function ActiveToggle({
  id,
  active,
  canWrite,
}: {
  id: string;
  active: boolean;
  canWrite: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (!canWrite) {
    return (
      <Badge variant={active ? "success" : "secondary"}>
        {active ? "Visible" : "Hidden"}
      </Badge>
    );
  }

  return (
    <Switch
      checked={active}
      disabled={pending}
      onCheckedChange={(next) =>
        startTransition(async () => {
          const res = await toggleSection(id, next);
          if (res?.error) toast.error(res.error);
          else toast.success(next ? "Shown" : "Hidden");
        })
      }
      aria-label="Toggle visibility"
    />
  );
}

const previewImages = [
  "/images/lovable/hero-biker.jpg",
  "/images/lovable/fabric-texture.jpg",
];

const previewBanners: Banner[] = [
  {
    id: "preview-banner-1",
    title: "Made for *every moment.*",
    subtitle: "New collection",
    imageUrl: previewImages[0],
    mobileImageUrl: previewImages[0],
    ctaLabel: "Shop collection",
    ctaUrl: "/product",
  },
  {
    id: "preview-banner-2",
    title: "Quality in *every detail.*",
    subtitle: "Thoughtful design",
    imageUrl: previewImages[1],
    mobileImageUrl: previewImages[1],
    ctaLabel: "Explore products",
    ctaUrl: "/product",
  },
];

const previewBannersV2 = previewBanners.map((banner) => ({
  ...banner,
  title: banner.title?.replaceAll("*", "") ?? null,
}));

const previewCategories: Category[] = [
  "New arrivals",
  "Everyday essentials",
  "Limited collection",
  "Accessories",
].map((categoryName, index) => ({
  _id: `preview-category-${index}`,
  categoryName,
  categoryDescription: "Curated collection",
  imageUrl: previewImages[index % previewImages.length],
  isDefault: false,
  categoryUrl: { current: "preview" },
}));

const previewProducts: TransformedProduct[] = [
  "Signature product",
  "Everyday staple",
  "Premium essential",
  "Limited edition",
].map((title, index) => ({
  id: `preview-product-${index}`,
  title,
  image: previewImages[index % previewImages.length],
  images: [previewImages[index % previewImages.length]],
  originalPrice: 72 + index * 12,
  currentPrice: 54 + index * 10,
  discount: 25,
  href: "/product",
  slug: "preview",
  sizingMode: "none",
  stock: [
    {
      id: `preview-stock-${index}`,
      size: null,
      color: null,
      quantity: 10,
    },
  ],
  sizeChart: [],
  categories: [],
}));

const previewReviews: TransformedReview[] = [
  {
    id: "preview-review-1",
    image: previewImages[0],
    customerName: "Alex Morgan",
    body: "The quality exceeded my expectations and every detail feels considered.",
    rating: 5,
  },
  {
    id: "preview-review-2",
    image: previewImages[1],
    customerName: "Jordan Lee",
    body: "Beautifully made, easy to order, and delivered right on time.",
    rating: 5,
  },
  {
    id: "preview-review-3",
    image: previewImages[0],
    customerName: "Taylor Smith",
    body: "A new favorite. I will definitely be coming back for more.",
    rating: 4,
  },
  {
    id: "preview-review-4",
    image: previewImages[1],
    customerName: "Casey Brown",
    body: "Thoughtful design and a great experience from start to finish.",
    rating: 5,
  },
];

const previewPromotion: Promotion = {
  _id: "preview-promotion",
  title: "The season's best offer.",
  description:
    "Explore selected favorites at a special price for a limited time.",
  imageUrl: previewImages[0],
  discountPercent: 30,
  ctaUrl: "/product",
  ctaLabel: "Shop the drop",
};

function configString(
  config: Record<string, unknown>,
  key: string,
): string | null {
  const value = config[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function configLimit(config: Record<string, unknown>): number | undefined {
  const value = config.limit;
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.min(24, Math.max(1, Math.floor(value)));
}

function previewStats(config: Record<string, unknown>): BannerStatItem[] {
  if (!Array.isArray(config.stats)) return DEFAULT_BANNER_STATS;
  const stats = config.stats
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const value = item as Record<string, unknown>;
      const label = typeof value.label === "string" ? value.label.trim() : "";
      const statValue =
        typeof value.value === "string" ? value.value.trim() : "";
      return label || statValue
        ? { label: label || "—", value: statValue || "—" }
        : null;
    })
    .filter((item): item is BannerStatItem => item !== null);
  return stats.length ? stats : DEFAULT_BANNER_STATS;
}

function previewMarquee(config: Record<string, unknown>): string[] {
  if (!Array.isArray(config.marquee_items)) return DEFAULT_BANNER_MARQUEE;
  const items = config.marquee_items
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
  return items.length ? items : DEFAULT_BANNER_MARQUEE;
}

function BannerPreview({ section }: { section: HomepageSectionRow }) {
  const description =
    configString(section.config, "description") ?? DEFAULT_BANNER_DESCRIPTION;
  const showMarquee = section.config.show_marquee !== false;

  return (
    <>
      <Hero
        banners={previewBanners}
        description={description}
        stats={previewStats(section.config)}
      />
      {showMarquee ? <Marquee items={previewMarquee(section.config)} /> : null}
    </>
  );
}

function BannerV2Preview({ section }: { section: HomepageSectionRow }) {
  return (
    <BannerV2
      banners={previewBannersV2}
      description={
        configString(section.config, "description") ??
        DEFAULT_BANNER_DESCRIPTION
      }
    />
  );
}

function CategoriesPreview({ section }: { section: HomepageSectionRow }) {
  return (
    <CategorySection
      categories={previewCategories}
      title={section.title}
      subtitle={section.subtitle}
      eyebrow={configString(section.config, "eyebrow")}
      ctaLabel={configString(section.config, "cta_label")}
      ctaHref={configString(section.config, "cta_url") ?? "/product"}
    />
  );
}

function CategoriesV2Preview({ section }: { section: HomepageSectionRow }) {
  return (
    <CategoryV2
      categories={previewCategories}
      title={section.title}
      subtitle={section.subtitle}
      eyebrow={configString(section.config, "eyebrow")}
      ctaLabel={configString(section.config, "cta_label")}
      ctaHref={configString(section.config, "cta_url") ?? "/product"}
      limit={configLimit(section.config)}
      preview
    />
  );
}

function FeaturedPreview({ section }: { section: HomepageSectionRow }) {
  const limit = configLimit(section.config) ?? previewProducts.length;
  return (
    <FeaturedProducts
      products={previewProducts.slice(0, limit)}
      title={section.title}
      subtitle={section.subtitle}
      eyebrow={configString(section.config, "eyebrow")}
      ctaLabel={configString(section.config, "cta_label")}
      ctaHref={configString(section.config, "cta_url") ?? "/product"}
    />
  );
}

function FeaturedV2Preview({ section }: { section: HomepageSectionRow }) {
  const limit = configLimit(section.config) ?? previewProducts.length;
  return (
    <FeaturedProductsV2
      products={previewProducts.slice(0, limit)}
      title={section.title}
      subtitle={section.subtitle}
      eyebrow={configString(section.config, "eyebrow")}
      ctaLabel={configString(section.config, "cta_label")}
      ctaHref={configString(section.config, "cta_url") ?? "/product"}
      preview
    />
  );
}

function ReviewsPreview({ section }: { section: HomepageSectionRow }) {
  const limit = configLimit(section.config) ?? previewReviews.length;
  return (
    <ReviewSlider
      reviews={previewReviews.slice(0, limit)}
      title={section.title}
      subtitle={section.subtitle}
      eyebrow={configString(section.config, "eyebrow")}
      ctaLabel={configString(section.config, "cta_label")}
      ctaHref={configString(section.config, "cta_url") ?? "/reviews"}
    />
  );
}

function ReviewsV2Preview({ section }: { section: HomepageSectionRow }) {
  const limit = configLimit(section.config) ?? previewReviews.length;
  return (
    <ReviewsV2
      reviews={previewReviews.slice(0, limit)}
      title={section.title}
      subtitle={section.subtitle}
      eyebrow={configString(section.config, "eyebrow")}
      ctaLabel={configString(section.config, "cta_label")}
      ctaHref={configString(section.config, "cta_url") ?? "/reviews"}
    />
  );
}

function PromoPreview({ section }: { section: HomepageSectionRow }) {
  return (
    <PromoStrip
      promotion={previewPromotion}
      title={section.title}
      subtitle={section.subtitle}
      ctaHref={
        configString(section.config, "cta_url") ??
        previewPromotion.ctaUrl ??
        "/product"
      }
      ctaLabel={
        configString(section.config, "cta_label") ??
        previewPromotion.ctaLabel ??
        "Shop the drop"
      }
    />
  );
}

function PromoV2Preview({ section }: { section: HomepageSectionRow }) {
  return (
    <PromoV2
      promotion={previewPromotion}
      title={section.title}
      subtitle={section.subtitle}
      ctaHref={
        configString(section.config, "cta_url") ??
        previewPromotion.ctaUrl ??
        "/product"
      }
      ctaLabel={
        configString(section.config, "cta_label") ??
        previewPromotion.ctaLabel ??
        "Shop the drop"
      }
    />
  );
}

function RichTextPreview({ section }: { section: HomepageSectionRow }) {
  return (
    <RichTextSection
      title={section.title || "Designed with purpose."}
      subtitle={section.subtitle || "Our story"}
      body={
        section.body ||
        "This space introduces your story, values, and the details that make your collection unique."
      }
      config={section.config}
      imageUrl={previewImages[1]}
    />
  );
}

function RichTextV2Preview({ section }: { section: HomepageSectionRow }) {
  return (
    <RichTextSectionV2
      title={section.title || "Designed with purpose."}
      subtitle={section.subtitle || "Our story"}
      body={
        section.body ||
        "This space introduces your story, values, and the details that make your collection unique."
      }
      eyebrow={configString(section.config, "eyebrow")}
      ctaLabel={configString(section.config, "cta_label")}
      ctaHref={configString(section.config, "cta_url")}
      config={section.config}
      imageUrl={previewImages[1]}
      preview
    />
  );
}

function SectionPreview({ section }: { section: HomepageSectionRow }) {
  const family = getHomepageSectionFamily(section.type);
  const version = getHomepageSectionVersion(section.type);

  if (version === 2) {
    switch (family) {
      case "banner":
        return <BannerV2Preview section={section} />;
      case "categories":
        return <CategoriesV2Preview section={section} />;
      case "featured":
        return <FeaturedV2Preview section={section} />;
      case "reviews":
        return <ReviewsV2Preview section={section} />;
      case "promo":
        return <PromoV2Preview section={section} />;
      case "richtext":
        return <RichTextV2Preview section={section} />;
    }
  }

  switch (family) {
    case "banner":
      return <BannerPreview section={section} />;
    case "categories":
      return <CategoriesPreview section={section} />;
    case "featured":
      return <FeaturedPreview section={section} />;
    case "reviews":
      return <ReviewsPreview section={section} />;
    case "promo":
      return <PromoPreview section={section} />;
    case "richtext":
      return <RichTextPreview section={section} />;
  }
}

function PreviewDialog({ section }: { section: HomepageSectionRow }) {
  const displayName =
    getHomepageSectionDisplayName(section.type) ?? section.type;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          <Eye />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[min(1600px,calc(100vw-3rem))] gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="border-b border-border px-6 py-5 pr-14">
          <DialogTitle className="font-display">
            {displayName} preview
          </DialogTitle>
          <DialogDescription>
            Storefront layout shown with placeholder content.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[75dvh] bg-background text-foreground [&_a]:pointer-events-none [&_button]:pointer-events-none [&_button[data-preview-interactive]]:pointer-events-auto">
          <SectionPreview section={section} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function SortableRow({
  section,
  canWrite,
}: {
  section: HomepageSectionRow;
  canWrite: boolean;
}) {
  const displayName =
    getHomepageSectionDisplayName(section.type) ?? section.type;
  const family = getHomepageSectionFamily(section.type);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, disabled: !canWrite });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border bg-card/80 px-3 py-3 sm:flex-row sm:items-center sm:px-4",
        isDragging &&
          "z-10 border-primary/50 bg-card shadow-lg shadow-black/40",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {canWrite ? (
          <button
            type="button"
            className="flex size-11 shrink-0 cursor-grab items-center justify-center rounded-xl text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground active:cursor-grabbing sm:size-9"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        ) : (
          <span className="size-9 shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{displayName}</Badge>
            <p className="truncate font-medium text-foreground">
              {section.title || (
                <span className="text-muted-foreground">
                  {family === "banner" ? "Carousel content" : "— (auto)"}
                </span>
              )}
            </p>
          </div>
          {section.subtitle ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {section.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border/60 pt-3 sm:w-auto sm:border-0 sm:pt-0">
        <PreviewDialog section={section} />
        <ActiveToggle
          id={section.id}
          active={section.active}
          canWrite={canWrite}
        />
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="size-11 rounded-full sm:size-9"
        >
          <Link href={`/admin/homepage/${section.id}`} aria-label="Edit">
            <Pencil className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function HomepageTable({
  data,
  canWrite,
}: {
  data: HomepageSectionRow[];
  canWrite: boolean;
}) {
  const [items, setItems] = useState(data);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setItems(data);
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    if (!canWrite) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previous = items;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);

    startTransition(async () => {
      const res = await reorderSections(next.map((i) => i.id));
      if (res?.error) {
        setItems(previous);
        toast.error(res.error);
        return;
      }
      toast.success("Order updated");
    });
  };

  if (!items.length) {
    return (
      <p className="rounded-2xl border border-border bg-card/80 px-4 py-10 text-center text-sm text-muted-foreground">
        No homepage sections configured.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {canWrite ? (
        <p className="text-sm text-muted-foreground">
          Drag the handle to reorder sections on the storefront.
        </p>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((section) => (
              <SortableRow
                key={section.id}
                section={section}
                canWrite={canWrite}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
