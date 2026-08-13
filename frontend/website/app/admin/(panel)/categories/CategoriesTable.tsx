"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Pencil,
  Search,
  Tags,
  Trash2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteCategory } from "./actions";

export interface CategoryTableRow {
  id: string;
  name: string;
  slug: string;
  sort: number;
  depth: number;
  parentId: string | null;
  directChildCount: number;
  hasChildren: boolean;
  isDefault: boolean;
  imageUrl: string | null;
  productCount: number;
}

export function CategoriesTable({
  data,
  canWrite,
}: {
  data: CategoryTableRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [parentStack, setParentStack] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const currentParentId = parentStack.at(-1) ?? null;
  const currentParent = currentParentId
    ? data.find((item) => item.id === currentParentId)
    : null;
  const items = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return data.filter(
      (item) =>
        item.parentId === currentParentId &&
        (!normalizedQuery ||
          item.name.toLowerCase().includes(normalizedQuery) ||
          item.slug.toLowerCase().includes(normalizedQuery)),
    );
  }, [currentParentId, data, query]);

  const openCategory = (id: string) => {
    setParentStack((current) => [...current, id]);
    setQuery("");
  };

  const goBack = () => {
    setParentStack((current) => current.slice(0, -1));
    setQuery("");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/80 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {currentParent ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full"
              aria-label="Back to parent categories"
              onClick={goBack}
            >
              <ArrowLeft />
            </Button>
          ) : null}
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-semibold text-foreground">
              {currentParent?.name ?? "Primary categories"}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {currentParent
                ? `${currentParent.directChildCount} subcategor${currentParent.directChildCount === 1 ? "y" : "ies"}`
                : "Choose a category to view its subcategories."}
            </p>
          </div>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search this level…"
            className="h-11 rounded-xl border-border bg-background pl-9"
          />
        </div>
      </div>

      {items.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-2xl border border-border bg-card/80 transition hover:border-primary/40"
            >
              {item.hasChildren ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-foreground/[0.03]"
                  onClick={() => openCategory(item.id)}
                >
                  <CategoryImage item={item} />
                  <CategoryDetails item={item} />
                  <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
                </button>
              ) : (
                <div className="flex items-center gap-4 p-4">
                  <CategoryImage item={item} />
                  <CategoryDetails item={item} />
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {item.isDefault ? <Badge>Default</Badge> : null}
                  {item.parentId ? (
                    <Badge variant="secondary">Subcategory</Badge>
                  ) : null}
                  {item.directChildCount ? (
                    <Badge variant="secondary">
                      {item.directChildCount} subcategor
                      {item.directChildCount === 1 ? "y" : "ies"}
                    </Badge>
                  ) : null}
                  <Badge variant="outline">
                    {item.productCount} product
                    {item.productCount === 1 ? "" : "s"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  {item.hasChildren ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      onClick={() => openCategory(item.id)}
                    >
                      View <ArrowRight />
                    </Button>
                  ) : null}
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                  >
                    <Link
                      href={`/admin/categories/${item.id}`}
                      aria-label={`Edit ${item.name}`}
                    >
                      <Pencil />
                    </Link>
                  </Button>
                  {canWrite && !item.isDefault && !item.hasChildren ? (
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full text-destructive"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 />
                        </Button>
                      }
                      title="Delete category"
                      description={`Delete "${item.name}"? This cannot be undone.`}
                      confirmLabel="Delete"
                      action={() => deleteCategory(item.id)}
                      onDone={() => router.refresh()}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-border bg-card/50 px-4 py-12 text-center text-sm text-muted-foreground">
          {query ? "No categories match this search." : "No categories at this level."}
        </p>
      )}
    </div>
  );
}

function CategoryImage({ item }: { item: CategoryTableRow }) {
  return (
    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
      {item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes="64px"
          className="object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <Tags className="size-5" />
        </div>
      )}
    </div>
  );
}

function CategoryDetails({ item }: { item: CategoryTableRow }) {
  return (
    <div className="min-w-0 flex-1">
      <h3 className="truncate font-display text-base font-semibold text-foreground">
        {item.name}
      </h3>
      <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
        {item.slug}
      </p>
    </div>
  );
}
