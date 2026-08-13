"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/AdminCard";
import { SortableList } from "@/components/admin/SortableList";
import Navbar from "@/components/Common/Header/Navbar";
import {
  FormActions,
  FormField,
  adminInputClass,
} from "@/components/admin/FormField";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  NAVBAR_DESIGNS,
  isSafeChromeHref,
  normalizeNavbarConfig,
  type NavbarConfig,
  type NavbarVariant,
} from "@/lib/cms/siteChrome";
import { cn } from "@/lib/utils";
import type { MenuType } from "@/type/menyType";
import { enableNavbarDesign, saveNavbar } from "./actions";

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

  const enableDesign = (variant: NavbarVariant) => {
    startTransition(async () => {
      const result = await enableNavbarDesign(variant);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setConfig((current) => ({ ...current, variant }));
      toast.success(
        `${variant === "classic" ? "Classic" : "Centered"} navbar enabled`,
      );
      router.refresh();
    });
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
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Preview each navbar design and enable the one you want to use. Only
          one design can be enabled at a time.
        </p>
        <NavbarDesignSelector
          active={config.variant}
          config={config}
          pending={pending}
          onEnable={enableDesign}
        />
      </div>

      <div className="border-t border-border pt-6">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Content
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Content is shared by every navbar design.
        </p>
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

function NavbarDesignSelector({
  active,
  config,
  pending,
  onEnable,
}: {
  active: NavbarVariant;
  config: NavbarConfig;
  pending: boolean;
  onEnable: (variant: NavbarVariant) => void;
}) {
  return (
    <div className="space-y-2">
      {NAVBAR_DESIGNS.map((design) => {
        const enabled = design.variant === active;
        return (
          <div
            key={design.variant}
            className={cn(
              "flex flex-col gap-3 rounded-2xl border bg-card/80 p-4 sm:flex-row sm:items-center sm:justify-between",
              enabled && "border-primary/50",
            )}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-base font-semibold text-foreground">
                  {design.title}
                </p>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                  v{design.version}
                </span>
                <Badge variant={enabled ? "success" : "secondary"}>
                  {enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {design.description}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-3 sm:border-0 sm:pt-0">
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="ghost" size="sm">
                    <Eye /> Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:max-w-[95vw]">
                  <DialogHeader>
                    <DialogTitle>{design.title}</DialogTitle>
                    <DialogDescription>{design.description}</DialogDescription>
                  </DialogHeader>
                  <NavbarDesignPreview
                    config={{ ...config, variant: design.variant }}
                  />
                </DialogContent>
              </Dialog>
              <span className="text-xs font-medium text-muted-foreground">
                {enabled ? "Enabled" : "Enable"}
              </span>
              <Switch
                checked={enabled}
                disabled={pending || enabled}
                aria-label={`Enable ${design.title}`}
                onCheckedChange={(checked) => {
                  if (checked && !enabled) onEnable(design.variant);
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NavbarDesignPreview({ config }: { config: NavbarConfig }) {
  const menuData: MenuType[] = config.items.map((item) => ({
    label: item.label,
    href: item.href,
    kind: item.kind === "categories" ? "categories" : "links",
    items:
      item.kind === "categories"
        ? [
            {
              label: "All products",
              href: "/product",
              isDefault: true,
            },
            {
              label: "Skincare",
              href: "/product?category=skincare",
              items: [
                { label: "Cleansers", href: "/product?category=cleansers" },
                { label: "Sunscreens", href: "/product?category=sunscreens" },
              ],
            },
            {
              label: "Makeup",
              href: "/product?category=makeup",
              items: [
                { label: "Foundation", href: "/product?category=foundation" },
                { label: "Lipstick", href: "/product?category=lipstick" },
              ],
            },
          ]
        : undefined,
  }));
  return (
    <div className="overflow-hidden rounded-xl bg-background p-2 sm:p-5">
      <Navbar
        preview
        menuData={menuData}
        logoUrl={null}
        storeName="Your Store"
        config={config}
      />
      <div className="grid min-h-52 place-items-center bg-gradient-to-br from-primary/10 via-background to-background text-center">
        <div>
          <p className="font-display text-3xl font-semibold text-foreground">
            Storefront preview
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This uses your current navbar content and selected design.
          </p>
        </div>
      </div>
    </div>
  );
}
