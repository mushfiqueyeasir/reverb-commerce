import type { AiAdvisorMessage } from "@/type/aiAdvisorType";

export interface ModelAdvisorResponse {
  message: string;
  status: "answer" | "clarifying" | "recommendations" | "no_match";
  recommendations: { productId: string; reason: string }[];
}

export async function loadAllPages<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
  pageSize = 500,
): Promise<T[]> {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new Error("Page size must be a positive integer.");
  }

  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

interface AdvisorCatalogSearchItem {
  title: string;
  type: string | null;
  price: number;
  description: string;
  categories: string[];
  availableColors: string[];
  availableSizes: string[];
}

export interface InventoryOverview {
  totalProducts: number;
  prices: {
    minimum: number;
    maximum: number;
    average: number;
  };
  categories: { name: string; products: number }[];
  productTypes: { name: string; products: number }[];
  colors: { name: string; products: number }[];
  sizes: { name: string; products: number }[];
}

function countCatalogValues<T extends AdvisorCatalogSearchItem>(
  catalog: readonly T[],
  values: (item: T) => readonly (string | null)[],
): { name: string; products: number }[] {
  const counts = new Map<string, number>();
  for (const item of catalog) {
    for (const value of new Set(values(item).filter(Boolean))) {
      if (!value) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return [...counts]
    .map(([name, products]) => ({ name, products }))
    .sort((a, b) => b.products - a.products || a.name.localeCompare(b.name));
}

export function buildInventoryOverview<T extends AdvisorCatalogSearchItem>(
  catalog: readonly T[],
): InventoryOverview {
  const prices = catalog
    .map((item) => item.price)
    .filter((price) => Number.isFinite(price));
  const total = prices.reduce((sum, price) => sum + price, 0);

  return {
    totalProducts: catalog.length,
    prices: {
      minimum: prices.length > 0 ? Math.min(...prices) : 0,
      maximum: prices.length > 0 ? Math.max(...prices) : 0,
      average:
        prices.length > 0 ? Math.round((total / prices.length) * 100) / 100 : 0,
    },
    categories: countCatalogValues(catalog, (item) => item.categories),
    productTypes: countCatalogValues(catalog, (item) => [item.type]),
    colors: countCatalogValues(catalog, (item) => item.availableColors),
    sizes: countCatalogValues(catalog, (item) => item.availableSizes),
  };
}

const SEARCH_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "available",
  "best",
  "can",
  "find",
  "for",
  "give",
  "help",
  "i",
  "in",
  "is",
  "item",
  "me",
  "of",
  "one",
  "please",
  "product",
  "recommend",
  "show",
  "some",
  "the",
  "to",
  "want",
  "with",
]);

function searchTerms(query: string): string[] {
  return [
    ...new Set(
      (query.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(
        (term) => term.length > 1 && !SEARCH_STOP_WORDS.has(term),
      ),
    ),
  ];
}

function textScore(text: string, terms: string[]): number {
  const normalized = text.toLocaleLowerCase();
  return terms.reduce(
    (score, term) => score + (normalized.includes(term) ? 1 : 0),
    0,
  );
}

function rankByRelevance<T>(
  items: readonly T[],
  query: string,
  searchableText: (item: T) => string,
  limit: number,
): T[] {
  const terms = searchTerms(query);
  if (terms.length === 0) return items.slice(0, limit);
  return items
    .map((item, index) => ({
      item,
      index,
      score: textScore(searchableText(item), terms),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ item }) => item);
}

export function extractMaximumPrice(query: string): number | null {
  const match = query
    .replaceAll(",", "")
    .match(
      /(?:under|below|within|up to|max(?:imum)?|budget(?: of| is)?)\D{0,12}(\d+(?:\.\d+)?)/i,
    );
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function selectRelevantCatalog<T extends AdvisorCatalogSearchItem>(
  catalog: readonly T[],
  query: string,
  limit = 8,
): T[] {
  const budget = extractMaximumPrice(query);
  const candidates =
    budget === null ? catalog : catalog.filter((item) => item.price <= budget);
  return rankByRelevance(
    candidates,
    query,
    (item) =>
      [
        item.title,
        item.title,
        item.title,
        item.type,
        ...item.categories,
        ...item.categories,
        ...item.availableColors,
        ...item.availableSizes,
        item.description,
      ]
        .filter(Boolean)
        .join(" "),
    limit,
  );
}

export function buildAdvisorSystemPrompt({
  storeName,
  inventoryOverview,
  catalog,
}: {
  storeName: string;
  inventoryOverview: InventoryOverview;
  catalog: unknown[];
}): string {
  return `You are the shopping advisor for ${storeName}. Talk naturally in the visitor's language, including Bangla and Banglish. Understand what they need and recommend matching products from the active, in-stock inventory below. For beauty and skincare questions, use the customer's concern, skin or hair type, routine, sensitivities, and budget to identify suitable products. Use the overview to understand the whole active inventory, but recommend only exact products present in the relevant products list.

Return a JSON object with this shape:
{"message":"your response","status":"answer | clarifying | recommendations | no_match","recommendations":[{"productId":"exact relevant product ID","reason":"why it fits"}]}

WHOLE ACTIVE IN-STOCK INVENTORY OVERVIEW:
${JSON.stringify(inventoryOverview)}

RELEVANT ACTIVE IN-STOCK PRODUCTS:
${JSON.stringify(catalog)}`;
}

export function parseAdvisorMessages(
  value: unknown,
): AiAdvisorMessage[] | null {
  if (!Array.isArray(value) || value.length < 1) return null;

  const messages: AiAdvisorMessage[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const role = (item as { role?: unknown }).role;
    const rawContent = (item as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof rawContent !== "string") return null;

    const content = rawContent.trim();
    if (!content) return null;
    messages.push({ role, content });
  }

  return messages.at(-1)?.role === "user" ? messages : null;
}

export function productDescriptionText(
  value: unknown,
  maxLength = 500,
): string {
  if (!value || typeof value !== "object") return "";
  const html = (value as { html?: unknown }).html;
  if (typeof html !== "string") return "";

  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function parseModelAdvisorResponse(
  content: unknown,
): ModelAdvisorResponse | null {
  let value: unknown;

  if (content && typeof content === "object" && !Array.isArray(content)) {
    value = content;
  } else {
    const text = Array.isArray(content)
      ? content
          .flatMap((part) => {
            if (!part || typeof part !== "object") return [];
            const value = (part as { text?: unknown }).text;
            return typeof value === "string" ? [value] : [];
          })
          .join("")
          .trim()
      : typeof content === "string"
        ? content.trim()
        : "";
    if (!text) return null;

    const unfenced = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const firstBrace = unfenced.indexOf("{");
    const lastBrace = unfenced.lastIndexOf("}");
    const candidates = [
      unfenced,
      firstBrace >= 0 && lastBrace > firstBrace
        ? unfenced.slice(firstBrace, lastBrace + 1)
        : "",
    ].filter(Boolean);

    for (const candidate of candidates) {
      try {
        value = JSON.parse(candidate);
        break;
      } catch {
        value = null;
      }
    }
  }

  if (!value || typeof value !== "object") return null;

  const result = value as Record<string, unknown>;
  const message =
    typeof result.message === "string" ? result.message.trim() : "";
  const status = result.status;
  if (
    !message ||
    (status !== "answer" &&
      status !== "clarifying" &&
      status !== "recommendations" &&
      status !== "no_match")
  ) {
    return null;
  }

  const recommendations = Array.isArray(result.recommendations)
    ? result.recommendations.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const productId = (item as { productId?: unknown }).productId;
        const reason = (item as { reason?: unknown }).reason;
        if (typeof productId !== "string" || typeof reason !== "string") {
          return [];
        }
        const cleanProductId = productId.trim();
        const cleanReason = reason.trim();
        return cleanProductId && cleanReason
          ? [{ productId: cleanProductId, reason: cleanReason }]
          : [];
      })
    : [];

  return { message, status, recommendations };
}
