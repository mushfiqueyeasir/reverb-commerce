"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
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
import { GripVertical, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type AdminListItem = { id: string };

function SelectBox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground">
      <input
        type="checkbox"
        checked={checked}
        ref={(el) => {
          if (el) el.indeterminate = Boolean(indeterminate && !checked);
        }}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="size-4 accent-primary"
      />
    </label>
  );
}

function RowContent<T extends AdminListItem>({
  item,
  renderLeading,
  renderTitle,
  renderSubtitle,
  renderMeta,
  renderTrailing,
  leading,
}: {
  item: T;
  renderLeading?: (item: T) => ReactNode;
  renderTitle: (item: T) => ReactNode;
  renderSubtitle?: (item: T) => ReactNode;
  renderMeta?: (item: T) => ReactNode;
  renderTrailing?: (item: T) => ReactNode;
  leading: ReactNode;
}) {
  return (
    <>
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        {leading}
        {renderLeading ? (
          <div className="hidden shrink-0 sm:block">{renderLeading(item)}</div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-foreground">
            {renderTitle(item)}
          </div>
          {renderSubtitle ? (
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {renderSubtitle(item)}
            </div>
          ) : null}
          {renderMeta ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {renderMeta(item)}
            </div>
          ) : null}
        </div>
      </div>
      {renderTrailing ? (
        <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3 sm:w-auto sm:border-0 sm:pt-0 sm:gap-3">
          {renderTrailing(item)}
        </div>
      ) : null}
    </>
  );
}

function SortableRow<T extends AdminListItem>({
  item,
  disabled,
  renderLeading,
  renderTitle,
  renderSubtitle,
  renderMeta,
  renderTrailing,
}: {
  item: T;
  disabled?: boolean;
  renderLeading?: (item: T) => ReactNode;
  renderTitle: (item: T) => ReactNode;
  renderSubtitle?: (item: T) => ReactNode;
  renderMeta?: (item: T) => ReactNode;
  renderTrailing?: (item: T) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card/80 px-3 py-3 sm:flex-row sm:items-center sm:px-4",
        isDragging &&
          "z-10 border-primary/50 bg-card shadow-lg shadow-black/40",
      )}
    >
      <RowContent
        item={item}
        renderLeading={renderLeading}
        renderTitle={renderTitle}
        renderSubtitle={renderSubtitle}
        renderMeta={renderMeta}
        renderTrailing={renderTrailing}
        leading={
          <button
            type="button"
            disabled={disabled}
            className="flex size-9 shrink-0 cursor-grab items-center justify-center rounded-xl text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={disabled ? "Position fixed" : "Drag to reorder"}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        }
      />
    </div>
  );
}

function StaticRow<T extends AdminListItem>({
  item,
  renderLeading,
  renderTitle,
  renderSubtitle,
  renderMeta,
  renderTrailing,
  leading,
  selected,
}: {
  item: T;
  renderLeading?: (item: T) => ReactNode;
  renderTitle: (item: T) => ReactNode;
  renderSubtitle?: (item: T) => ReactNode;
  renderMeta?: (item: T) => ReactNode;
  renderTrailing?: (item: T) => ReactNode;
  leading: ReactNode;
  selected?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card/80 px-3 py-3 sm:flex-row sm:items-center sm:px-4",
        selected && "border-primary/40 bg-primary/5",
      )}
    >
      <RowContent
        item={item}
        renderLeading={renderLeading}
        renderTitle={renderTitle}
        renderSubtitle={renderSubtitle}
        renderMeta={renderMeta}
        renderTrailing={renderTrailing}
        leading={leading}
      />
    </div>
  );
}

export function AdminList<T extends AdminListItem>({
  items,
  sortable = false,
  canReorder = false,
  canReorderItem,
  onReorder,
  selectable = false,
  selectedIds,
  onSelectionChange,
  selectionActions,
  hint,
  emptyMessage = "Nothing here yet.",
  searchPlaceholder,
  searchFilter,
  toolbar,
  renderLeading,
  renderTitle,
  renderSubtitle,
  renderMeta,
  renderTrailing,
}: {
  items: T[];
  sortable?: boolean;
  canReorder?: boolean;
  canReorderItem?: (item: T) => boolean;
  onReorder?: (orderedIds: string[]) => Promise<{ error?: string } | void>;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Shown when one or more rows are selected (bulk actions). */
  selectionActions?: ReactNode;
  hint?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  toolbar?: ReactNode;
  renderLeading?: (item: T) => ReactNode;
  renderTitle: (item: T) => ReactNode;
  renderSubtitle?: (item: T) => ReactNode;
  renderMeta?: (item: T) => ReactNode;
  renderTrailing?: (item: T) => ReactNode;
}) {
  const [rows, setRows] = useState(items);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();
  const enableDrag = Boolean(sortable && canReorder && onReorder);
  const enableSelect = Boolean(selectable && onSelectionChange);
  const selected = useMemo(() => new Set(selectedIds ?? []), [selectedIds]);

  useEffect(() => {
    setRows(items);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchFilter) return rows;
    return rows.filter((item) => searchFilter(item, q));
  }, [rows, query, searchFilter]);

  const allFilteredSelected =
    enableSelect &&
    filtered.length > 0 &&
    filtered.every((item) => selected.has(item.id));
  const someFilteredSelected =
    enableSelect &&
    filtered.some((item) => selected.has(item.id)) &&
    !allFilteredSelected;

  const toggleOne = (id: string, next: boolean) => {
    if (!onSelectionChange) return;
    const set = new Set(selectedIds ?? []);
    if (next) set.add(id);
    else set.delete(id);
    onSelectionChange([...set]);
  };

  const toggleAllFiltered = (next: boolean) => {
    if (!onSelectionChange) return;
    const set = new Set(selectedIds ?? []);
    for (const item of filtered) {
      if (next) set.add(item.id);
      else set.delete(item.id);
    }
    onSelectionChange([...set]);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    if (!enableDrag || !onReorder) return;
    if (query.trim()) {
      toast.error("Clear search before reordering.");
      return;
    }
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rows.findIndex((i) => i.id === active.id);
    const newIndex = rows.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    if (canReorderItem && !canReorderItem(rows[oldIndex])) return;

    const previous = rows;
    const next = arrayMove(rows, oldIndex, newIndex);
    const movedFixedItem = canReorderItem
      ? rows.some(
          (item, index) =>
            !canReorderItem(item) &&
            next.findIndex((row) => row.id === item.id) !== index,
        )
      : false;
    if (movedFixedItem) {
      toast.error("This item has a fixed position.");
      return;
    }
    setRows(next);

    startTransition(async () => {
      const res = await onReorder(next.map((i) => i.id));
      if (res?.error) {
        setRows(previous);
        toast.error(res.error);
        return;
      }
      toast.success("Order updated");
    });
  };

  const rowProps = {
    renderLeading,
    renderTitle,
    renderSubtitle,
    renderMeta,
    renderTrailing,
  };

  const listBody =
    filtered.length === 0 ? (
      <p className="rounded-xl border border-border bg-card/80 px-4 py-10 text-center text-sm text-muted-foreground">
        {rows.length === 0 ? emptyMessage : "No matches for your search."}
      </p>
    ) : (
      <div className="space-y-2">
        {filtered.map((item) =>
          enableDrag ? (
            <SortableRow
              key={item.id}
              item={item}
              disabled={canReorderItem ? !canReorderItem(item) : false}
              {...rowProps}
            />
          ) : (
            <StaticRow
              key={item.id}
              item={item}
              {...rowProps}
              selected={enableSelect && selected.has(item.id)}
              leading={
                enableSelect ? (
                  <SelectBox
                    checked={selected.has(item.id)}
                    onChange={(next) => toggleOne(item.id, next)}
                    label={`Select ${item.id}`}
                  />
                ) : (
                  <span className="size-0 shrink-0" aria-hidden />
                )
              }
            />
          ),
        )}
      </div>
    );

  const selectedCount = selectedIds?.length ?? 0;

  return (
    <div className="space-y-3">
      {(searchPlaceholder ||
        toolbar ||
        (enableDrag && hint) ||
        enableSelect) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            {enableDrag && hint ? (
              <p className="text-sm text-muted-foreground">{hint}</p>
            ) : null}
            <div className="flex items-center gap-2">
              {enableSelect ? (
                <SelectBox
                  checked={allFilteredSelected}
                  indeterminate={someFilteredSelected}
                  onChange={toggleAllFiltered}
                  label="Select all visible"
                />
              ) : null}
              {searchPlaceholder ? (
                <div className="relative w-full max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-11 w-full rounded-full border-border bg-card/60 pl-9"
                  />
                </div>
              ) : null}
            </div>
          </div>
          {toolbar ? (
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
              {toolbar}
            </div>
          ) : null}
        </div>
      )}

      {enableSelect && selectedCount > 0 ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card/80 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{selectedCount}</span>{" "}
            selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {selectionActions}
            <button
              type="button"
              onClick={() => onSelectionChange?.([])}
              className="h-9 rounded-full px-3 text-sm text-muted-foreground transition hover:text-foreground"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}

      {enableDrag ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={filtered.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {listBody}
          </SortableContext>
        </DndContext>
      ) : (
        listBody
      )}
    </div>
  );
}
