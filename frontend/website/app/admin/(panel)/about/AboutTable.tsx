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
import AboutPageScreen from "@/components/AboutPage/AboutPageScreen";
import { getStorefrontThemePackage } from "@/components/themes/registry";
import type { AboutSectionRenderer } from "@/components/themes/types";
import type {
  AboutRendererIdMapping,
  AboutRendererRegistry,
} from "@/lib/cms/aboutRendererRegistry";
import {
  getAboutSectionDisplayName,
  getAboutSectionFamily,
  getAboutSectionVersion,
  type AboutSectionRow,
} from "@/lib/cms/aboutSections";
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
import { cn } from "@/lib/utils";
import { reorderAboutSections, toggleAboutSection } from "./actions";

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
            const res = await toggleAboutSection(id, next);
            if (res?.error) toast.error(res.error);
            else toast.success(next ? "Shown" : "Hidden");
          })
        }
        aria-label={active ? "Hide section" : "Show section"}
      />
    </div>
  );
}

function previewImage(type: AboutSectionRow["type"]): string | null {
  switch (getAboutSectionFamily(type)) {
    case "hero":
    case "story":
      return "/images/lovable/hero-biker.jpg";
    case "craft":
      return "/images/lovable/fabric-texture.jpg";
    default:
      return null;
  }
}

function PreviewDialog({
  section,
  rendererMapping,
  renderers,
}: {
  section: AboutSectionRow;
  rendererMapping: AboutRendererIdMapping;
  renderers?: Partial<AboutRendererRegistry<AboutSectionRenderer>>;
}) {
  const displayName = getAboutSectionDisplayName(section.type) ?? section.type;
  const version = getAboutSectionVersion(section.type);

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
            Storefront layout shown with this section&apos;s content and
            placeholder imagery.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[75dvh] bg-background text-foreground [&_a]:pointer-events-none [&_button:not([data-preview-interactive])]:pointer-events-none">
          <AboutPageScreen
            sections={[section]}
            imageUrls={{ [section.id]: previewImage(section.type) }}
            preview
            rendererMapping={rendererMapping}
            renderers={renderers}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function SortableRow({
  section,
  canWrite,
  rendererMapping,
  renderers,
}: {
  section: AboutSectionRow;
  canWrite: boolean;
  rendererMapping: AboutRendererIdMapping;
  renderers?: Partial<AboutRendererRegistry<AboutSectionRenderer>>;
}) {
  const displayName = getAboutSectionDisplayName(section.type) ?? section.type;
  const version = getAboutSectionVersion(section.type);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, disabled: !canWrite });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
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
          rendererMapping={rendererMapping}
          renderers={renderers}
        />
        <ActiveToggle
          id={section.id}
          active={section.active}
          canWrite={canWrite}
        />
        <Button variant="ghost" size="sm" asChild className="rounded-full">
          <Link href={`/admin/about/${section.id}`}>
            <Pencil className="size-4" />
            Edit
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function AboutTable({
  data,
  canWrite,
  themeId,
  rendererMapping,
}: {
  data: AboutSectionRow[];
  canWrite: boolean;
  themeId: string;
  rendererMapping: AboutRendererIdMapping;
}) {
  const renderers = getStorefrontThemePackage(themeId).aboutRenderers;
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
      const res = await reorderAboutSections(next.map((i) => i.id));
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
        No About sections configured.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Drag sections into the order you want. Preview a design, show or hide
        it, or choose Edit to change its content.
      </p>

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
                rendererMapping={rendererMapping}
                renderers={renderers}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
