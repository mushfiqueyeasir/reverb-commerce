import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildAdvisorSystemPrompt,
  loadAllPages,
  parseAdvisorMessages,
  parseModelAdvisorResponse,
  productDescriptionText,
  selectRelevantCatalog,
} from "@/lib/aiAdvisor";
import { productImageUrl } from "@/utility/imageUrl";
import type { AiAdvisorProduct, AiAdvisorResponse } from "@/type/aiAdvisorType";
import { config } from "@/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const CATALOG_PAGE_SIZE = 500;

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

export async function POST(request: NextRequest) {
  try {
    const apiKey = config.openRouter.apiKey;
    if (!apiKey) {
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
          Number.MAX_SAFE_INTEGER,
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
    const rankedCatalog = selectRelevantCatalog(
      catalog,
      shopperContext,
      catalog.length,
    );
    const systemPrompt = buildAdvisorSystemPrompt({
      storeName: request.nextUrl.hostname,
      catalog: rankedCatalog,
    });
    const openRouterResponse = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL?.trim() || request.nextUrl.origin,
        "X-OpenRouter-Title": `${request.nextUrl.hostname} Shopping Advisor`,
      },
      body: JSON.stringify({
        model: config.openRouter.model,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
      cache: "no-store",
    });

    if (!openRouterResponse.ok) {
      const providerError = (await openRouterResponse
        .json()
        .catch(() => null)) as {
        error?: { code?: string | number; message?: string };
      } | null;
      process.stderr.write(
        `${JSON.stringify({
          event: "OpenRouter advisor request failed",
          status: openRouterResponse.status,
          code: providerError?.error?.code ?? null,
          message: providerError?.error?.message ?? null,
        })}\n`,
      );
      return NextResponse.json(
        { error: "The shopping advisor could not respond." },
        { status: 502 },
      );
    }

    const completion = (await openRouterResponse.json()) as {
      choices?: { message?: { content?: unknown } }[];
    };
    const modelResult = parseModelAdvisorResponse(
      completion.choices?.[0]?.message?.content,
    );
    if (!modelResult) {
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
