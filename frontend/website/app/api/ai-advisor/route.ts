import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildAdvisorSystemPrompt,
  extractMaximumPrice,
  loadAllPages,
  parseAdvisorMessages,
  parseModelAdvisorResponse,
  productDescriptionText,
  selectRelevantCatalog,
  selectRelevantKnowledge,
  type WebsiteKnowledgeDocument,
} from "@/lib/aiAdvisor";
import { requestAdvisorEmbedding } from "@/lib/aiAdvisorEmbeddings";
import { productImageUrl } from "@/utility/imageUrl";
import { getAboutSections } from "@/utility/getAboutSections";
import { getBanners } from "@/utility/getBanners";
import { getCategories } from "@/utility/getCategory";
import { getContentPage } from "@/utility/getContentPage";
import { getHomepageSections } from "@/utility/getHomepageSections";
import { getPromotions } from "@/utility/getPromotion";
import { getReviews } from "@/utility/getReview";
import { getSiteSettings } from "@/utility/getSettings";
import { shippingCostForZone } from "@/lib/delivery";
import type {
  AiAdvisorProduct,
  AiAdvisorResponse,
  AiAdvisorSource,
} from "@/type/aiAdvisorType";

import { config } from "@/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const CATALOG_PAGE_SIZE = 500;

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
  sources: [],
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

async function getCatalogRowsById(productIds: string[]): Promise<CatalogRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(CATALOG_SELECT)
    .eq("status", "active")
    .in("id", productIds);
  if (error) throw error;
  const rows = (data as unknown as CatalogRow[]) ?? [];
  const position = new Map(
    productIds.map((productId, index) => [productId, index]),
  );
  return rows.sort(
    (a, b) =>
      (position.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
      (position.get(b.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

async function getAdvisorCatalogRows(
  shopperContext: string,
  apiKey: string,
): Promise<{ rows: CatalogRow[]; semantic: boolean }> {
  try {
    const queryEmbedding = await requestAdvisorEmbedding(
      shopperContext,
      apiKey,
    );
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("match_product_embeddings", {
      p_query_embedding: queryEmbedding,
      p_max_price: extractMaximumPrice(shopperContext),
      p_match_count: 12,
    });
    if (error)
      throw new Error(`Semantic product search failed (${error.code}).`);
    const productIds = Array.isArray(data)
      ? data.flatMap((item) => {
          const productId = (item as { product_id?: unknown }).product_id;
          return typeof productId === "string" ? [productId] : [];
        })
      : [];
    if (productIds.length > 0) {
      return { rows: await getCatalogRowsById(productIds), semantic: true };
    }
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({
        event: "AI advisor semantic fallback",
        message: error instanceof Error ? error.message : "Unknown error",
      })}\n`,
    );
  }
  return { rows: await getCatalogRows(), semantic: false };
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    message: { type: "string" },
    status: {
      type: "string",
      enum: ["answer", "clarifying", "recommendations", "no_match"],
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
    sourceIds: {
      type: "array",
      items: { type: "string" },
      maxItems: 4,
    },
  },
  required: [
    "message",
    "status",
    "suggestedReplies",
    "recommendations",
    "sourceIds",
  ],
  additionalProperties: false,
} as const;

function uniqueValues(values: (string | null)[]): string[] {
  return [
    ...new Set(values.filter((value): value is string => Boolean(value))),
  ];
}

function knowledgeText(value: unknown, maxLength = 5_000): string {
  const raw = typeof value === "string" ? value : JSON.stringify(value);
  if (!raw) return "";
  return productDescriptionText({ html: raw }, maxLength);
}

function buildWebsiteKnowledge({
  settings,
  policies,
  aboutSections,
  homepageSections,
  banners,
  categories,
  promotions,
  reviews,
}: {
  settings: Awaited<ReturnType<typeof getSiteSettings>>;
  policies: Awaited<ReturnType<typeof getContentPage>>[];
  aboutSections: Awaited<ReturnType<typeof getAboutSections>>;
  homepageSections: Awaited<ReturnType<typeof getHomepageSections>>;
  banners: Awaited<ReturnType<typeof getBanners>>;
  categories: Awaited<ReturnType<typeof getCategories>>;
  promotions: Awaited<ReturnType<typeof getPromotions>>;
  reviews: Awaited<ReturnType<typeof getReviews>>;
}): WebsiteKnowledgeDocument[] {
  const policyRoutes: Record<string, string> = {
    terms: "/terms-of-service",
    privacy: "/privacy-policy",
    refund: "/refund-policy",
    about: "/about-us",
  };
  const publicSocials = Object.fromEntries(
    Object.entries(settings.socials ?? {}).filter(
      ([key, value]) => key !== "_cms" && typeof value === "string" && value,
    ),
  );
  const documents: WebsiteKnowledgeDocument[] = [
    {
      id: "store-details",
      title: "Store and contact details",
      href: "/contact-us",
      sourceType: "store",
      content: knowledgeText({
        storeName: settings.store_name,
        email: settings.contact_email,
        phone: settings.contact_phone,
        address: settings.address,
        currency: settings.currency,
        socialLinks: publicSocials,
        announcement: settings.announcement_active
          ? settings.announcement_text
          : null,
      }),
    },
    {
      id: "delivery-details",
      title: "Delivery charges",
      href: "/checkout",
      sourceType: "delivery",
      content: knowledgeText({
        freeDelivery: settings.deliveryCharges.freeDelivery,
        insideDhaka: shippingCostForZone(
          settings.deliveryCharges,
          "inside-dhaka",
        ),
        outsideDhaka: shippingCostForZone(
          settings.deliveryCharges,
          "outside-dhaka",
        ),
        currency: settings.currency,
      }),
    },
    {
      id: "about-store",
      title: "About the store",
      href: "/about-us",
      sourceType: "about",
      content: knowledgeText(
        aboutSections.map(({ type, title, config }) => ({
          type,
          title,
          config,
        })),
        8_000,
      ),
    },
    {
      id: "homepage",
      title: "Homepage",
      href: "/",
      sourceType: "homepage",
      content: knowledgeText(
        {
          banners: banners.map(({ title, subtitle, ctaLabel, ctaUrl }) => ({
            title,
            subtitle,
            ctaLabel,
            ctaUrl,
          })),
          sections: homepageSections.map(
            ({ type, title, subtitle, body, config }) => ({
              type,
              title,
              subtitle,
              body,
              config,
            }),
          ),
        },
        8_000,
      ),
    },
    {
      id: "shop-page",
      title: "Shop all products",
      href: "/product",
      sourceType: "navigation",
      content:
        "Browse all active products, search the collection, filter by category, and open a product for current options and details.",
    },
    {
      id: "cart-checkout",
      title: "Cart and checkout",
      href: "/cart",
      sourceType: "navigation",
      content:
        "Visitors can review their selected products in the cart and continue to checkout to enter delivery and order details.",
    },
    {
      id: "wishlist",
      title: "Wishlist",
      href: "/wishlist",
      sourceType: "navigation",
      content:
        "Visitors can review products they have saved to their wishlist.",
    },
    {
      id: "track-order",
      title: "Track an order",
      href: "/track-order",
      sourceType: "navigation",
      content:
        "Visitors can use the Track Order page to check an existing order.",
    },
    {
      id: "contact-page",
      title: "Contact the store",
      href: "/contact-us",
      sourceType: "navigation",
      content:
        "Visitors can use the contact page to send the store a message for help that is not answered on the website.",
    },
  ];

  for (const policy of policies) {
    documents.push({
      id: `policy-${policy.slug}`,
      title: policy.title,
      href: policyRoutes[policy.slug] ?? "/",
      sourceType: "policy",
      content: knowledgeText(policy.body_html, 8_000),
    });
  }

  for (const category of categories) {
    documents.push({
      id: `category-${category._id}`,
      title: category.categoryName,
      href: category.isDefault
        ? "/product"
        : `/product?category=${encodeURIComponent(category.categoryUrl.current)}`,
      sourceType: "category",
      content:
        knowledgeText(category.categoryDescription) ||
        `Product category named ${category.categoryName}.`,
    });
  }

  for (const promotion of promotions) {
    documents.push({
      id: `promotion-${promotion._id}`,
      title: promotion.title,
      href: promotion.ctaUrl || "/product",
      sourceType: "promotion",
      content: knowledgeText({
        description: promotion.description,
        discountPercent: promotion.discountPercent,
        action: promotion.ctaLabel,
      }),
    });
  }

  if (reviews.length > 0) {
    documents.push({
      id: "customer-reviews",
      title: "Customer reviews",
      href: "/reviews",
      sourceType: "reviews",
      content: knowledgeText(
        reviews.map(({ customerName, rating, body }) => ({
          customerName,
          rating,
          body,
        })),
        8_000,
      ),
    });
  }

  return documents.filter((document) => document.content.trim());
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = config.openRouter.apiKey;

    if (!config.openRouter.apiKey) {
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

    const shopperContext = messages
      .filter((message) => message.role === "user")
      .slice(-3)
      .map((message) => message.content)
      .join(" ");
    const [
      catalogResult,
      settings,
      terms,
      privacy,
      refund,
      aboutSections,
      homepageSections,
      banners,
      categories,
      promotions,
      reviews,
    ] = await Promise.all([
      getAdvisorCatalogRows(shopperContext, apiKey),
      getSiteSettings(),
      getContentPage("terms"),
      getContentPage("privacy"),
      getContentPage("refund"),
      getAboutSections(),
      getHomepageSections(),
      Promise.all([getBanners("banner"), getBanners("banner_v2")]).then(
        ([v1, v2]) => [...v1, ...v2],
      ),
      getCategories().catch(() => []),
      getPromotions().catch(() => []),
      getReviews().catch(() => []),
    ]);

    const rows = catalogResult.rows.filter((product) =>
      product.product_variants.some((variant) => variant.stock_quantity > 0),
    );
    const storeName = settings.store_name.trim() || "the store";
    const websiteKnowledge = buildWebsiteKnowledge({
      settings,
      policies: [terms, privacy, refund],
      aboutSections,
      homepageSections,
      banners,
      categories,
      promotions,
      reviews,
    });
    const productsById = new Map<string, AiAdvisorProduct>();
    const sourcesById = new Map<string, AiAdvisorSource>(
      websiteKnowledge.map((document) => [
        document.id,
        {
          title: document.title,
          href: document.href,
          sourceType: document.sourceType,
        },
      ]),
    );
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
        description: productDescriptionText(product.description, 220),
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

    const promptCatalog = catalogResult.semantic
      ? catalog.slice(0, 8)
      : selectRelevantCatalog(catalog, shopperContext);
    const promptKnowledge = selectRelevantKnowledge(
      websiteKnowledge,
      shopperContext,
    );
    const priorAssistantTurns = messages.filter(
      (message) => message.role === "assistant",
    ).length;
    const systemPrompt = buildAdvisorSystemPrompt({
      storeName,
      catalog: promptCatalog,
      websiteKnowledge: promptKnowledge,
      priorAssistantTurns,
    });

    const requestCompletion = (model: string, timeoutMs = 20_000) =>
      fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.SITE_URL?.trim() || request.nextUrl.origin,
          "X-OpenRouter-Title": `${storeName} Shopping Assistant`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          temperature: 0.55,
          top_p: 0.9,
          max_tokens: 280,
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
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      });
    let openRouterResponse = await requestCompletion(config.openRouter.model);
    if (openRouterResponse.status === 402) {
      process.stderr.write(
        `${JSON.stringify({
          event: "OpenRouter advisor free-model fallback",
          model: config.openRouter.model,
        })}\n`,
      );
      openRouterResponse = await requestCompletion(
        "liquid/lfm-2.5-2.6b:free",
        30_000,
      );
    }

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
      return NextResponse.json(RESPONSE_RECOVERY);
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
    const sources = modelResult.sourceIds.flatMap((sourceId) => {
      const source = sourcesById.get(sourceId);
      return source ? [source] : [];
    });
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
      sources,
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
