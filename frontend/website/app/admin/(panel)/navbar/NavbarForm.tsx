"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/AdminCard";
import { SortableList } from "@/components/admin/SortableList";
import {
  FormActions,
  FormField,
  adminInputClass,
} from "@/components/admin/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  isSafeChromeHref,
  normalizeNavbarConfig,
  type NavbarConfig,
} from "@/lib/cms/siteChrome";
import { saveNavbar } from "./actions";

export function NavbarForm({ initialConfig }: { initialConfig: NavbarConfig }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [config, setConfig] = useState(() =>
    normalizeNavbarConfig(initialConfig),
  );
  const categoryItem = config.items.find((item) => item.kind === "categories");
  const customLinks = config.items.filter((item) => item.kind === "link");

  const setItem = (id: string, key: "label" | "href", value: string) => {
    setConfig((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const setCategoriesEnabled = (enabled: boolean) => {
    setConfig((current) => {
      const existing = current.items.find((item) => item.kind === "categories");
      if (enabled && !existing) {
        return {
          ...current,
          items: [
            {
              id: crypto.randomUUID(),
              kind: "categories" as const,
              label: "Category",
              href: "/product",
            },
            ...current.items,
          ].slice(0, 6),
        };
      }
      if (!enabled && existing) {
        return {
          ...current,
          items: current.items.filter((item) => item.id !== existing.id),
        };
      }
      return current;
    });
  };

  const addItem = () => {
    setConfig((current) => {
      if (current.items.filter((item) => item.kind === "link").length >= 5) {
        return current;
      }
      return {
        ...current,
        items: [
          ...current.items,
          {
            id: crypto.randomUUID(),
            kind: "link",
            label: "New link",
            href: "/",
          },
        ],
      };
    });
  };

  const removeItem = (id: string) => {
    setConfig((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== id),
    }));
  };

  const save = () => {
    const invalid = config.items.find(
      (item) => !item.label.trim() || !isSafeChromeHref(item.href),
    );
    if (invalid) {
      toast.error("Each navbar item needs a label and a valid link.");
      return;
    }
    startTransition(async () => {
      const result = await saveNavbar(config);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Navbar saved");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          The active theme controls the navbar design. Manage links and labels
          here, or change the complete storefront package in Themes.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/admin/themes">Open Themes</Link>
        </Button>
      </div>

      <AdminCard
        title="Desktop navigation"
        description="Enable the automatic category menu and add up to five custom links."
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            disabled={customLinks.length >= 5}
          >
            <Plus /> Add link
          </Button>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 rounded-xl border border-border bg-background/60 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(14rem,0.8fr)_auto] sm:items-center">
            <div>
              <p className="text-sm font-medium text-foreground">
                Categories menu
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Automatically lists every active store category.
              </p>
            </div>
            <FormField label="Label" htmlFor="navbar-category-label">
              <Input
                id="navbar-category-label"
                className={adminInputClass}
                value={categoryItem?.label ?? "Category"}
                disabled={!categoryItem}
                maxLength={40}
                onChange={(event) =>
                  categoryItem &&
                  setItem(categoryItem.id, "label", event.target.value)
                }
              />
            </FormField>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="text-xs font-medium text-muted-foreground">
                {categoryItem ? "Enabled" : "Disabled"}
              </span>
              <Switch
                checked={Boolean(categoryItem)}
                aria-label="Enable categories menu"
                onCheckedChange={setCategoriesEnabled}
              />
            </div>
          </div>

          <div>
            <div className="mb-3">
              <p className="text-sm font-medium text-foreground">
                Custom links
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Drag links to set their order. Use /path or an https:// URL.
              </p>
            </div>
            {customLinks.length ? (
              <SortableList
                items={customLinks}
                getLabel={(item) => item.label}
                onReorder={(items) =>
                  setConfig((current) => ({
                    ...current,
                    items: [
                      ...current.items.filter(
                        (item) => item.kind === "categories",
                      ),
                      ...items,
                    ],
                  }))
                }
                renderItem={(item) => (
                  <div className="grid gap-3 rounded-xl border border-border bg-background/60 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] sm:items-end">
                    <FormField
                      label="Label"
                      htmlFor={`navbar-label-${item.id}`}
                    >
                      <Input
                        id={`navbar-label-${item.id}`}
                        className={adminInputClass}
                        value={item.label}
                        maxLength={40}
                        onChange={(event) =>
                          setItem(item.id, "label", event.target.value)
                        }
                      />
                    </FormField>
                    <FormField label="Link" htmlFor={`navbar-href-${item.id}`}>
                      <Input
                        id={`navbar-href-${item.id}`}
                        className={adminInputClass}
                        value={item.href}
                        maxLength={300}
                        onChange={(event) =>
                          setItem(item.id, "href", event.target.value)
                        }
                      />
                    </FormField>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-11"
                      aria-label={`Remove ${item.label}`}
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              />
            ) : (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No custom navigation links are configured.
              </p>
            )}
          </div>
        </div>
      </AdminCard>

      <FormActions>
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          Save navbar
        </Button>
      </FormActions>
    </div>
  );
}
