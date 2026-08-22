function token(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

function titleToken(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map(token)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part.slice(0, 3))
    .join("-");
}

function optionToken(value: string): string {
  const normalized = token(value);
  if (normalized.length <= 3) return normalized;
  return `${normalized.slice(0, 2)}${normalized.at(-1)}`;
}

export function generateProductSku(
  title: string,
  color?: string | null,
  size?: string | null,
): string {
  return (
    [titleToken(title), optionToken(color ?? ""), token(size ?? "")]
      .filter(Boolean)
      .join("-") || "SKU"
  );
}

function skuCandidate(base: string, variantId: string, attempt: number): string {
  if (attempt === 0) return base;

  const compactId = token(variantId) || "AUTO";
  const segmentLength = Math.min(8 + (attempt - 1) * 4, compactId.length);
  const candidate = `${base}-${compactId.slice(0, segmentLength)}`;
  const fullIdAttempt = Math.ceil(Math.max(compactId.length - 8, 0) / 4) + 1;
  return attempt > fullIdAttempt
    ? `${candidate}-${attempt - fullIdAttempt + 1}`
    : candidate;
}

export function generateUniqueProductSkus(
  title: string,
  variants: { id: string; color?: string | null; size?: string | null }[],
  attempt = 0,
): string[] {
  const occupied = new Set<string>();

  return variants.map((variant) => {
    const base = generateProductSku(title, variant.color, variant.size);
    let candidateAttempt = attempt;
    let candidate = skuCandidate(base, variant.id, candidateAttempt);
    while (occupied.has(candidate.toLowerCase())) {
      candidateAttempt += 1;
      candidate = skuCandidate(base, variant.id, candidateAttempt);
    }
    occupied.add(candidate.toLowerCase());
    return candidate;
  });
}
