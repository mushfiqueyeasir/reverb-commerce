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
