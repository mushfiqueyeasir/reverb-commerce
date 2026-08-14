import { describe, expect, it } from "vitest";
import {
  buildAdvisorSystemPrompt,
  buildBudgetedAdvisorContext,
  estimateAdvisorTokens,
  loadAllPages,
  parseAdvisorMessages,
  parseModelAdvisorResponse,
  productDescriptionText,
  selectRelevantCatalog,
  selectRelevantKnowledge,
} from "./aiAdvisor";

describe("AI advisor sales prompt", () => {
  it("sets a natural, truthful sales style with a limited discovery phase", () => {
    const prompt = buildAdvisorSystemPrompt({
      storeName: "Signal Store",
      catalog: [{ id: "one", title: "Everyday Tee" }],
      websiteKnowledge: [
        {
          id: "returns",
          title: "Returns",
          href: "/refund-policy",
          sourceType: "policy",
          content: "Returns are accepted within seven days.",
        },
      ],
      priorAssistantTurns: 1,
    });

    expect(prompt).toContain("knowledgeable store expert for Signal Store");
    expect(prompt).toContain("at most 2 more clarification questions");
    expect(prompt).toContain("entire website");
    expect(prompt).toContain("Never create fake urgency");
    expect(prompt).toContain('"Everyday Tee"');
    expect(prompt).toContain('"/refund-policy"');
  });

  it("stops further questioning after the discovery allowance is used", () => {
    const prompt = buildAdvisorSystemPrompt({
      storeName: "Signal Store",
      catalog: [],
      priorAssistantTurns: 3,
    });

    expect(prompt).toContain("at most 0 more clarification questions");
  });
});

describe("AI advisor prompt budget", () => {
  it("keeps ranked full-inventory context within the token budget", () => {
    const catalog = Array.from({ length: 100 }, (_, index) => ({
      id: String(index),
      title: `Product ${index}`,
      description: "Detailed product information ".repeat(30),
    }));
    const messages = [
      { role: "user" as const, content: "Show me a suitable product" },
    ];
    const result = buildBudgetedAdvisorContext({
      storeName: "Signal Store",
      catalog,
      websiteKnowledge: [],
      priorAssistantTurns: 0,
      messages,
      tokenBudget: 3_000,
    });

    expect(result.estimatedTokens).toBeLessThanOrEqual(3_000);
    expect(result.catalog.length).toBeGreaterThan(0);
    expect(result.catalog.length).toBeLessThan(48);
    expect(result.estimatedTokens).toBe(
      estimateAdvisorTokens(result.systemPrompt) +
        estimateAdvisorTokens(JSON.stringify(messages)),
    );
  });
});

describe("AI advisor input", () => {
  it("accepts a trimmed conversation ending with the shopper", () => {
    expect(
      parseAdvisorMessages([
        { role: "assistant", content: " What is your budget? " },
        { role: "user", content: " Under 2000 " },
      ]),
    ).toEqual([
      { role: "assistant", content: "What is your budget?" },
      { role: "user", content: "Under 2000" },
    ]);
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

  it("rejects oversized messages", () => {
    expect(
      parseAdvisorMessages([{ role: "user", content: "x".repeat(601) }]),
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

  it("ranks matches from the full catalog before applying the prompt limit", () => {
    const selected = selectRelevantCatalog(catalog, "red kimono", 3);

    expect(selected).toHaveLength(3);
    expect(selected[0].id).toBe("9");
  });

  it("honors a shopper's maximum budget", () => {
    const selected = selectRelevantCatalog(catalog, "under 2000", 3);

    expect(selected.map((item) => item.id)).toEqual(["9"]);
    expect(selectRelevantCatalog(catalog, "under 1000", 3)).toEqual([]);
  });

  it("ranks and compacts website knowledge", () => {
    const selected = selectRelevantKnowledge(
      [
        {
          id: "delivery",
          title: "Delivery charges",
          href: "/checkout",
          sourceType: "delivery",
          content: "Delivery details ".repeat(100),
        },
        {
          id: "returns",
          title: "Return policy",
          href: "/refund-policy",
          sourceType: "policy",
          content: "Returns are accepted within seven days.",
        },
      ],
      "Can I return an item?",
      1,
      40,
    );

    expect(selected).toEqual([
      {
        id: "returns",
        title: "Return policy",
        href: "/refund-policy",
        sourceType: "policy",
        content: "Returns are accepted within seven days.",
      },
    ]);
  });
});

describe("AI advisor catalog content", () => {
  it("converts rich product descriptions to compact text", () => {
    expect(
      productDescriptionText({
        html: "<p>Soft &amp; simple</p><script>ignore()</script><p>Every day</p>",
      }),
    ).toBe("Soft & simple Every day");
  });
});

describe("AI advisor model output", () => {
  it("parses structured recommendations and caps their size", () => {
    const result = parseModelAdvisorResponse(
      JSON.stringify({
        message: "These fit your understated style.",
        status: "recommendations",
        suggestedReplies: ["More colorful", "Lower price"],
        sourceIds: ["shop-page"],
        recommendations: [
          { productId: "one", reason: "A clean everyday option." },
          { productId: "two", reason: "A subtle alternative." },
          { productId: "three", reason: "A versatile third choice." },
          { productId: "four", reason: "Must be dropped." },
        ],
      }),
    );

    expect(result?.recommendations).toHaveLength(3);
    expect(result?.recommendations[0]).toEqual({
      productId: "one",
      reason: "A clean everyday option.",
    });
  });

  it("parses grounded website answers and deduplicates sources", () => {
    expect(
      parseModelAdvisorResponse({
        message: "Returns are accepted within seven days.",
        status: "answer",
        suggestedReplies: [],
        recommendations: [],
        sourceIds: ["returns", "returns", "contact", "terms", "privacy"],
      }),
    ).toEqual({
      message: "Returns are accepted within seven days.",
      status: "answer",
      suggestedReplies: [],
      recommendations: [],
      sourceIds: ["returns", "contact", "terms", "privacy"],
    });
  });

  it("rejects malformed JSON and missing required fields", () => {
    expect(parseModelAdvisorResponse("not json")).toBeNull();
    expect(
      parseModelAdvisorResponse(JSON.stringify({ status: "clarifying" })),
    ).toBeNull();
  });

  it("recovers JSON wrapped in markdown or explanatory text", () => {
    const response = {
      message: "I would start with this one.",
      status: "recommendations",
      suggestedReplies: [],
      recommendations: [
        { productId: "one", reason: "It keeps the look understated." },
      ],
      sourceIds: [],
    };

    expect(
      parseModelAdvisorResponse(
        `\`\`\`json\n${JSON.stringify(response)}\n\`\`\``,
      ),
    ).toEqual(response);
    expect(
      parseModelAdvisorResponse(
        `Here is the result:\n${JSON.stringify(response)}\nThanks`,
      ),
    ).toEqual(response);
  });

  it("accepts provider content parts and already-parsed objects", () => {
    const response = {
      message: "What matters most for this gift?",
      status: "clarifying" as const,
      suggestedReplies: ["The occasion"],
      recommendations: [],
      sourceIds: [],
    };

    expect(parseModelAdvisorResponse(response)).toEqual(response);
    expect(
      parseModelAdvisorResponse([
        { type: "text", text: JSON.stringify(response) },
      ]),
    ).toEqual(response);
  });
});
