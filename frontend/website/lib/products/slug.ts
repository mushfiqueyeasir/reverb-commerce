import { slugify } from "../admin/format";

export function productSlugBase(title: string): string {
  return slugify(title) || "product";
}

export function chooseUniqueProductSlug(
  title: string,
  existingSlugs: Iterable<string>,
): string {
  const base = productSlugBase(title);
  const existing = new Set(existingSlugs);
  if (!existing.has(base)) return base;

  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}
