import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildAdvisorSystemPrompt,
  parseAdvisorMessages,
  parseModelAdvisorResponse,
  productDescriptionText,
} from "@/lib/aiAdvisor";
import { productImageUrl } from "@/utility/imageUrl";
import type { AiAdvisorProduct, AiAdvisorResponse } from "@/type/aiAdvisorType";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "google/gemini-2.5-flash";
const CATALOG_LIMIT = 120;

const RESPONSE_RECOVERY: AiAdvisorResponse = {
  message:
    "Let me take another pass—I do not want to bluff and point you at the wrong item. Which should I protect first: your budget, the occasion, or the overall look?",
  status: "clarifying",
  suggestedReplies: [
    "Keep it within my budget",
    "Focus on the occasion",
    "Get the overall look right",
  ],
  recommendations: [],
};

interface CatalogRow {
  id: string;
  title: string;
  slug: string;
  original_price: number;
  current_price: number;
  description: unknown;
  product_type: string | null;
  product_images: {
    path: string;
    is_main: boolean;
    sort: number;
  }[];
  product_variants: {
    size: string | null;
    color: string | null;
    stock_quantity: number;
  }[];
  product_categories: {
    categories: { name: string; slug: string } | null;
  }[];
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    message: { type: "string" },
    status: {
      type: "string",
      enum: ["clarifying", "recommendations", "no_match"],
    },
    suggestedReplies: {
      type: "array",
      items: { type: "string" },
      maxItems: 4,
    },
    recommendations: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          productId: { type: "string" },
          reason: { type: "string" },
        },
        required: ["productId", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["message", "status", "suggestedReplies", "recommendations"],
  additionalProperties: false,
} as const;

function uniqueValues(values: (string | null)[]): string[] {
  return [
    ...new Set(values.filter((value): value is string => Boolean(value))),
  ];
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "I am not ready to check the collection just yet. Please try me again shortly.",
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as { messages?: unknown };
    const messages = parseAdvisorMessages(body.messages);
    if (!messages) {
      return NextResponse.json(
        { error: "The conversation is missing or too long." },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();

    const [{ data, error }, settingsResult] = await Promise.all([
      supabase
        .from("products")
        .select(
          `
            id, title, slug, original_price, current_price, description, product_type,
            product_images ( path, is_main, sort ),
            product_variants ( size, color, stock_quantity ),
            product_categories ( categories ( name, slug ) )
          `,
        )
        .eq("status", "active")
        .limit(CATALOG_LIMIT),
      supabase
        .from("site_settings")
        .select("store_name")
        .eq("id", 1)
        .maybeSingle(),
    ]);
    if (error) throw error;

    const rows = ((data as unknown as CatalogRow[]) ?? []).filter((product) =>
      product.product_variants.some((variant) => variant.stock_quantity > 0),
    );
    if (!rows.length) {
      const response: AiAdvisorResponse = {
        message:
          "I do not want to steer you toward something unavailable. There is nothing in stock that I can recommend right now, but it is worth checking back when the collection refreshes.",
        status: "no_match",
        suggestedReplies: [],
        recommendations: [],
      };
      return NextResponse.json(response);
    }

    const storeName =
      (settingsResult.data?.store_name as string | undefined)?.trim() ||
      "the store";
    const productsById = new Map<string, AiAdvisorProduct>();
    const catalog = rows.map((product) => {
      const images = [...product.product_images].sort(
        (a, b) => a.sort - b.sort,
      );
      const mainImage = images.find((image) => image.is_main) ?? images[0];
      productsById.set(product.id, {
        id: product.id,
        title: product.title,
        href: `/product/${product.slug}`,
        image: productImageUrl(mainImage?.path) ?? "",
        currentPrice: Number(product.current_price),
        originalPrice: Number(product.original_price),
      });

      return {
        id: product.id,
        title: product.title,
        type: product.product_type,
        price: Number(product.current_price),
        description: productDescriptionText(product.description),
        categories: uniqueValues(
          product.product_categories.map((row) => row.categories?.name ?? null),
        ),
        availableColors: uniqueValues(
          product.product_variants
            .filter((variant) => variant.stock_quantity > 0)
            .map((variant) => variant.color),
        ),
        availableSizes: uniqueValues(
          product.product_variants
            .filter((variant) => variant.stock_quantity > 0)
            .map((variant) => variant.size),
        ),
      };
    });

    const priorAssistantTurns = messages.filter(
      (message) => message.role === "assistant",
    ).length;
    const systemPrompt = buildAdvisorSystemPrompt({
      storeName,
      catalog,
      priorAssistantTurns,
    });

    const openRouterResponse = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL?.trim() || request.nextUrl.origin,
        "X-OpenRouter-Title": `${storeName} Shopping Assistant`,
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.55,
        top_p: 0.9,
        max_tokens: 700,
        provider: {
          require_parameters: true,
          data_collection: "deny",
        },
        plugins: [{ id: "response-healing" }],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "shopping_advisor_response",
            strict: true,
            schema: RESPONSE_SCHEMA,
          },
        },
      }),
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });

    if (!openRouterResponse.ok) {
      return NextResponse.json(
        {
          error:
            "I am having trouble reaching the collection right now. Give me a moment, then send that once more.",
        },
        { status: 503 },
      );
    }

    const completion = (await openRouterResponse.json()) as {
      choices?: { message?: { content?: unknown } }[];
    };
    const modelResult = parseModelAdvisorResponse(
      completion.choices?.[0]?.message?.content,
    );
    if (!modelResult) {
      // eslint-disable-next-line no-console
      console.warn("AI advisor response could not be parsed");
      return NextResponse.json(RESPONSE_RECOVERY);
    }

    const recommendations = modelResult.recommendations.flatMap((item) => {
      const product = productsById.get(item.productId);
      return product ? [{ product, reason: item.reason }] : [];
    });
    const hasRecommendations = recommendations.length > 0;
    const response: AiAdvisorResponse = {
      message:
        modelResult.status === "recommendations" && !hasRecommendations
          ? "That pick slipped out of the live inventory, so I would not send you toward it. Give me one more preference and I will find a better option."
          : modelResult.message,
      status:
        modelResult.status === "recommendations" && !hasRecommendations
          ? "no_match"
          : modelResult.status,
      suggestedReplies: modelResult.suggestedReplies,
      recommendations,
    };

    return NextResponse.json(response);
  } catch (error) {
    // Keep provider, quota, and catalog internals out of public responses.
    // eslint-disable-next-line no-console
    console.error("AI advisor request failed", error);
    return NextResponse.json(
      {
        error:
          "I lost the connection while checking the collection. Your last note is still useful—send it once more and I will pick it up from there.",
      },
      { status: 503 },
    );
  }
}
