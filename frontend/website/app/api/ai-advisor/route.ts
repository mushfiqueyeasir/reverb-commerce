import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildAdvisorSystemPrompt,
  parseAdvisorMessages,
  parseModelAdvisorResponse,
  productDescriptionText,
  type WebsiteKnowledgeDocument,
} from "@/lib/aiAdvisor";
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

    const supabase = await createSupabaseServerClient();

    const [
      { data, error },
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
    if (error) throw error;

    const rows = ((data as unknown as CatalogRow[]) ?? []).filter((product) =>
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
      websiteKnowledge,
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
        model: config.openRouter.model,
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
