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
  type HomepageSectionRendererMapping,
} from "@/components/HomePage/HomepageRenderer";
import type { HomepageSectionRow, HomepageSectionType } from "@/type/db";
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

const KAWAII_SECTION_LABELS: Partial<Record<HomepageSectionType, string>> = {
  banner: "Kawaii Hero",
  categories: "Beauty Categories",
  deals: "Today’s Best Deals",
  new_arrivals: "New Arrival Products",
  featured: "Featured Products",
  richtext: "Kawaii Brand Story",
  reviews: "Customer Reviews",
  promo: "Featured Promotion",
  guarantees: "Shopping Guarantees",
  studio_notes: "Studio Notes",
  ai_search: "AI Search Promo",
};

function sectionDisplayName(section: HomepageSectionRow, themeId: string) {
  return themeId === "kawaii-fashion"
    ? (KAWAII_SECTION_LABELS[section.type] ?? section.title ?? section.type)
    : (getHomepageSectionDisplayName(section.type) ?? section.type);
}

function SectionPreview({
  section,
  rendererMapping,
  previewData,
}: {
  section: HomepageSectionRow;
  rendererMapping: HomepageSectionRendererMapping;
  previewData: HomepageRendererData;
}) {
  const { storageBaseUrl } = useAdmin();

  return (
    <HomepageSectionView
      section={section}
      data={previewData}
      preview
      useLiveBindingsInPreview
      primaryBannerId={section.id}
      rendererMapping={rendererMapping}
      resolveImageUrl={(path) =>
        buildStoragePublicUrl(storageBaseUrl, BUCKETS.branding, path)
      }
    />
  );
}

function PreviewDialog({
  section,
  themeId,
  themeName,
  rendererMapping,
  previewData,
}: {
  section: HomepageSectionRow;
  themeId: string;
  themeName: string;
  rendererMapping: HomepageSectionRendererMapping;
  previewData: HomepageRendererData;
}) {
  const displayName = sectionDisplayName(section, themeId);
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
            {themeName} layout shown with the saved section content and live
            storefront images.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[75dvh] bg-background text-foreground [&_a]:pointer-events-none [&_button]:pointer-events-none [&_button[data-preview-interactive]]:pointer-events-auto">
          <SectionPreview
            section={section}
            rendererMapping={rendererMapping}
            previewData={previewData}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function SortableRow({
  section,
  canWrite,
  themeId,
  themeName,
  rendererMapping,
  previewData,
}: {
  section: HomepageSectionRow;
  canWrite: boolean;
  themeId: string;
  themeName: string;
  rendererMapping: HomepageSectionRendererMapping;
  previewData: HomepageRendererData;
}) {
  const displayName = sectionDisplayName(section, themeId);
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
        <PreviewDialog
          section={section}
          themeId={themeId}
          themeName={themeName}
          rendererMapping={rendererMapping}
          previewData={previewData}
        />
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
  themeId,
  themeName,
  rendererMapping,
  previewData,
}: {
  data: HomepageSectionRow[];
  canWrite: boolean;
  themeId: string;
  themeName: string;
  rendererMapping: HomepageSectionRendererMapping;
  previewData: HomepageRendererData;
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
                themeId={themeId}
                themeName={themeName}
                rendererMapping={rendererMapping}
                previewData={previewData}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
