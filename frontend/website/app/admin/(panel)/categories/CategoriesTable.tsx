"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Tags } from "lucide-react";
import { AdminList } from "@/components/admin/AdminList";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteCategory } from "./actions";

export interface CategoryTableRow {
  id: string;
  name: string;
  slug: string;
  sort: number;
  depth: number;
  parentId: string | null;
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

  return (
    <AdminList
      items={data}
      hint="Subcategories are shown beneath their parent category."
      searchPlaceholder="Search categories…"
      searchFilter={(item, q) =>
        item.name.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q)
      }
      emptyMessage="No categories yet."
      renderLeading={(item) => (
        <div className="relative size-12 overflow-hidden rounded-md border border-border bg-muted">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <Tags className="size-4" />
            </div>
          )}
        </div>
      )}
      renderTitle={(item) => (
        <span style={{ paddingLeft: `${item.depth * 18}px` }}>
          {item.depth ? "↳ " : ""}
          {item.name}
        </span>
      )}
      renderSubtitle={(item) => item.slug}
      renderMeta={(item) => (
        <>
          {item.isDefault ? <Badge>Default</Badge> : null}
          {item.parentId ? <Badge variant="secondary">Subcategory</Badge> : null}
          <Badge variant="outline">
            {item.productCount} product{item.productCount === 1 ? "" : "s"}
          </Badge>
        </>
      )}
      renderTrailing={(item) => (
        <>
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link href={`/admin/categories/${item.id}`} aria-label="Edit">
              <Pencil className="size-4" />
            </Link>
          </Button>
          {canWrite && !item.isDefault && !item.hasChildren ? (
            <ConfirmDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </Button>
              }
              title="Delete category"
              description={`Delete "${item.name}"? This cannot be undone.`}
              confirmLabel="Delete"
              action={() => deleteCategory(item.id)}
              onDone={() => router.refresh()}
            />
          ) : null}
        </>
      )}
    />
  );
}
