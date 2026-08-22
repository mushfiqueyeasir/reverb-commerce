"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  ImageUploader,
  type UploadedImage,
} from "@/components/admin/ImageUploader";
import {
  FormActions,
  FormField,
  adminInputClass,
  adminSelectClass,
} from "@/components/admin/FormField";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BUCKETS } from "@/lib/supabase/config";
import { slugify } from "@/lib/admin/format";
import { DEFAULT_TEE_SIZE_CHART } from "@/lib/products/sizeChart";
import { DEFAULT_TEE_VARIANTS } from "@/lib/products/variants";
import { generateProductSku } from "@/lib/products/sku";
import { deleteImageObjects } from "@/app/admin/storage-actions";
import {
  saveProduct,
  suggestProductSlug,
  type ProductVariantInput,
} from "./actions";

export interface SizeChartFormRow {
  size: string;
  chest: string;
  length: string;
}

export interface ProductFormData {
  id?: string;
  title: string;
  slug: string;
  sizing_mode: "none" | "required";
  status: "active" | "draft" | "archived";
  product_type: string | null;
  original_price: number;
  current_price: number;
  description: { html?: string } | null;
  size_chart?: SizeChartFormRow[];
  categoryIds: string[];
  images: UploadedImage[];
  variants: VariantRow[];
}

interface VariantRow {
  id?: string;
  size: string;
  color: string;
  sku: string;
  stock_quantity: string;
  low_stock_threshold: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  parentId: string | null;
  depth: number;
}

const emptyVariant = (): VariantRow => ({
  size: "",
  color: "",
  sku: "",
  stock_quantity: "0",
  low_stock_threshold: "5",
});

export function ProductForm({
  product,
  categories,
}: {
  product?: ProductFormData;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [slugPending, startSlugTransition] = useTransition();
  const [imageBusy, setImageBusy] = useState(false);
  const slugRequest = useRef(0);

  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [hasSizes, setHasSizes] = useState(product?.sizing_mode !== "none");
  const [skuMode, setSkuMode] = useState<"auto" | "manual">(
    product ? "manual" : "auto",
  );

  const [status, setStatus] = useState<"active" | "draft" | "archived">(
    product?.status ?? "active",
  );
  const [productType, setProductType] = useState(product?.product_type ?? "");
  const [originalPrice, setOriginalPrice] = useState(
    String(product?.original_price ?? 0),
  );
  const [currentPrice, setCurrentPrice] = useState(
    String(product?.current_price ?? 0),
  );
  const [description, setDescription] = useState(
    product?.description?.html ?? "",
  );
  const [categoryIds, setCategoryIds] = useState<string[]>(
    product?.categoryIds ?? [],
  );
  const [categoryQuery, setCategoryQuery] = useState("");
  const [images, setImages] = useState<UploadedImage[]>(product?.images ?? []);
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants?.length ? product.variants : [emptyVariant()],
  );
  const [sizeChart, setSizeChart] = useState<SizeChartFormRow[]>(
    product?.size_chart?.length ? product.size_chart : [],
  );
  const categoryGroups = useMemo(() => {
    const byId = new Map(categories.map((category) => [category.id, category]));
    const children = new Map<string, CategoryOption[]>();
    const roots: CategoryOption[] = [];
    for (const category of categories) {
      if (category.parentId && byId.has(category.parentId)) {
        const values = children.get(category.parentId) ?? [];
        values.push(category);
        children.set(category.parentId, values);
      } else {
        roots.push(category);
      }
    }
    const query = categoryQuery.trim().toLowerCase();
    const visibleIds = new Set<string>();
    const addDescendants = (category: CategoryOption) => {
      visibleIds.add(category.id);
      for (const child of children.get(category.id) ?? [])
        addDescendants(child);
    };
    if (query) {
      for (const category of categories) {
        if (!category.name.toLowerCase().includes(query)) continue;
        addDescendants(category);
        let parentId = category.parentId;
        while (parentId) {
          visibleIds.add(parentId);
          parentId = byId.get(parentId)?.parentId ?? null;
        }
      }
    }
    const flatten = (category: CategoryOption): CategoryOption[] => [
      category,
      ...(children.get(category.id) ?? []).flatMap(flatten),
    ];
    return roots
      .map((root) => {
        const options = flatten(root).filter(
          (category) => !query || visibleIds.has(category.id),
        );
        return { root, options };
      })
      .filter((group) => group.options.length > 0);
  }, [categories, categoryQuery]);

  const cancel = async () => {
    if (imageBusy) return;
    const unsavedPaths = images
      .filter((image) => image.isNew)
      .map((image) => image.path);
    if (unsavedPaths.length) {
      setImageBusy(true);
      try {
        const result = await deleteImageObjects({
          bucket: BUCKETS.product,
          paths: unsavedPaths,
        });
        if (result.error)
          toast.error("Some unused product images could not be removed.");
      } catch {
        toast.error("Some unused product images could not be removed.");
      }
    }
    router.push("/admin/products");
  };

  const onTitleChange = (v: string) => {
    setTitle(v);
    slugRequest.current += 1;
    if (!product) setSlug(slugify(v));
  };

  const generateSlug = () => {
    if (product || !title.trim()) return;
    const request = ++slugRequest.current;
    startSlugTransition(async () => {
      const result = await suggestProductSlug(title);
      if (request !== slugRequest.current) return;
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.slug) setSlug(result.slug);
    });
  };

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const updateVariant = (
    index: number,
    key: keyof VariantRow,
    value: string,
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [key]: value } : v)),
    );
  };

  const addVariant = () => setVariants((prev) => [...prev, emptyVariant()]);
  const removeVariant = (index: number) =>
    setVariants((prev) => prev.filter((_, i) => i !== index));
  const loadDefaultVariants = () =>
    setVariants(DEFAULT_TEE_VARIANTS.map((r) => ({ ...r })));

  const updateSizeChart = (
    index: number,
    key: keyof SizeChartFormRow,
    value: string,
  ) => {
    setSizeChart((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  };
  const addSizeChartRow = () =>
    setSizeChart((prev) => [...prev, { size: "", chest: "", length: "" }]);
  const removeSizeChartRow = (index: number) =>
    setSizeChart((prev) => prev.filter((_, i) => i !== index));
  const loadDefaultSizeChart = () =>
    setSizeChart(DEFAULT_TEE_SIZE_CHART.map((r) => ({ ...r })));

  const changeSizingMode = (enabled: boolean) => {
    setHasSizes(enabled);
    if (enabled) return;

    setVariants((current) => {
      const first = current[0] ?? emptyVariant();
      const stock = current.reduce(
        (sum, variant) => sum + (Number(variant.stock_quantity) || 0),
        0,
      );
      return [
        {
          ...first,
          size: "",
          color: "",
          stock_quantity: String(stock),
        },
      ];
    });
    setSizeChart([]);
  };

  const changeSkuMode = (mode: "auto" | "manual") => {
    if (mode === "manual" && skuMode === "auto") {
      setVariants((current) =>
        current.map((variant) => ({
          ...variant,
          sku: generateProductSku(title, variant.color, variant.size),
        })),
      );
    }
    setSkuMode(mode);
  };

  const submit = () => {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }

    const cleanedVariants: ProductVariantInput[] = variants
      .filter(
        (v) =>
          v.size.trim() ||
          v.color.trim() ||
          v.sku.trim() ||
          v.stock_quantity !== "" ||
          v.low_stock_threshold !== "",
      )
      .map((v) => ({
        id: v.id,
        size: v.size.trim() || null,
        color: v.color.trim() || null,
        sku:
          (skuMode === "auto"
            ? generateProductSku(title, v.color, v.size)
            : v.sku.trim()) || null,
        stock_quantity: Number(v.stock_quantity) || 0,
        low_stock_threshold: Number(v.low_stock_threshold) || 0,
      }));

    if (hasSizes && cleanedVariants.some((variant) => !variant.size)) {
      toast.error("Add a size to every variant.");
      return;
    }
    if (!hasSizes && cleanedVariants.length !== 1) {
      toast.error("A size-free product requires one general inventory row.");
      return;
    }
    if (
      skuMode === "manual" &&
      cleanedVariants.some((variant) => !variant.sku)
    ) {
      toast.error("Every variation requires an SKU.");
      return;
    }
    const skus = cleanedVariants
      .map((variant) => variant.sku?.toLowerCase())
      .filter((sku): sku is string => Boolean(sku));
    if (skuMode === "manual" && new Set(skus).size !== skus.length) {
      toast.error("Every variation must have a unique SKU.");
      return;
    }

    const cleanedSizeChart = sizeChart
      .map((row) => ({
        size: row.size.trim(),
        chest: row.chest.trim(),
        length: row.length.trim(),
      }))
      .filter((row) => row.size && (row.chest || row.length));

    startTransition(async () => {
      const res = await saveProduct({
        id: product?.id,
        title,
        sizing_mode: hasSizes ? "required" : "none",
        status,
        product_type: productType.trim() || null,
        original_price: Number(originalPrice) || 0,
        current_price: Number(currentPrice) || 0,
        description: description.trim() ? { html: description } : null,
        size_chart:
          hasSizes && cleanedSizeChart.length ? cleanedSizeChart : null,
        categoryIds,
        images,
        skuMode,
        variants: cleanedVariants,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(product ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6 flex h-auto w-fit flex-wrap justify-start gap-1 rounded-xl bg-card p-1">
          <TabsTrigger value="general" className="rounded-lg px-4">
            General
          </TabsTrigger>
          <TabsTrigger value="pricing" className="rounded-lg px-4">
            Pricing
          </TabsTrigger>
          <TabsTrigger value="variations" className="rounded-lg px-4">
            Variations
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-lg px-4">
            Categories
          </TabsTrigger>
          <TabsTrigger value="images" className="rounded-lg px-4">
            Images
          </TabsTrigger>
          {hasSizes && (
            <TabsTrigger value="size-chart" className="rounded-lg px-4">
              Size chart
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general" className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Name, visibility, automatic URL, and product story.
          </p>
          <FormField
            label="Status"
            hint="Draft and archived products stay in admin but are hidden from the store."
          >
            <Select
              value={status}
              onValueChange={(v) =>
                setStatus(v as "active" | "draft" | "archived")
              }
            >
              <SelectTrigger className={adminSelectClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  Active — visible in store
                </SelectItem>
                <SelectItem value="draft">Draft — hidden from store</SelectItem>
                <SelectItem value="archived">
                  Archived — hidden from store
                </SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Title" htmlFor="title">
            <Input
              id="title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={generateSlug}
              placeholder="e.g. Coral Signal Tee"
              className={adminInputClass}
            />
          </FormField>
          <FormField
            label="URL slug"
            htmlFor="slug"
            hint={
              product
                ? "Existing product URLs remain stable when the title changes."
                : "Generated from the title and checked for uniqueness."
            }
          >
            <Input
              id="slug"
              value={slug}
              readOnly
              aria-busy={slugPending}
              placeholder={
                slugPending ? "Checking availability…" : "Generated from title"
              }
              className={`${adminInputClass} cursor-default bg-muted/50`}
            />
          </FormField>
          <FormField label="Description">
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe the product…"
            />
          </FormField>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Product type and storefront prices.
          </p>
          <FormField label="Product type" htmlFor="product_type">
            <Input
              id="product_type"
              value={productType ?? ""}
              onChange={(e) => setProductType(e.target.value)}
              placeholder="e.g. Tee"
              className={adminInputClass}
            />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Original price" htmlFor="original_price">
              <Input
                id="original_price"
                type="number"
                step="0.01"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className={adminInputClass}
              />
            </FormField>
            <FormField label="Current price" htmlFor="current_price">
              <Input
                id="current_price"
                type="number"
                step="0.01"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                className={adminInputClass}
              />
            </FormField>
          </div>
        </TabsContent>

        <TabsContent value="variations" className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card/60 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                This product has sizes
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Turn this off for accessories, bike parts, and other products
                sold without a size choice.
              </p>
            </div>
            <Switch
              checked={hasSizes}
              onCheckedChange={changeSizingMode}
              aria-label="This product has sizes"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {hasSizes ? "Stock by size" : "General inventory"}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasSizes
                  ? "Prefill M–2XL, then set colour, SKU, and stock."
                  : "Customers will not see or select a size for this product."}
              </p>
            </div>
            {hasSizes && (
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full px-3.5"
                  onClick={loadDefaultVariants}
                >
                  Load tee defaults
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full px-3.5"
                  onClick={addVariant}
                >
                  <Plus className="size-3.5" />
                  Add row
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">SKU</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Generate SKUs from the product, color, and size, or enter your
                own identifiers.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={skuMode === "auto" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => changeSkuMode("auto")}
              >
                Auto-generate
              </Button>
              <Button
                type="button"
                size="sm"
                variant={skuMode === "manual" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => changeSkuMode("manual")}
              >
                Enter manually
              </Button>
            </div>
          </div>

          {variants.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No variations yet.
              </p>
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                onClick={loadDefaultVariants}
              >
                Load tee defaults
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card/60 p-3 sm:grid-cols-12 sm:items-end sm:gap-2 sm:p-3.5"
                >
                  {hasSizes && (
                    <FormField label="Size" className="sm:col-span-1">
                      <Input
                        value={v.size}
                        onChange={(e) =>
                          updateVariant(i, "size", e.target.value)
                        }
                        placeholder="M"
                        className={adminInputClass}
                      />
                    </FormField>
                  )}
                  {hasSizes && (
                    <FormField label="Color" className="sm:col-span-2">
                      <Input
                        value={v.color}
                        onChange={(e) =>
                          updateVariant(i, "color", e.target.value)
                        }
                        placeholder="Black"
                        className={adminInputClass}
                      />
                    </FormField>
                  )}
                  <FormField label="SKU" className="col-span-2 sm:col-span-2">
                    <Input
                      value={
                        skuMode === "auto"
                          ? generateProductSku(title, v.color, v.size)
                          : v.sku
                      }
                      onChange={(e) => updateVariant(i, "sku", e.target.value)}
                      readOnly={skuMode === "auto"}
                      className={adminInputClass}
                    />
                  </FormField>
                  <FormField label="Stock" className="sm:col-span-2">
                    <Input
                      type="number"
                      min={0}
                      value={v.stock_quantity}
                      onChange={(e) =>
                        updateVariant(i, "stock_quantity", e.target.value)
                      }
                      className={`${adminInputClass} min-w-[4.5rem] px-3 tabular-nums`}
                    />
                  </FormField>
                  <FormField label="Low" className="sm:col-span-2">
                    <Input
                      type="number"
                      min={0}
                      value={v.low_stock_threshold}
                      onChange={(e) =>
                        updateVariant(i, "low_stock_threshold", e.target.value)
                      }
                      className={`${adminInputClass} min-w-[4.5rem] px-3 tabular-nums`}
                    />
                  </FormField>
                  {hasSizes && (
                    <div className="col-span-2 flex justify-end sm:col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 rounded-full"
                        onClick={() => removeVariant(i)}
                        aria-label="Remove variation"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Assign this product to one or more categories.
          </p>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No categories yet. Create one first.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={categoryQuery}
                  onChange={(event) => setCategoryQuery(event.target.value)}
                  placeholder="Search categories…"
                  className={`${adminInputClass} pl-10`}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {categoryIds.length} selected
              </p>
              {categoryGroups.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No categories match your search.
                </div>
              ) : (
                <div className="grid items-start gap-3 sm:grid-cols-2">
                  {categoryGroups.map(({ root, options }) => (
                    <div
                      key={root.id}
                      className="overflow-hidden rounded-xl border border-border bg-card/60"
                    >
                      {options.map((category) => (
                        <label
                          key={category.id}
                          className={`flex cursor-pointer items-center gap-2.5 border-b border-border px-4 py-3 text-sm normal-case tracking-normal text-foreground transition last:border-b-0 hover:bg-muted/50 ${category.id === root.id ? "bg-muted/40 font-semibold" : ""}`}
                          style={{
                            paddingLeft: `${16 + Math.max(0, category.depth) * 18}px`,
                          }}
                        >
                          <input
                            type="checkbox"
                            className="size-4 shrink-0 accent-primary"
                            checked={categoryIds.includes(category.id)}
                            onChange={() => toggleCategory(category.id)}
                          />
                          <span>{category.name}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="images" className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Upload multiple photos for one product. Mark a main image with the
            star — the rest appear as gallery thumbnails on the product page.
          </p>
          <ImageUploader
            bucket={BUCKETS.product}
            value={images}
            onChange={setImages}
            multiple
            maxFiles={5}
            maxFileSizeMb={4}
            optimizeToWebp
            fileNamePrefix={title || "product"}
            onBusyChange={setImageBusy}
            disabled={pending || imageBusy}
            label="Upload product images"
          />
        </TabsContent>

        {hasSizes && (
          <TabsContent value="size-chart" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Size chart
                </p>
                <p className="text-xs text-muted-foreground">
                  Optional. Shown on the product page when rows exist.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full px-3.5"
                  onClick={loadDefaultSizeChart}
                >
                  Load tee defaults
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full px-3.5"
                  onClick={addSizeChartRow}
                >
                  <Plus className="size-3.5" />
                  Add row
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {sizeChart.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card/60 p-3.5 sm:grid-cols-12 sm:items-end sm:gap-2"
                >
                  <FormField label="Size" className="sm:col-span-3">
                    <Input
                      value={row.size}
                      onChange={(e) =>
                        updateSizeChart(i, "size", e.target.value)
                      }
                      placeholder="M"
                      className={adminInputClass}
                    />
                  </FormField>
                  <FormField label="Chest (in)" className="sm:col-span-4">
                    <Input
                      value={row.chest}
                      onChange={(e) =>
                        updateSizeChart(i, "chest", e.target.value)
                      }
                      placeholder="22"
                      className={adminInputClass}
                    />
                  </FormField>
                  <FormField label="Length (in)" className="sm:col-span-4">
                    <Input
                      value={row.length}
                      onChange={(e) =>
                        updateSizeChart(i, "length", e.target.value)
                      }
                      placeholder="28"
                      className={adminInputClass}
                    />
                  </FormField>
                  <div className="flex justify-end sm:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={() => removeSizeChartRow(i)}
                      aria-label="Remove size chart row"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {sizeChart.length === 0 && (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-4 py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    No size chart. Customers won&apos;t see a guide on this
                    product.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full"
                    onClick={loadDefaultSizeChart}
                  >
                    Load tee defaults
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      <FormActions>
        <Button
          variant="outline"
          onClick={() => void cancel()}
          disabled={pending || imageBusy}
          className="rounded-full px-6"
        >
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={pending || imageBusy}
          className="rounded-full px-6"
        >
          {pending || imageBusy ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          {product ? "Save changes" : "Create product"}
        </Button>
      </FormActions>
    </div>
  );
}
