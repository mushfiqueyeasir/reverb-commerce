"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface CategoryMultiSelectOption {
  id: string;
  name: string;
  parentId: string | null;
  depth: number;
}

export function CategoryMultiSelectPanel({
  options,
  selected,
  onToggle,
  onClear,
  variant = "default",
}: {
  options: CategoryMultiSelectOption[];
  selected: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  variant?: "default" | "brand";
}) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const groups = useMemo(() => {
    const byId = new Map(options.map((option) => [option.id, option]));
    const children = new Map<string, CategoryMultiSelectOption[]>();
    const roots: CategoryMultiSelectOption[] = [];
    for (const option of options) {
      if (option.parentId && byId.has(option.parentId)) {
        const values = children.get(option.parentId) ?? [];
        values.push(option);
        children.set(option.parentId, values);
      } else {
        roots.push(option);
      }
    }
    const normalizedQuery = query.trim().toLowerCase();
    const visibleIds = new Set<string>();
    const addDescendants = (option: CategoryMultiSelectOption) => {
      visibleIds.add(option.id);
      for (const child of children.get(option.id) ?? []) addDescendants(child);
    };
    if (normalizedQuery) {
      for (const option of options) {
        if (!option.name.toLowerCase().includes(normalizedQuery)) continue;
        addDescendants(option);
        let parentId = option.parentId;
        while (parentId) {
          visibleIds.add(parentId);
          parentId = byId.get(parentId)?.parentId ?? null;
        }
      }
    }
    const flatten = (
      option: CategoryMultiSelectOption,
    ): CategoryMultiSelectOption[] => [
      option,
      ...(children.get(option.id) ?? []).flatMap(flatten),
    ];
    return roots
      .map((root) => ({
        root,
        options: flatten(root).filter(
          (option) => !normalizedQuery || visibleIds.has(option.id),
        ),
      }))
      .filter((group) => group.options.length > 0);
  }, [options, query]);

  return (
    <div className="bg-popover">
      <div className="space-y-3 border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search categories…"
            className="h-10 rounded-full bg-background pl-10"
          />
        </div>
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-xs text-muted-foreground">
            {selected.length
              ? `${selected.length} selected`
              : "Select one or more categories"}
          </p>
          {selected.length ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onClear}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </div>
      <ScrollArea className="h-[min(56vh,24rem)]" variant={variant}>
        <div className="space-y-3 p-3 pr-4">
          {groups.length ? (
            groups.map((group) => {
              const children = group.options.slice(1);
              const hasChildren = children.length > 0;
              const isExpanded =
                Boolean(query.trim()) || expanded.has(group.root.id);
              const rootChecked = selected.includes(group.root.id);
              const selectedChildren = children.filter((option) =>
                selected.includes(option.id),
              ).length;
              return (
                <div
                  key={group.root.id}
                  className="overflow-hidden rounded-xl border border-border bg-card/60"
                >
                  <div className="flex items-center bg-muted/50">
                    <button
                      type="button"
                      onClick={() => onToggle(group.root.id)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold text-foreground transition hover:bg-muted/70"
                    >
                      <span
                        className={`flex size-4 shrink-0 items-center justify-center rounded border ${rootChecked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background"}`}
                      >
                        {rootChecked ? <Check className="size-3" /> : null}
                      </span>
                      <span className="truncate">{group.root.name}</span>
                      {selectedChildren ? (
                        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {selectedChildren}
                        </span>
                      ) : null}
                    </button>
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((current) => {
                            const next = new Set(current);
                            if (next.has(group.root.id))
                              next.delete(group.root.id);
                            else next.add(group.root.id);
                            return next;
                          })
                        }
                        className="mr-2 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-background hover:text-foreground"
                        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${group.root.name}`}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </button>
                    ) : null}
                  </div>
                  {hasChildren && isExpanded ? (
                    <div className="border-t border-border">
                      {children.map((option) => {
                        const checked = selected.includes(option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => onToggle(option.id)}
                            className="flex w-full items-center gap-2.5 border-b border-border px-4 py-3 text-left text-sm text-muted-foreground transition last:border-b-0 hover:bg-muted/60 hover:text-foreground"
                            style={{
                              paddingLeft: `${16 + Math.max(1, option.depth) * 18}px`,
                            }}
                          >
                            <span
                              className={`flex size-4 shrink-0 items-center justify-center rounded border ${checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background"}`}
                            >
                              {checked ? <Check className="size-3" /> : null}
                            </span>
                            <span className="truncate">{option.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No categories match your search.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
