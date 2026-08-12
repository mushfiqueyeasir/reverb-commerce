export interface AboutV2BaseProps {
  config: Record<string, unknown>;
  preview?: boolean;
}

export interface AboutV2ImageProps extends AboutV2BaseProps {
  imageUrl?: string | null;
}

export interface AboutStatV2Item {
  label: string;
  value: string;
}

export interface AboutValueV2Item {
  title: string;
  body: string;
}

export interface AboutCraftV2Item {
  label: string;
  sub: string;
  icon: string;
}

export function configString(
  config: Record<string, unknown>,
  key: string,
): string | null {
  const value = config[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function itemRecords(config: Record<string, unknown>) {
  const items = config.items;
  if (!Array.isArray(items)) return [];
  return items.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function itemString(item: Record<string, unknown>, key: string) {
  const value = item[key];
  return typeof value === "string" ? value.trim() : "";
}

export function parseStats(config: Record<string, unknown>): AboutStatV2Item[] {
  return itemRecords(config)
    .map((item) => ({
      label: itemString(item, "label"),
      value: itemString(item, "value"),
    }))
    .filter((item) => item.label || item.value);
}

export function parseValues(
  config: Record<string, unknown>,
): AboutValueV2Item[] {
  return itemRecords(config)
    .map((item) => ({
      title: itemString(item, "title"),
      body: itemString(item, "body"),
    }))
    .filter((item) => item.title || item.body);
}

export function parseCraft(
  config: Record<string, unknown>,
): AboutCraftV2Item[] {
  return itemRecords(config)
    .map((item) => ({
      label: itemString(item, "label"),
      sub: itemString(item, "sub"),
      icon: itemString(item, "icon"),
    }))
    .filter((item) => item.label || item.sub);
}

function decodeCodePoint(entity: string, code: string, radix: number) {
  const point = Number.parseInt(code, radix);
  return Number.isFinite(point) && point >= 0 && point <= 0x10ffff
    ? String.fromCodePoint(point)
    : entity;
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&#(\d+);/g, (entity, code: string) =>
      decodeCodePoint(entity, code, 10),
    )
    .replace(/&#x([\da-f]+);/gi, (entity, code: string) =>
      decodeCodePoint(entity, code, 16),
    );
}

export function htmlParagraphs(value: string | null): string[] {
  if (!value) return [];

  const plain = decodeEntities(
    value
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<li[^>]*>/gi, "")
      .replace(/<\/(p|div|li|blockquote|h[1-6])>/gi, "\n\n")
      .replace(/<[^>]+>/g, ""),
  );

  return plain
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
