import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildAdvisorSystemPrompt,
  buildInventoryOverview,
  loadAllPages,
  parseAdvisorMessages,
  parseModelAdvisorResponse,
  productDescriptionText,
  selectRelevantCatalog,
} from "@/lib/aiAdvisor";
import {
  getAiSearchApiKey,
  getAiSearchSettings,
  type AiSearchProvider,
} from "@/lib/aiSearchSettings";
import { productImageUrl } from "@/utility/imageUrl";
import type { AiAdvisorProduct, AiAdvisorResponse } from "@/type/aiAdvisorType";
import { config } from "@/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const CATALOG_PAGE_SIZE = 500;
const RELEVANT_PRODUCT_LIMIT = 64;
const GROQ_RELEVANT_PRODUCT_LIMIT = 16;
const PRODUCT_DESCRIPTION_LIMIT = 400;
const GROQ_PRODUCT_DESCRIPTION_LIMIT = 180;
const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    message: { type: "STRING" },
    status: {
      type: "STRING",
      enum: ["answer", "clarifying", "recommendations", "no_match"],
    },
    suggestedReplies: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    recommendations: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          productId: { type: "STRING" },
          reason: { type: "STRING" },
        },
        required: ["productId", "reason"],
      },
    },
  },
  required: ["message", "status", "suggestedReplies", "recommendations"],
} as const;
const OPENROUTER_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    message: { type: "string" },
    status: {
      type: "string",
      enum: ["answer", "clarifying", "recommendations", "no_match"],
    },
    suggestedReplies: {
      type: "array",
      items: { type: "string" },
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          productId: { type: "string" },
          reason: { type: "string" },
        },
        required: ["productId", "reason"],
      },
    },
  },
  required: ["message", "status", "suggestedReplies", "recommendations"],
} as const;

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

interface ProviderResult {
  content: string | null;
  finishReason: string | null;
}

const CATALOG_SELECT = `
  id, title, slug, original_price, current_price, description, product_type,
  product_images ( path, is_main, sort ),
  product_variants ( size, color, stock_quantity ),
  product_categories ( categories ( name, slug ) )
`;

async function getCatalogRows(): Promise<CatalogRow[]> {
  const supabase = await createSupabaseServerClient();
  return loadAllPages<CatalogRow>(async (from, to) => {
    const { data, error } = await supabase
      .from("products")
      .select(CATALOG_SELECT)
      .eq("status", "active")
      .order("id", { ascending: true })
      .range(from, to);
    if (error) throw error;
    return (data as unknown as CatalogRow[]) ?? [];
  }, CATALOG_PAGE_SIZE);
}

function uniqueValues(values: (string | null)[]): string[] {
  return [
    ...new Set(values.filter((value): value is string => Boolean(value))),
  ];
}

async function callGemini(
  apiKey: string,
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
): Promise<ProviderResult> {
  const model = config.aiSearch.models.gemini;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
          responseSchema: GEMINI_RESPONSE_SCHEMA,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    },
  );

  if (!response.ok) {
    const providerError = (await response.json().catch(() => null)) as {
      error?: { code?: string | number; status?: string; message?: string };
    } | null;
    process.stderr.write(
      `${JSON.stringify({
        event: "AI Search provider request failed",
        provider: "gemini",
        status: response.status,
        code: providerError?.error?.code ?? null,
        providerStatus: providerError?.error?.status ?? null,
        message: providerError?.error?.message ?? null,
      })}\n`,
    );
    throw new Error("AI provider request failed");
  }

  const completion = (await response.json()) as {
    candidates?: {
      finishReason?: string;
      content?: { parts?: { text?: unknown }[] };
    }[];
  };
  const candidate = completion.candidates?.[0];
  const content =
    candidate?.content?.parts
      ?.map((part) => part.text)
      .filter((text): text is string => typeof text === "string")
      .join("") || null;
  return {
    content,
    finishReason: candidate?.finishReason ?? null,
  };
}

async function callOpenrouter(
  apiKey: string,
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
): Promise<ProviderResult> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.aiSearch.models.openrouter,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
      max_tokens: 4096,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "shopping_advisor_response",
          strict: true,
          schema: OPENROUTER_RESPONSE_SCHEMA,
        },
      },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    const providerError = (await response.json().catch(() => null)) as {
      error?: { code?: string | number; message?: string };
    } | null;
    process.stderr.write(
      `${JSON.stringify({
        event: "AI Search provider request failed",
        provider: "openrouter",
        status: response.status,
        code: providerError?.error?.code ?? null,
        message: providerError?.error?.message ?? null,
      })}\n`,
    );
    throw new Error("AI provider request failed");
  }

  const completion = (await response.json()) as {
    choices?: {
      finish_reason?: string;
      message?: { content?: unknown };
    }[];
  };
  const choice = completion.choices?.[0];
  const content =
    typeof choice?.message?.content === "string"
      ? choice.message.content
      : null;
  return {
    content,
    finishReason: choice?.finish_reason ?? null,
  };
}

async function callGroq(
  apiKey: string,
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
): Promise<ProviderResult> {
  const groq = new Groq({ apiKey, timeout: 45_000, maxRetries: 0 });
  const recentMessages = messages.slice(-8);
  try {
    const completion = await groq.chat.completions.create({
      model: config.aiSearch.models.groq,
      messages: [
        { role: "system", content: systemPrompt },
        ...recentMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
      max_completion_tokens: 1024,
      temperature: 1,
      top_p: 1,
      reasoning_effort: "low",
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "shopping_advisor_response",
          strict: true,
          schema: OPENROUTER_RESPONSE_SCHEMA,
        },
      },
    });
    const choice = completion.choices[0];
    return {
      content:
        typeof choice?.message?.content === "string"
          ? choice.message.content
          : null,
      finishReason: choice?.finish_reason ?? null,
    };
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({
        event: "AI Search provider request failed",
        provider: "groq",
        status: error instanceof Groq.APIError ? error.status : null,
        message: error instanceof Error ? error.message : "Unknown error",
      })}\n`,
    );
    throw new Error("AI provider request failed");
  }
}

async function callProvider(
  provider: AiSearchProvider,
  apiKey: string,
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
): Promise<ProviderResult> {
  if (provider === "openrouter") {
    return callOpenrouter(apiKey, systemPrompt, messages);
  }
  if (provider === "groq") {
    return callGroq(apiKey, systemPrompt, messages);
  }
  return callGemini(apiKey, systemPrompt, messages);
}

export async function POST(request: NextRequest) {
  try {
    const aiSearchSettings = await getAiSearchSettings();
    const apiKey = getAiSearchApiKey(aiSearchSettings);
    if (!aiSearchSettings.enabled || !apiKey) {
      return NextResponse.json(
        { error: "The shopping advisor is not configured." },
        { status: 503 },
      );
    }

    const body = (await request.json()) as { messages?: unknown };
    const messages = parseAdvisorMessages(body.messages);
    if (!messages) {
      return NextResponse.json(
        { error: "A valid conversation is required." },
        { status: 400 },
      );
    }

    const catalogRows = await getCatalogRows();
    const rows = catalogRows.filter((product) =>
      product.product_variants.some((variant) => variant.stock_quantity > 0),
    );
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
        description: productDescriptionText(
          product.description,
          aiSearchSettings.provider === "groq"
            ? GROQ_PRODUCT_DESCRIPTION_LIMIT
            : PRODUCT_DESCRIPTION_LIMIT,
        ),
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
    const shopperContext = messages
      .filter((message) => message.role === "user")
      .map((message) => message.content)
      .join(" ");
    const inventoryOverview = buildInventoryOverview(catalog);
    const rankedCatalog = selectRelevantCatalog(
      catalog,
      shopperContext,
      aiSearchSettings.provider === "groq"
        ? GROQ_RELEVANT_PRODUCT_LIMIT
        : RELEVANT_PRODUCT_LIMIT,
    );
    const systemPrompt = buildAdvisorSystemPrompt({
      storeName: request.nextUrl.hostname,
      inventoryOverview,
      catalog: rankedCatalog,
    });
    const completion = await callProvider(
      aiSearchSettings.provider,
      apiKey,
      systemPrompt,
      messages,
    );
    const modelResult = parseModelAdvisorResponse(completion.content);
    if (!modelResult) {
      process.stderr.write(
        `${JSON.stringify({
          event: "AI Search provider response could not be parsed",
          provider: aiSearchSettings.provider,
          finishReason: completion.finishReason,
          hasContent: Boolean(completion.content),
        })}\n`,
      );
      return NextResponse.json(
        { error: "The shopping advisor returned an invalid response." },
        { status: 502 },
      );
    }

    const recommendations = modelResult.recommendations.flatMap((item) => {
      const product = productsById.get(item.productId);
      return product ? [{ product, reason: item.reason }] : [];
    });
    const response: AiAdvisorResponse = {
      message: modelResult.message,
      status: modelResult.status,
      suggestedReplies: modelResult.suggestedReplies,
      recommendations,
    };

    return NextResponse.json(response);
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({
        event: "AI advisor request failed",
        message: error instanceof Error ? error.message : "Unknown error",
      })}\n`,
    );
    return NextResponse.json(
      { error: "The shopping advisor could not respond." },
      { status: 503 },
    );
  }
}
