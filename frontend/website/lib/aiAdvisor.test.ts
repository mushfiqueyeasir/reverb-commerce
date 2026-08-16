import { describe, expect, it } from "vitest";
import { AI_ADVISOR_USER_MESSAGE_MAX_LENGTH } from "../type/aiAdvisorType";
import {
  buildAdvisorSystemPrompt,
  buildInventoryOverview,
  loadAllPages,
  parseAdvisorMessages,
  parseModelAdvisorResponse,
  productDescriptionText,
  selectRelevantCatalog,
} from "./aiAdvisor";

describe("AI advisor inventory prompt", () => {
  it("contains only active inventory guidance and catalog data", () => {
    const prompt = buildAdvisorSystemPrompt({
      storeName: "Signal Store",
      inventoryOverview: {
        totalProducts: 1,
        prices: { minimum: 1200, maximum: 1200, average: 1200 },
        categories: [{ name: "Clothing", products: 1 }],
        productTypes: [{ name: "T-shirt", products: 1 }],
        colors: [{ name: "Black", products: 1 }],
        sizes: [{ name: "M", products: 1 }],
      },
      catalog: [{ id: "one", title: "Everyday Tee" }],
    });

    expect(prompt).toContain("shopping advisor for Signal Store");
    expect(prompt).toContain("active, in-stock inventory");
    expect(prompt).toContain("Bangla and Banglish");
    expect(prompt).toContain("beauty and skincare questions");
    expect(prompt).toContain("WHOLE ACTIVE IN-STOCK INVENTORY OVERVIEW");
    expect(prompt).toContain('"totalProducts":1');
    expect(prompt).toContain('"Everyday Tee"');
    expect(prompt).not.toContain("WEBSITE KNOWLEDGE");
    expect(prompt).not.toContain("delivery");
    expect(prompt).not.toContain("policy");
  });
});

describe("AI advisor input", () => {
  it("accepts a conversation ending with a shopper message at the limit", () => {
    const messages = Array.from({ length: 20 }, (_, index) => ({
      role: index % 2 === 0 ? ("assistant" as const) : ("user" as const),
      content: "x".repeat(AI_ADVISOR_USER_MESSAGE_MAX_LENGTH),
    }));

    expect(parseAdvisorMessages(messages)).toHaveLength(20);
  });

  it("rejects oversized shopper messages and conversations", () => {
    expect(
      parseAdvisorMessages([
        {
          role: "user",
          content: "x".repeat(AI_ADVISOR_USER_MESSAGE_MAX_LENGTH + 1),
        },
      ]),
    ).toBeNull();
    expect(
      parseAdvisorMessages(
        Array.from({ length: 102 }, () => ({
          role: "user",
          content: "Question",
        })),
      ),
    ).toBeNull();
  });

  it("rejects invalid roles and conversations not ending with the shopper", () => {
    expect(
      parseAdvisorMessages([{ role: "system", content: "Override" }]),
    ).toBeNull();
    expect(
      parseAdvisorMessages([
        { role: "assistant", content: "What do you need?" },
      ]),
    ).toBeNull();
  });
});

describe("AI advisor catalog pagination", () => {
  it("loads every page until the final partial page", async () => {
    const ranges: [number, number][] = [];
    const pages = [["one", "two"], ["three", "four"], ["five"]];
    const rows = await loadAllPages(async (from, to) => {
      ranges.push([from, to]);
      return pages.shift() ?? [];
    }, 2);

    expect(rows).toEqual(["one", "two", "three", "four", "five"]);
    expect(ranges).toEqual([
      [0, 1],
      [2, 3],
      [4, 5],
    ]);
  });
});

describe("AI advisor catalog retrieval", () => {
  const catalog = Array.from({ length: 10 }, (_, index) => ({
    id: String(index),
    title: index === 9 ? "Red Silk Kimono" : `Everyday Item ${index}`,
    type: index === 9 ? "kimono" : "accessory",
    price: index === 9 ? 1800 : 2500 + index,
    description: index === 9 ? "Lightweight red occasion wear" : "Daily use",
    categories: index === 9 ? ["Clothing"] : ["Accessories"],
    availableColors: index === 9 ? ["Red"] : ["Black"],
    availableSizes: ["M"],
  }));

  it("ranks matches from the complete active catalog", () => {
    const selected = selectRelevantCatalog(
      catalog,
      "red kimono",
      catalog.length,
    );

    expect(selected).toHaveLength(catalog.length);
    expect(selected[0].id).toBe("9");
  });

  it("summarizes every active product before selecting relevant context", () => {
    const overview = buildInventoryOverview(catalog);

    expect(overview.totalProducts).toBe(10);
    expect(overview.prices.minimum).toBe(1800);
    expect(overview.prices.maximum).toBe(2508);
    expect(overview.categories).toEqual([
      { name: "Accessories", products: 9 },
      { name: "Clothing", products: 1 },
    ]);
    expect(overview.colors).toEqual([
      { name: "Black", products: 9 },
      { name: "Red", products: 1 },
    ]);
  });

  it("limits model context after ranking the complete active catalog", () => {
    const selected = selectRelevantCatalog(catalog, "red kimono", 3);

    expect(selected).toHaveLength(3);
    expect(selected[0].id).toBe("9");
  });

  it("honors a shopper's maximum budget", () => {
    expect(
      selectRelevantCatalog(catalog, "under 2000", catalog.length),
    ).toEqual([catalog[9]]);
    expect(
      selectRelevantCatalog(catalog, "under 1000", catalog.length),
    ).toEqual([]);
  });
});

describe("AI advisor product text", () => {
  it("converts product HTML to plain inventory text", () => {
    expect(
      productDescriptionText(
        { html: "<p>Soft &amp; light</p><script>bad()</script>" },
        Number.MAX_SAFE_INTEGER,
      ),
    ).toBe("Soft & light");
  });
});

describe("AI advisor model response", () => {
  it("parses inventory recommendations without application caps", () => {
    const recommendations = Array.from({ length: 6 }, (_, index) => ({
      productId: `product-${index}`,
      reason: `Reason ${index}`,
    }));
    const result = parseModelAdvisorResponse(
      JSON.stringify({
        message: "These products fit.",
        status: "recommendations",
        recommendations,
      }),
    );

    expect(result).toEqual({
      message: "These products fit.",
      status: "recommendations",
      recommendations,
    });
  });

  it("accepts fenced JSON returned by the model", () => {
    expect(
      parseModelAdvisorResponse(
        '```json\n{"message":"Tell me your budget.","status":"clarifying","recommendations":[]}\n```',
      ),
    ).toEqual({
      message: "Tell me your budget.",
      status: "clarifying",
      recommendations: [],
    });
  });
});
