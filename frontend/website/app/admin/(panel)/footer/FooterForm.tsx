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
  adminTextareaClass,
} from "@/components/admin/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  isSafeChromeHref,
  normalizeFooterConfig,
  type FooterConfig,
  type FooterLink,
} from "@/lib/cms/siteChrome";
import { saveFooter } from "./actions";

export function FooterForm({ initialConfig }: { initialConfig: FooterConfig }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [config, setConfig] = useState(() =>
    normalizeFooterConfig(initialConfig),
  );

  const addColumn = () => {
    setConfig((current) => {
      if (current.columns.length >= 3) return current;
      return {
        ...current,
        columns: [
          ...current.columns,
          { id: crypto.randomUUID(), title: "New column", links: [] },
        ],
      };
    });
  };

  const updateColumnTitle = (columnIndex: number, title: string) => {
    setConfig((current) => ({
      ...current,
      columns: current.columns.map((column, index) =>
        index === columnIndex ? { ...column, title } : column,
      ),
    }));
  };

  const removeColumn = (columnIndex: number) => {
    setConfig((current) => ({
      ...current,
      columns: current.columns.filter((_, index) => index !== columnIndex),
    }));
  };

  const addColumnLink = (columnIndex: number) => {
    setConfig((current) => ({
      ...current,
      columns: current.columns.map((column, index) =>
        index === columnIndex && column.links.length < 10
          ? {
              ...column,
              links: [
                ...column.links,
                {
                  id: crypto.randomUUID(),
                  label: "New link",
                  href: "/",
                },
              ],
            }
          : column,
      ),
    }));
  };

  const updateColumnLink = (
    columnIndex: number,
    linkIndex: number,
    key: "label" | "href",
    value: string,
  ) => {
    setConfig((current) => ({
      ...current,
      columns: current.columns.map((column, index) =>
        index === columnIndex
          ? {
              ...column,
              links: column.links.map((link, index) =>
                index === linkIndex ? { ...link, [key]: value } : link,
              ),
            }
          : column,
      ),
    }));
  };

  const removeColumnLink = (columnIndex: number, linkIndex: number) => {
    setConfig((current) => ({
      ...current,
      columns: current.columns.map((column, index) =>
        index === columnIndex
          ? {
              ...column,
              links: column.links.filter((_, index) => index !== linkIndex),
            }
          : column,
      ),
    }));
  };

  const addLegalLink = () => {
    setConfig((current) =>
      current.legalLinks.length >= 6
        ? current
        : {
            ...current,
            legalLinks: [
              ...current.legalLinks,
              { id: crypto.randomUUID(), label: "New link", href: "/" },
            ],
          },
    );
  };

  const updateLegalLink = (
    index: number,
    key: "label" | "href",
    value: string,
  ) => {
    setConfig((current) => ({
      ...current,
      legalLinks: current.legalLinks.map((link, linkIndex) =>
        linkIndex === index ? { ...link, [key]: value } : link,
      ),
    }));
  };

  const removeLegalLink = (index: number) => {
    setConfig((current) => ({
      ...current,
      legalLinks: current.legalLinks.filter(
        (_, linkIndex) => linkIndex !== index,
      ),
    }));
  };

  const save = () => {
    if (config.columns.some((column) => !column.title.trim())) {
      toast.error("Each footer column needs a title.");
      return;
    }
    const links = [
      ...config.columns.flatMap((column) => column.links),
      ...config.legalLinks,
    ];
    if (
      links.some((link) => !link.label.trim() || !isSafeChromeHref(link.href))
    ) {
      toast.error("Each footer link needs a label and a valid link.");
      return;
    }
    startTransition(async () => {
      const result = await saveFooter(config);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Footer saved");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          The active theme controls the footer design. Manage content and links
          here, or change the complete storefront package in Themes.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/admin/themes">Open Themes</Link>
        </Button>
      </div>

      <AdminCard
        title="Brand content"
        description="The logo and store name come from Settings."
      >
        <FormField
          label="Description"
          htmlFor="footer-description"
          hint="Leave blank to hide the footer description."
        >
          <Textarea
            id="footer-description"
            className={adminTextareaClass}
            value={config.description}
            maxLength={500}
            rows={4}
            onChange={(event) =>
              setConfig((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
        </FormField>
      </AdminCard>

      <AdminCard
        title="Link columns"
        description="Add up to three custom columns with ten links each."
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addColumn}
            disabled={config.columns.length >= 3}
          >
            <Plus /> Add column
          </Button>
        }
      >
        <div className="space-y-4">
          {config.columns.length ? (
            <SortableList
              items={config.columns}
              getLabel={(column) => column.title}
              onReorder={(columns) =>
                setConfig((current) => ({ ...current, columns }))
              }
              renderItem={(column, columnIndex) => (
                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <div className="mb-4 flex items-end gap-2">
                    <FormField
                      label="Column title"
                      htmlFor={`footer-column-${column.id}`}
                      className="flex-1"
                    >
                      <Input
                        id={`footer-column-${column.id}`}
                        className={adminInputClass}
                        value={column.title}
                        maxLength={40}
                        onChange={(event) =>
                          updateColumnTitle(columnIndex, event.target.value)
                        }
                      />
                    </FormField>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addColumnLink(columnIndex)}
                      disabled={column.links.length >= 10}
                    >
                      <Plus /> Link
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${column.title} column`}
                      onClick={() => removeColumn(columnIndex)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  {column.links.length ? (
                    <SortableList
                      items={column.links}
                      getLabel={(link) => link.label}
                      onReorder={(links) =>
                        setConfig((current) => ({
                          ...current,
                          columns: current.columns.map((candidate) =>
                            candidate.id === column.id
                              ? { ...candidate, links }
                              : candidate,
                          ),
                        }))
                      }
                      renderItem={(link, linkIndex) => (
                        <LinkFields
                          link={link}
                          prefix={column.title}
                          onChange={(key, value) =>
                            updateColumnLink(columnIndex, linkIndex, key, value)
                          }
                          onRemove={() =>
                            removeColumnLink(columnIndex, linkIndex)
                          }
                        />
                      )}
                    />
                  ) : (
                    <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                      This column has no links.
                    </p>
                  )}
                </div>
              )}
            />
          ) : (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No footer columns are configured.
            </p>
          )}
        </div>
      </AdminCard>

      <AdminCard
        title="Legal links"
        description="These links appear in a dedicated Legal column."
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLegalLink}
            disabled={config.legalLinks.length >= 6}
          >
            <Plus /> Add link
          </Button>
        }
      >
        <div className="space-y-2">
          {config.legalLinks.length ? (
            <SortableList
              items={config.legalLinks}
              getLabel={(link) => link.label}
              onReorder={(legalLinks) =>
                setConfig((current) => ({ ...current, legalLinks }))
              }
              renderItem={(link, index) => (
                <LinkFields
                  link={link}
                  prefix="legal"
                  onChange={(key, value) => updateLegalLink(index, key, value)}
                  onRemove={() => removeLegalLink(index)}
                />
              )}
            />
          ) : null}
          {!config.legalLinks.length ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No legal links are configured.
            </p>
          ) : null}
        </div>
      </AdminCard>

      <FormActions>
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          Save footer
        </Button>
      </FormActions>
    </div>
  );
}

function LinkFields({
  link,
  prefix,
  onChange,
  onRemove,
}: {
  link: FooterLink;
  prefix: string;
  onChange: (key: "label" | "href", value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-border/70 p-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center">
      <Input
        aria-label="Link label"
        className={adminInputClass}
        value={link.label}
        maxLength={60}
        onChange={(event) => onChange("label", event.target.value)}
      />
      <Input
        aria-label="Link destination"
        className={adminInputClass}
        value={link.href}
        maxLength={300}
        placeholder="/path or https://example.com"
        onChange={(event) => onChange("href", event.target.value)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Remove ${link.label} from ${prefix}`}
        onClick={onRemove}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
