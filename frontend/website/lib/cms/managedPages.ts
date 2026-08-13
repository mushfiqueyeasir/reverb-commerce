const MANAGED_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_SLUGS = new Set(["about", "terms", "privacy", "refund"]);

export function isPublicManagedSlug(slug: string): boolean {
  return MANAGED_SLUG_RE.test(slug) && !RESERVED_SLUGS.has(slug);
}
