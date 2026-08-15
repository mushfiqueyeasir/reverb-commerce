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
import {
  HomepageSectionView,
  type HomepageRendererData,
} from "@/components/HomePage/HomepageRenderer";
import type { Category } from "@/type/categoryType";
import type { HomepageSectionRow } from "@/type/db";
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
import { useAdmin } from "@/components/admin/AdminContext";
import { BUCKETS } from "@/lib/supabase/config";
import { buildStoragePublicUrl } from "@/utility/storageUrl";
import {
  getHomepageSectionDisplayName,
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
    <div className="flex min-h-11 items-center gap-2 rounded-full px-2">
      <span
        className={cn(
          "text-xs font-medium",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {active ? "Shown" : "Hidden"}
      </span>
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
        aria-label={active ? "Hide section" : "Show section"}
      />
    </div>
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
  parentId: null,
  sort: (index + 1) * 10,
  depth: 0,
  isDefault: false,
  categoryUrl: { current: "preview" },
}));

const previewProducts: TransformedProduct[] = [
  "Signature product",
  "Everyday staple",
  "Premium essential",
  "Limited edition",
  "Collection favorite",
  "Runway exclusive",
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
  createdAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
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

const previewRendererData: HomepageRendererData = {
  banners: previewBanners,
  bannersV2: previewBannersV2,
  categories: previewCategories,
  products: previewProducts,
  reviews: previewReviews,
  promotions: [previewPromotion],
};

function SectionPreview({ section }: { section: HomepageSectionRow }) {
  const { storageBaseUrl } = useAdmin();

  return (
    <HomepageSectionView
      section={section}
      data={previewRendererData}
      preview
      primaryBannerId={section.id}
      resolveImageUrl={(path) =>
        buildStoragePublicUrl(storageBaseUrl, BUCKETS.branding, path)
      }
    />
  );
}

function PreviewDialog({ section }: { section: HomepageSectionRow }) {
  const displayName =
    getHomepageSectionDisplayName(section.type) ?? section.type;
  const version = getHomepageSectionVersion(section.type);

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
          <DialogTitle className="flex items-baseline gap-2 font-display">
            <span>{displayName}</span>
            {version && version > 1 ? (
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                (v{version})
              </span>
            ) : null}
            <span>preview</span>
          </DialogTitle>
          <DialogDescription>
            Storefront layout shown with the saved section content.
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
  const version = getHomepageSectionVersion(section.type);
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

        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <p className="truncate font-display text-base font-semibold text-foreground">
            {displayName}
          </p>
          {version && version > 1 ? (
            <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              (v{version})
            </span>
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
        <Button variant="ghost" size="sm" asChild className="rounded-full">
          <Link href={`/admin/homepage/${section.id}`}>
            <Pencil className="size-4" />
            Edit
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
