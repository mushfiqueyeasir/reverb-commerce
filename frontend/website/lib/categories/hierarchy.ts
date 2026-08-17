import type { Category } from "@/type/categoryType";

function compareCategories(a: Category, b: Category): number {
  if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
  return a.sort - b.sort || a.categoryName.localeCompare(b.categoryName);
}

export function flattenCategoryHierarchy(categories: Category[]): Category[] {
  const byId = new Map(categories.map((category) => [category._id, category]));
  const children = new Map<string, Category[]>();
  const roots: Category[] = [];

  for (const category of categories) {
    if (
      category.parentId &&
      category.parentId !== category._id &&
      byId.has(category.parentId)
    ) {
      const siblings = children.get(category.parentId) ?? [];
      siblings.push(category);
      children.set(category.parentId, siblings);
    } else {
      roots.push(category);
    }
  }

  roots.sort(compareCategories);
  for (const siblings of children.values()) siblings.sort(compareCategories);

  const result: Category[] = [];
  const visited = new Set<string>();
  const visit = (category: Category, depth: number) => {
    if (visited.has(category._id)) return;
    visited.add(category._id);
    result.push({ ...category, depth });
    for (const child of children.get(category._id) ?? []) {
      visit(child, depth + 1);
    }
  };

  for (const root of roots) visit(root, 0);
  for (const category of [...categories].sort(compareCategories)) {
    visit(category, 0);
  }
  return result;
}

export function filterCategoriesWithProductLinks(
  categories: Category[],
  linkedCategoryIds: ReadonlySet<string>,
): Category[] {
  const byId = new Map(categories.map((category) => [category._id, category]));
  const included = new Set<string>();

  for (const categoryId of linkedCategoryIds) {
    const visited = new Set<string>();
    let current = byId.get(categoryId);
    while (current && !visited.has(current._id)) {
      visited.add(current._id);
      included.add(current._id);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
  }

  for (const category of categories) {
    if (category.isDefault) included.add(category._id);
  }

  return categories.filter((category) => included.has(category._id));
}

export function getDescendantIds(
  categories: Category[],
  categoryId: string,
): Set<string> {
  const children = new Map<string, string[]>();
  for (const category of categories) {
    if (!category.parentId) continue;
    const ids = children.get(category.parentId) ?? [];
    ids.push(category._id);
    children.set(category.parentId, ids);
  }
  const result = new Set<string>();
  const pending = [categoryId];
  while (pending.length) {
    const id = pending.pop()!;
    if (result.has(id)) continue;
    result.add(id);
    pending.push(...(children.get(id) ?? []));
  }
  return result;
}

export function getDescendantSlugs(
  categories: Category[],
  selectedSlugs: string[],
): Set<string> {
  const bySlug = new Map(
    categories.map((category) => [category.categoryUrl.current, category]),
  );
  const byId = new Map(categories.map((category) => [category._id, category]));
  const result = new Set<string>();
  for (const slug of selectedSlugs) {
    const selected = bySlug.get(slug);
    if (!selected) continue;
    for (const id of getDescendantIds(categories, selected._id)) {
      const category = byId.get(id);
      if (category) result.add(category.categoryUrl.current);
    }
  }
  return result;
}

export function getCategoryBreadcrumb(
  categories: Category[],
  categoryId: string,
): string[] {
  const byId = new Map(categories.map((category) => [category._id, category]));
  const path: string[] = [];
  const visited = new Set<string>();
  let current = byId.get(categoryId);
  while (current && !visited.has(current._id)) {
    visited.add(current._id);
    path.unshift(current.categoryName);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
}
