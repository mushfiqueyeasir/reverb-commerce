import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadClient,
  parseArguments,
  parseEnvFile,
  repositoryRoot,
} from "./client-registry.mjs";
import {
  maskSecret,
  requestJson,
  responseRows,
  sqlLiteral,
} from "./provisioning-core.mjs";

const SUPABASE_API = "https://api.supabase.com";
export const MINICO_CLIENT_ID = "minicobd";
export const MINICO_PROJECT_REF = "mvbzrkamyehnrfssanye";
export const FACEBOOK_URL = "https://www.facebook.com/minico11";
export const INSTAGRAM_URL = "https://www.instagram.com/minico.bd";
export const MIGRATION_KEY = "minicobd-home-about-volt-gear-v1";
export const THEME_KEY = "volt-gear";
export const THEME_SCHEMA_VERSION = 1;
export const THEME_VERSION = 1;
export const THEME_MANIFEST = { id: THEME_KEY, version: THEME_VERSION };
export const THEME_TOKEN_OVERRIDES = {
  palette: { primary: "#660c23" },
};
export const THEME_RESOLVED_TOKENS = {
  palette: {
    primary: "#660c23",
    primaryForeground: "#fff7f8",
    background: "#080406",
    surface: "#130b0e",
    card: "#1a0f13",
    foreground: "#f6efed",
    mutedForeground: "#a08f90",
    border: "#2f1f24",
  },
  shape: {
    radius: {
      sm: "0px",
      md: "0px",
      lg: "0px",
      xl: "0px",
      "2xl": "0px",
      "3xl": "0px",
      full: "9999px",
    },
  },
};
export const ASSET_PREFIX = "minicobd/v1";
export const THEME_CONTENT_REFERENCES = {
  navbar: {
    relation: "site_settings",
    selector: { id: 1 },
    path: ["socials", "_cms", "navbar"],
  },
  footer: {
    relation: "site_settings",
    selector: { id: 1 },
    path: ["socials", "_cms", "footer"],
  },
  homepage: {
    relation: "homepage_sections",
    orderBy: ["sort", "created_at"],
  },
  about: {
    relation: "site_settings",
    selector: { id: 1 },
    path: ["socials", "_cms", "about_sections"],
  },
};
export const THEME_DESIGN_CONFIG = {
  schemaVersion: THEME_SCHEMA_VERSION,
  themeId: THEME_KEY,
  themeVersion: THEME_VERSION,
  tokenOverrides: THEME_TOKEN_OVERRIDES,
  resolvedTokens: THEME_RESOLVED_TOKENS,
  contentReferences: THEME_CONTENT_REFERENCES,
};
export const TEMPLATE_PROMOTION_ID = "70000000-0000-4000-8000-000000000001";

export const CATEGORIES = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    name: "Mobile Covers",
    slug: "mobile-covers",
    description: "Trendy mobile covers, cases, and phone accessories.",
    image_path: `${ASSET_PREFIX}/mobile-covers.jpg`,
    sort: 1,
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    name: "Accessories",
    slug: "accessories",
    description: "Cute everyday accessories for every outfit.",
    image_path: `${ASSET_PREFIX}/accessories.jpg`,
    sort: 2,
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    name: "Lifestyle Essentials",
    slug: "lifestyle-essentials",
    description: "Everyday lifestyle essentials that make life easier.",
    image_path: `${ASSET_PREFIX}/lifestyle.jpg`,
    sort: 3,
  },
];

const HERO_DESKTOP = `${ASSET_PREFIX}/hero-desktop.jpg`;
const HERO_MOBILE = `${ASSET_PREFIX}/hero-mobile.jpg`;
const OG_IMAGE = `${ASSET_PREFIX}/og-image.jpg`;

export const CATEGORY_IDS = CATEGORIES.map((category) => category.id);
export const HOMEPAGE_TYPES = [
  "banner",
  "categories",
  "deals",
  "new_arrivals",
  "featured",
  "richtext",
  "reviews",
  "promo",
  "guarantees",
  "studio_notes",
  "banner_v2",
  "categories_v2",
  "featured_v2",
  "reviews_v2",
  "promo_v2",
  "richtext_v2",
  "ai_search",
];
export const ABOUT_TYPES = [
  "hero",
  "stats",
  "story",
  "values",
  "craft",
  "cta",
  "hero_v2",
  "stats_v2",
  "story_v2",
  "values_v2",
  "craft_v2",
  "cta_v2",
];
export const BANNER_PATHS = [HERO_DESKTOP, HERO_MOBILE, OG_IMAGE];
const EPOCH = "1970-01-01T00:00:00.000Z";

export const MINICO_BANNER_LABELS = {
  edit_label: "MiniCo edit",
  footer_note: "Built to last · Everyday style",
  image_badge: "The new drop",
  carousel_role_description: "carousel",
  carousel_announcement_template: "Slide {current} of {total}: {title}",
  pause_label: "Pause slide rotation",
  resume_label: "Resume slide rotation",
  previous_label: "Previous collection",
  next_label: "Next collection",
};
export const MINICO_PRODUCT_LABELS = {
  sold_out_badge: "Sold out",
  special_price_badge: "Special price",
  default_badge: "New drop",
  product_list_label: "Featured products",
  uncategorized_label_template: "Look {number}",
};
export const MINICO_REVIEW_LABELS = {
  customer_fallback: "Verified customer",
  body_fallback: "A piece that keeps up with everyday life.",
  item_label_template: "Note {number}",
  verified_label: "Verified review",
  rating_aria_template: "{rating} out of {maximum} stars",
};
export const MINICO_PROMO_LABELS = {
  kicker: "This week’s pick",
  limited_label: "Limited drop",
  discount_suffix: "off",
  image_eyebrow: "Now in stock",
  image_title: "Made for everyday",
  cta_fallback_label: "Shop the drop",
};

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

function homepageRow(
  id,
  type,
  title,
  subtitle,
  body,
  sort,
  config,
  active = !type.endsWith("_v2"),
) {
  return {
    id,
    type,
    title,
    subtitle,
    body,
    sort,
    active,
    config,
    created_at: EPOCH,
    updated_at: EPOCH,
  };
}

function aboutRow(id, type, title, sort, config) {
  return {
    id,
    type,
    title,
    sort,
    active: !type.endsWith("_v2"),
    config,
    created_at: EPOCH,
    updated_at: EPOCH,
  };
}

export function buildHomepageSections() {
  return [
    homepageRow(
      "60000000-0000-4000-8000-000000000001",
      "banner",
      null,
      null,
      null,
      0,
      {
        description:
          "MiniCo is a Dhaka-based Facebook destination for mobile covers, chargers, and everyday gadget accessories in Bangladesh.",
        ...MINICO_BANNER_LABELS,
        show_marquee: true,
        stats: [
          { label: "Facebook likes", value: "7K+" },
          { label: "Public snapshot", value: "157 talking" },
          { label: "Based in", value: "Dhaka" },
          { label: "Focus", value: "Everyday gadgets" },
        ],
        marquee_items: [
          "TRENDY MOBILE COVERS",
          "CHARGERS & GADGETS",
          "EVERYDAY ACCESSORIES",
          "PREMIUM & DURABLE",
        ],
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000002",
      "categories",
      "Shop MiniCo by Category",
      "Explore MiniCo's covers, chargers, and everyday gadget selection",
      null,
      1,
      {
        eyebrow: "Find your gear",
        category_ids: [...CATEGORY_IDS],
        limit: 5,
        cta_label: "View all products",
        cta_url: "/product",
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000013",
      "deals",
      "Today's Best Deals",
      "Save on MiniCo covers and accessories",
      null,
      2,
      {
        eyebrow: "Special savings",
        limit: 10,
        ...MINICO_PRODUCT_LABELS,
        cta_label: "View all products",
        cta_url: "/product",
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000014",
      "new_arrivals",
      "New Arrival Products",
      "Fresh additions to MiniCo's gadget collection",
      null,
      3,
      {
        eyebrow: "Just arrived",
        limit: 10,
        ...MINICO_PRODUCT_LABELS,
        cta_label: "View all products",
        cta_url: "/product",
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000003",
      "featured",
      "Featured Products",
      "MiniCo picks built for everyday use",
      null,
      4,
      {
        eyebrow: "Selected by MiniCo",
        limit: 10,
        ...MINICO_PRODUCT_LABELS,
        cta_label: "View all products",
        cta_url: "/product",
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000005",
      "reviews",
      "From a MiniCo Customer",
      "Published feedback from the MiniCo community",
      null,
      6,
      {
        eyebrow: "Customer review",
        limit: 12,
        ...MINICO_REVIEW_LABELS,
        cta_label: "Read reviews",
        cta_url: "/reviews",
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000004",
      "promo",
      "Discover the Featured Collection",
      "Everyday covers and gadget accessories from MiniCo",
      null,
      7,
      {
        promotion_id: TEMPLATE_PROMOTION_ID,
        cta_label: "Explore the collection",
        cta_url: "/product",
        image_path: `${ASSET_PREFIX}/accessories.jpg`,
        image_alt: "Everyday gadget accessories from MiniCo",
        ...MINICO_PROMO_LABELS,
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000015",
      "guarantees",
      null,
      null,
      null,
      8,
      {
        accessible_label: "Shopping guarantees",
        items: [
          {
            title: "Sturdy protection",
            body: "Covers and cases made to keep up with your device.",
          },
          {
            title: "Secure checkout",
            body: "A simple and protected shopping experience.",
          },
          {
            title: "Here to help",
            body: "Friendly support before and after your order.",
          },
        ],
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000016",
      "studio_notes",
      "New drops, gadget finds, and everyday carry essentials.",
      "Join our list to hear about fresh arrivals and special collections.",
      null,
      9,
      {
        eyebrow: "Notes from the store",
        cta_label: "Join our list",
        cta_url: "/contact-us",
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000006",
      "richtext",
      "Your Everyday Gadget Destination",
      "MiniCo in Dhaka",
      "<p>MiniCo is a Dhaka Facebook page and an everyday gadget destination serving customers across Bangladesh. Follow the page for product updates and explore trendy mobile covers, chargers, and everyday accessories.</p>",
      5,
      {
        image_path: OG_IMAGE,
        image_bucket: "branding",
        layout: "feature",
        eyebrow: "About MiniCo",
        cta_label: "Visit MiniCo on Facebook",
        cta_url: FACEBOOK_URL,
        image_alt: "Everyday gadget accessories presented by MiniCo",
        image_label: "MiniCo style",
        image_value: "Everyday essentials",
        image_tag: "// DHAKA",
        copy_label: "MiniCo story",
        cards_label: "Public page snapshot",
        cards: [
          {
            id: "facebook-likes",
            icon: "sparkles",
            label: "7K+ likes",
            detail: "Public Facebook snapshot",
          },
          {
            id: "facebook-talking",
            icon: "zap",
            label: "157 talking",
            detail: "Public Facebook snapshot",
          },
        ],
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000007",
      "banner_v2",
      null,
      null,
      null,
      10,
      {
        description:
          "Meet MiniCo's trendy mobile covers, chargers, and everyday gadget accessories in Bangladesh.",
        ...MINICO_BANNER_LABELS,
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000008",
      "categories_v2",
      "Explore the MiniCo Collection",
      "Three ways to gear up your everyday carry",
      null,
      11,
      {
        eyebrow: "Premium & durable",
        category_ids: [...CATEGORY_IDS],
        limit: 4,
        cta_label: "Browse all products",
        cta_url: "/product",
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000009",
      "featured_v2",
      "Everyday Gear, Featured",
      "Six MiniCo picks for covers and everyday gadgets",
      null,
      12,
      {
        eyebrow: "Selected by MiniCo",
        limit: 6,
        ...MINICO_PRODUCT_LABELS,
        cta_label: "Shop the collection",
        cta_url: "/product",
      },
      false,
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000010",
      "reviews_v2",
      "MiniCo Customer Voice",
      "A published review from the community",
      null,
      13,
      {
        eyebrow: "Community snapshot",
        limit: 12,
        ...MINICO_REVIEW_LABELS,
        cta_label: "See customer feedback",
        cta_url: "/reviews",
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000011",
      "promo_v2",
      "MiniCo's Featured Collection",
      "Everyday covers and accessories for everyday life",
      null,
      14,
      {
        promotion_id: TEMPLATE_PROMOTION_ID,
        cta_label: "Discover featured products",
        cta_url: "/product",
        image_path: `${ASSET_PREFIX}/accessories.jpg`,
        image_alt: "Everyday gadget accessories from MiniCo",
        ...MINICO_PROMO_LABELS,
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000012",
      "richtext_v2",
      "MiniCo, Dhaka",
      "Everyday gadgets for Bangladesh",
      "<p>Discover trendy mobile covers and everyday gadget accessories through MiniCo, a Dhaka-based Facebook page focused on everyday carry. Its public page snapshot records 7,231 likes and 157 people talking about the page.</p>",
      15,
      {
        image_path: OG_IMAGE,
        image_bucket: "branding",
        layout: "feature",
        eyebrow: "Public Facebook snapshot",
        cta_label: "Follow MiniCo on Facebook",
        cta_url: FACEBOOK_URL,
        image_alt: "Everyday gadget collection presented by MiniCo",
        image_label: "MiniCo editorial",
        image_value: "Premium & durable",
        image_tag: "// DHAKA",
        copy_label: "Public page profile",
        cards_label: "Community snapshot",
        cards: [
          {
            id: "facebook-likes-v2",
            icon: "sparkles",
            label: "7,231 likes",
            detail: "Public Facebook snapshot",
          },
          {
            id: "facebook-talking-v2",
            icon: "zap",
            label: "157 talking",
            detail: "Public Facebook snapshot",
          },
        ],
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000017",
      "ai_search",
      "Find your next favourite, faster.",
      "Describe the kind of cover or gadget you are looking for and the AI shopping advisor will suggest the right match from the active collection.",
      null,
      16,
      {
        eyebrow: "New · AI shopping advisor",
        pill_label: "New",
        cta_label: "Ask the AI advisor",
        image_alt: "AI shopping advisor",
        image_path: null,
      },
    ),
  ].sort((left, right) => left.sort - right.sort);
}

export function buildBanners() {
  const copy = [
    {
      title: "Trendy Mobile Covers",
      subtitle: "Protection and style for your everyday device",
      cta_label: "Shop covers",
    },
    {
      title: "Chargers & Gadget Accessories",
      subtitle: "Keep your gear powered and ready in Bangladesh",
      cta_label: "Explore gadgets",
    },
    {
      title: "MiniCo Style in Dhaka",
      subtitle: "Follow a community of 7K+ Facebook likes",
      cta_label: "Discover MiniCo",
    },
  ];
  return ["banner", "banner_v2"].flatMap((sectionType, versionIndex) =>
    copy.map((item, index) => ({
      id: `51000000-0000-4000-8000-${String(versionIndex * 3 + index + 1).padStart(12, "0")}`,
      section_type: sectionType,
      ...item,
      image_path: BANNER_PATHS[index],
      mobile_image_path: null,
      cta_url: "/product",
      sort: index,
      active: true,
      starts_at: null,
      ends_at: null,
      created_at: EPOCH,
      updated_at: EPOCH,
    })),
  );
}

function sharedAboutConfig(version) {
  const suffix = version === 2 ? "_v2" : "";
  return [
    aboutRow(
      `about-hero${version === 2 ? "-v2" : ""}`,
      `hero${suffix}`,
      version === 2 ? "MiniCo manifesto" : "MiniCo introduction",
      version === 2 ? 6 : 0,
      {
        eyebrow: version === 2 ? "MiniCo / Dhaka" : "About MiniCo",
        headline_line1:
          version === 2 ? "Premium gadgets." : "Everyday gadget gear.",
        headline_line2:
          version === 2 ? "Built to last." : "Made for everyday carry.",
        subtitle:
          "MiniCo is a Dhaka-based Facebook page and everyday gadget destination for customers in Bangladesh.",
        accessible_label:
          version === 2 ? "MiniCo manifesto" : "MiniCo introduction",
        image_alt:
          version === 2
            ? "MiniCo everyday gadget collection in Dhaka"
            : "Mobile covers and gadget accessories selected by MiniCo",
        cta_primary_label: "Shop products",
        cta_primary_url: "/product",
        cta_secondary_label: "Visit Facebook",
        cta_secondary_url: FACEBOOK_URL,
        image_path: BANNER_PATHS[version === 2 ? 2 : 0],
        image_bucket: "banner",
      },
    ),
    aboutRow(
      `about-stats${version === 2 ? "-v2" : ""}`,
      `stats${suffix}`,
      version === 2 ? "MiniCo signals" : "MiniCo snapshot",
      version === 2 ? 7 : 1,
      {
        accessible_label: version === 2 ? "MiniCo signals" : "MiniCo snapshot",
        items: [
          { label: "Facebook likes · public snapshot", value: "7K+" },
          { label: "Talking about this · snapshot", value: "157" },
          { label: "Based in", value: "Dhaka" },
          { label: "Serving", value: "Bangladesh" },
        ],
      },
    ),
    aboutRow(
      `about-story${version === 2 ? "-v2" : ""}`,
      `story${suffix}`,
      version === 2 ? "MiniCo editorial" : "MiniCo story",
      version === 2 ? 8 : 2,
      {
        eyebrow: version === 2 ? "An everyday destination" : "Meet MiniCo",
        title:
          version === 2
            ? "Everyday gear, made easier to explore."
            : "An everyday gadget destination in Bangladesh.",
        body_html:
          "<p>MiniCo brings trendy mobile covers, chargers, and everyday gadget accessories into one approachable collection for shoppers in Bangladesh.</p><p>The brand's Dhaka-based Facebook page shares products and everyday carry inspiration with its community.</p>",
        extra:
          "The public Facebook snapshot records 7,231 likes and 157 people talking about the page.",
        accessible_label: version === 2 ? "MiniCo editorial" : "MiniCo story",
        image_alt:
          version === 2
            ? "MiniCo everyday gadget editorial"
            : "Everyday covers and gadget accessories presented by MiniCo",
        image_path: BANNER_PATHS[version === 2 ? 0 : 1],
        image_bucket: "banner",
      },
    ),
    aboutRow(
      `about-values${version === 2 ? "-v2" : ""}`,
      `values${suffix}`,
      version === 2 ? "MiniCo principles" : "What MiniCo offers",
      version === 2 ? 9 : 3,
      {
        eyebrow: version === 2 ? "The MiniCo approach" : "What matters",
        title:
          version === 2
            ? "Reliable gear for everyday life."
            : "Premium, durable, and made just for you.",
        accessible_label:
          version === 2 ? "MiniCo principles" : "What MiniCo offers",
        items: [
          {
            title: "Trendy mobile covers",
            body: "Stylish covers and cases for your everyday device.",
          },
          {
            title: "Chargers & gadgets",
            body: "Accessories that keep your gear powered and ready.",
          },
          {
            title: "Bangladesh destination",
            body: "A Dhaka-based page helping customers explore everyday carry.",
          },
        ],
      },
    ),
    aboutRow(
      `about-craft${version === 2 ? "-v2" : ""}`,
      `craft${suffix}`,
      version === 2 ? "MiniCo profile study" : "MiniCo collection focus",
      version === 2 ? 10 : 4,
      {
        eyebrow: version === 2 ? "Collection blueprint" : "The MiniCo focus",
        title_line1: version === 2 ? "Everyday gear," : "Premium covers,",
        title_line2:
          version === 2 ? "built to last." : "reliable everyday picks.",
        body: "MiniCo focuses on trendy mobile covers, chargers, and everyday gadget accessories for customers in Bangladesh.",
        accessible_label:
          version === 2 ? "MiniCo profile study" : "MiniCo collection focus",
        image_alt: "MiniCo Facebook profile",
        image_path: OG_IMAGE,
        image_bucket: "branding",
        fabric_label: "Facebook page",
        fabric_value: "MiniCo.",
        fabric_tag: "// DHAKA",
        items: [
          { icon: "Zap", label: "Mobile covers", sub: "Trendy everyday" },
          { icon: "Layers", label: "Chargers", sub: "Power your gear" },
          { icon: "Award", label: "Premium", sub: "Built to last" },
          { icon: "Sparkles", label: "Discovery", sub: "Product updates" },
          {
            icon: "Zap",
            label: "Community",
            sub: "7K+ followers",
          },
          { icon: "Layers", label: "Location", sub: "Dhaka, Bangladesh" },
        ],
      },
    ),
    aboutRow(
      `about-cta${version === 2 ? "-v2" : ""}`,
      `cta${suffix}`,
      version === 2 ? "Explore with MiniCo" : "Connect with MiniCo",
      version === 2 ? 11 : 5,
      {
        eyebrow: version === 2 ? "Continue with MiniCo" : "MiniCo community",
        title:
          version === 2
            ? "Make everyday gear part of your routine."
            : "Explore premium everyday essentials.",
        body: "Browse MiniCo's covers and gadget collection, or visit the public Facebook page for updates from Dhaka.",
        accessible_label:
          version === 2 ? "Explore with MiniCo" : "Connect with MiniCo",
        cta_primary_label: "Explore products",
        cta_primary_url: "/product",
        cta_secondary_label: "Visit Facebook",
        cta_secondary_url: FACEBOOK_URL,
      },
    ),
  ];
}

export function buildAboutSections() {
  return [...sharedAboutConfig(1), ...sharedAboutConfig(2)];
}

export function buildPromotion() {
  return {
    id: TEMPLATE_PROMOTION_ID,
    title: "MiniCo Featured Collection",
    description:
      "Explore trendy mobile covers and everyday gadget accessories selected for the MiniCo collection.",
    image_path: null,
    discount_percent: null,
    active: true,
    starts_at: null,
    ends_at: null,
    cta_url: "/product",
    cta_label: "Explore the collection",
  };
}

export function buildSiteSettingsPatch() {
  return {
    store_name: "MiniCo.",
    currency: "BDT",
    currency_symbol: "৳",
    contact_email: "support@minicobd.com",
    contact_phone: null,
    address: "Dhaka, Bangladesh",
    announcement_text: "Free delivery across Bangladesh on orders over ৳1,000",
    announcement_active: true,
    announcement_url: "/product",
    socials: {
      facebook: FACEBOOK_URL,
      instagram: INSTAGRAM_URL,
      _cms: {
        pages: {
          about: {
            slug: "about",
            title: "About MiniCo.",
            body_html:
              "<p>MiniCo is a Dhaka-based Facebook page and everyday gadget destination bringing trendy mobile covers, chargers, and everyday accessories to customers across Bangladesh. Premium, durable, and made just for you.</p>",
            updated_at: EPOCH,
          },
          terms: {
            slug: "terms",
            title: "Terms of Service",
            body_html:
              "<p>Placeholder terms only. Replace with terms reviewed for the merchant and selling regions before launch.</p>",
            updated_at: EPOCH,
          },
          refund: {
            slug: "refund",
            title: "Shipping & Returns",
            body_html:
              "<p>Placeholder shipping and returns policy. Add the merchant's actual timeframes, costs, and eligibility rules before launch.</p>",
            updated_at: EPOCH,
          },
          privacy: {
            slug: "privacy",
            title: "Privacy Policy",
            body_html:
              "<p>Placeholder privacy notice only. Describe actual data handling practices before launch.</p>",
            updated_at: EPOCH,
          },
        },
        announcement: {
          text: "Free delivery across Bangladesh on orders over ৳1,000",
          active: true,
          url: "/product",
        },
        currencies: {
          default: "BDT",
          enabled: ["BDT"],
        },
        deliveryCharges: {
          insideDhaka: 80,
          outsideDhaka: 120,
          freeDelivery: false,
        },
        chatWidgets: {
          provider: "none",
          whatsappNumber: "",
          messengerPageId: "",
        },
        pages_seo: {
          home: {
            title: "MiniCo. | Mobile Covers & Gadget Accessories",
            description:
              "Shop trendy mobile covers, chargers, and everyday gadget accessories from MiniCo., your Dhaka-based gear destination.",
            keywords:
              "MiniCo, mobile covers, gadget accessories, chargers, Bangladesh",
            og_image_path: OG_IMAGE,
          },
          about: {
            title: "About | MiniCo.",
            description:
              "Learn about MiniCo., a Dhaka-based destination for trendy mobile covers, chargers, and everyday gadget accessories.",
            keywords: "MiniCo, about, mobile covers, gadget accessories",
            og_image_path: OG_IMAGE,
          },
          product: {
            title: "Shop | MiniCo.",
            description:
              "Explore MiniCo's collection of trendy mobile covers, chargers, and everyday gadget accessories.",
            keywords: "MiniCo, shop, mobile covers, gadget accessories",
            og_image_path: OG_IMAGE,
          },
          contact: {
            title: "Contact | MiniCo.",
            description:
              "Get in touch with MiniCo. for customer support, inquiries, or feedback.",
            keywords: "MiniCo, contact, support",
            og_image_path: OG_IMAGE,
          },
          reviews: {
            title: "Reviews | MiniCo.",
            description:
              "Read customer reviews for MiniCo.'s cute accessories and lifestyle essentials.",
            keywords: "MiniCo, reviews, testimonials",
            og_image_path: OG_IMAGE,
          },
          cart: {
            title: "Cart | MiniCo.",
            description: "Review products in your shopping cart.",
            keywords: "MiniCo, cart",
            og_image_path: OG_IMAGE,
          },
          wishlist: {
            title: "Favorites | MiniCo.",
            description: "Review your saved products.",
            keywords: "MiniCo, favorites",
            og_image_path: OG_IMAGE,
          },
          checkout: {
            title: "Checkout | MiniCo.",
            description: "Complete your order securely.",
            keywords: "MiniCo, checkout",
            og_image_path: OG_IMAGE,
          },
          track: {
            title: "Track Order | MiniCo.",
            description: "Track an order from MiniCo.",
            keywords: "MiniCo, track order",
            og_image_path: OG_IMAGE,
          },
          privacy: {
            title: "Privacy Policy | MiniCo.",
            description: "Read the store privacy policy.",
            keywords: "MiniCo, privacy",
            og_image_path: OG_IMAGE,
          },
          terms: {
            title: "Terms | MiniCo.",
            description: "Read the store terms of service.",
            keywords: "MiniCo, terms",
            og_image_path: OG_IMAGE,
          },
          refund: {
            title: "Shipping & Returns | MiniCo.",
            description: "Read the store shipping and returns policy.",
            keywords: "MiniCo, shipping, returns",
            og_image_path: OG_IMAGE,
          },
        },
        navbar: {
          variant: "classic",
          items: [
            {
              id: "categories",
              kind: "categories",
              label: "Shop",
              href: "/product",
            },
            {
              id: "about",
              kind: "link",
              label: "About",
              href: "/about-us",
            },
            {
              id: "reviews",
              kind: "link",
              label: "Reviews",
              href: "/reviews",
            },
            {
              id: "contact",
              kind: "link",
              label: "Contact",
              href: "/contact-us",
            },
          ],
          announcement: {
            text: "Free delivery across Bangladesh on orders over ৳1,000",
            active: true,
            url: "/product",
          },
        },
        footer: {
          variant: "classic",
          description:
            "Trendy mobile covers, chargers, and everyday gadget accessories from MiniCo.",
          columns: [
            {
              id: "shop",
              title: "Shop",
              links: [
                { id: "all-products", label: "All products", href: "/product" },
                { id: "favorites", label: "Favorites", href: "/wishlist" },
                { id: "cart", label: "Cart", href: "/cart" },
              ],
            },
            {
              id: "support",
              title: "Support",
              links: [
                {
                  id: "track-order",
                  label: "Track order",
                  href: "/track-order",
                },
                {
                  id: "shipping-returns",
                  label: "Shipping & returns",
                  href: "/refund-policy",
                },
                { id: "contact", label: "Contact", href: "/contact-us" },
              ],
            },
            {
              id: "brand",
              title: "Brand",
              links: [
                { id: "about", label: "About", href: "/about-us" },
                { id: "reviews", label: "Reviews", href: "/reviews" },
              ],
            },
          ],
          legalLinks: [
            {
              id: "terms",
              label: "Terms of service",
              href: "/terms-of-service",
            },
            { id: "privacy", label: "Privacy policy", href: "/privacy-policy" },
            {
              id: "refund",
              label: "Shipping & returns",
              href: "/refund-policy",
            },
          ],
        },
      },
    },
  };
}

export function buildDesiredState() {
  return {
    homepageSections: buildHomepageSections(),
    banners: buildBanners(),
    aboutSections: buildAboutSections(),
    promotion: buildPromotion(),
    siteSettings: buildSiteSettingsPatch(),
    theme: {
      themeKey: THEME_KEY,
      schemaVersion: THEME_SCHEMA_VERSION,
      themeVersion: THEME_VERSION,
      manifest: structuredClone(THEME_MANIFEST),
      designConfig: structuredClone(THEME_DESIGN_CONFIG),
    },
    facebook: FACEBOOK_URL,
    instagram: INSTAGRAM_URL,
    categories: CATEGORIES,
    bannerAssets: BANNER_PATHS.map((path) => ({
      bucket: "banner-images",
      path,
    })),
  };
}

export function desiredChecksum(desired = buildDesiredState()) {
  return createHash("sha256").update(stableStringify(desired)).digest("hex");
}

function withoutTimestamps(rows) {
  return rows.map(({ created_at, updated_at, ...row }) => row);
}

function dbHomepageRows(desired) {
  return withoutTimestamps(desired.homepageSections);
}

function dbBannerRows(desired) {
  return withoutTimestamps(desired.banners);
}

function dbTheme(desired) {
  return {
    themeKey: desired.theme.themeKey,
    schemaVersion: desired.theme.schemaVersion,
    manifest: desired.theme.manifest,
    designConfig: desired.theme.designConfig,
  };
}

function currentTheme(row) {
  return {
    themeKey: row?.theme_key ?? null,
    schemaVersion:
      row?.theme_schema_version === null ||
      row?.theme_schema_version === undefined
        ? null
        : Number(row.theme_schema_version),
    manifest: parseJson(row?.theme_manifest, null),
    designConfig: parseJson(row?.theme_design_config, null),
  };
}

function parseJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

function equal(left, right) {
  return stableStringify(left) === stableStringify(right);
}

export function ledgerStatus(sourceUrl, checksum) {
  if (!sourceUrl) return "missing";
  return sourceUrl === `${FACEBOOK_URL}#sha256=${checksum}`
    ? "match"
    : "changed";
}

export function compareCurrentState(row, desired = buildDesiredState()) {
  const homepageRows = parseJson(row?.homepage_rows, []);
  const bannerRows = parseJson(row?.banner_rows, []);
  const cmsHomepage = parseJson(row?.cms_homepage, []);
  const cmsBanners = parseJson(row?.cms_banners, []);
  const aboutRows = parseJson(row?.about_rows, []);
  const promotion = parseJson(row?.promotion, null);
  const changed = [];
  if (!equal(homepageRows, dbHomepageRows(desired)))
    changed.push("homepageRows");
  if (!equal(bannerRows, dbBannerRows(desired))) changed.push("bannerRows");
  if (!equal(aboutRows, desired.aboutSections)) changed.push("aboutRows");
  if (!equal(cmsHomepage, desired.homepageSections)) {
    changed.push("cmsHomepageMirror");
  }
  if (!equal(cmsBanners, desired.banners)) changed.push("cmsBannerMirror");
  if (row?.facebook !== desired.facebook) changed.push("facebook");
  if (row?.instagram !== desired.instagram) changed.push("instagram");
  if (row?.store_name !== desired.siteSettings.store_name)
    changed.push("storeName");
  if (row?.currency !== desired.siteSettings.currency) changed.push("currency");
  if (row?.currency_symbol !== desired.siteSettings.currency_symbol)
    changed.push("currencySymbol");
  if (!equal(promotion, desired.promotion)) changed.push("promotion");
  const theme = currentTheme(row);
  if (!equal(theme, dbTheme(desired))) changed.push("theme");
  const themeStateValid = row?.theme_state_valid === true;
  if (!themeStateValid) changed.push("themeState");
  const themeDraftValid =
    Number(row?.theme_draft_count ?? 0) === 1 &&
    row?.theme_draft_source_revision_id === row?.theme_published_revision_id;
  if (!themeDraftValid) changed.push("themeDraft");
  const missingBannerAssets = desired.bannerAssets
    .map(({ path }) => path)
    .filter(
      (path) => !(row?.storage_names ?? []).includes(`banner-images/${path}`),
    );
  if (missingBannerAssets.length) changed.push("bannerAssets");
  return {
    changed,
    missingBannerAssets,
    theme: {
      current: theme,
      desired: dbTheme(desired),
      matches: equal(theme, dbTheme(desired)),
      stateValid: themeStateValid,
      draftValid: themeDraftValid,
    },
    currentCounts: {
      homepage: Number(row?.homepage_count ?? homepageRows.length),
      homepageActive: Number(row?.homepage_active_count ?? 0),
      banners: Number(row?.banner_count ?? bannerRows.length),
      bannerV1: Number(row?.banner_v1_count ?? 0),
      bannerV2: Number(row?.banner_v2_count ?? 0),
      bannersActive: Number(row?.banner_active_count ?? 0),
      about: aboutRows.length,
      aboutActive: aboutRows.filter((item) => item?.active === true).length,
    },
    desiredCounts: {
      homepage: desired.homepageSections.length,
      homepageActive: desired.homepageSections.filter((item) => item.active)
        .length,
      banners: desired.banners.length,
      bannerV1: desired.banners.filter((item) => item.section_type === "banner")
        .length,
      bannerV2: desired.banners.filter(
        (item) => item.section_type === "banner_v2",
      ).length,
      bannersActive: desired.banners.filter((item) => item.active).length,
      about: desired.aboutSections.length,
      aboutActive: desired.aboutSections.filter((item) => item.active).length,
    },
  };
}

export function buildStateSql() {
  const types = HOMEPAGE_TYPES.map(sqlLiteral).join(", ");
  const bannerIds = buildBanners()
    .map((row) => sqlLiteral(row.id))
    .join(", ");
  const storage = BANNER_PATHS.map((path) => `banner-images/${path}`)
    .map(sqlLiteral)
    .join(", ");
  return `
select
  (select client_id from provisioning.store_identity where singleton = true) as client_id,
  (select source_url from provisioning.content_migrations where migration_key = ${sqlLiteral(MIGRATION_KEY)}) as ledger_source,
  (select revision.theme_key
   from public.theme_state state
   join public.theme_revisions revision on revision.id = state.published_revision_id
   where state.singleton and revision.status = 'published') as theme_key,
  (select revision.schema_version
   from public.theme_state state
   join public.theme_revisions revision on revision.id = state.published_revision_id
   where state.singleton and revision.status = 'published') as theme_schema_version,
  (select revision.manifest
   from public.theme_state state
   join public.theme_revisions revision on revision.id = state.published_revision_id
   where state.singleton and revision.status = 'published') as theme_manifest,
  (select revision.design_config
   from public.theme_state state
   join public.theme_revisions revision on revision.id = state.published_revision_id
   where state.singleton and revision.status = 'published') as theme_design_config,
  (select published_revision_id::text from public.theme_state where singleton) as theme_published_revision_id,
  (select count(*)::int from public.theme_revisions where status = 'draft') as theme_draft_count,
  (select source_revision_id::text from public.theme_revisions where status = 'draft') as theme_draft_source_revision_id,
  ((select count(*) from public.theme_state) = 1 and (select count(*)
    from public.theme_state state
    join public.theme_revisions revision on revision.id = state.published_revision_id
    where state.singleton and revision.status = 'published') = 1) as theme_state_valid,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id::text, 'type', type, 'title', title, 'subtitle', subtitle,
      'body', body, 'sort', sort, 'active', active, 'config', config
    ) order by sort, id)
    from public.homepage_sections
    where type in (${types})
  ), '[]'::jsonb) as homepage_rows,
  (select count(*)::int from public.homepage_sections where type in (${types})) as homepage_count,
  (select count(*)::int from public.homepage_sections where type in (${types}) and active) as homepage_active_count,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id::text, 'section_type', section_type, 'title', title,
      'subtitle', subtitle, 'image_path', image_path,
      'mobile_image_path', mobile_image_path, 'cta_label', cta_label,
      'cta_url', cta_url, 'sort', sort, 'active', active,
      'starts_at', starts_at, 'ends_at', ends_at
    ) order by section_type, sort, id)
    from public.banners
    where id in (${bannerIds}) or section_type in ('banner', 'banner_v2')
  ), '[]'::jsonb) as banner_rows,
  (select count(*)::int from public.banners where section_type in ('banner', 'banner_v2')) as banner_count,
  (select count(*)::int from public.banners where section_type = 'banner') as banner_v1_count,
  (select count(*)::int from public.banners where section_type = 'banner_v2') as banner_v2_count,
  (select count(*)::int from public.banners where section_type in ('banner', 'banner_v2') and active) as banner_active_count,
  coalesce((select socials #> '{_cms,homepage_sections}' from public.site_settings where id = 1), '[]'::jsonb) as cms_homepage,
  coalesce((select socials #> '{_cms,banners}' from public.site_settings where id = 1), '[]'::jsonb) as cms_banners,
  coalesce((select socials #> '{_cms,about_sections}' from public.site_settings where id = 1), '[]'::jsonb) as about_rows,
  (select socials ->> 'facebook' from public.site_settings where id = 1) as facebook,
  (select socials ->> 'instagram' from public.site_settings where id = 1) as instagram,
  (select store_name from public.site_settings where id = 1) as store_name,
  (select currency from public.site_settings where id = 1) as currency,
  (select currency_symbol from public.site_settings where id = 1) as currency_symbol,
  (select jsonb_build_object(
    'id', id::text, 'title', title, 'description', description,
    'image_path', image_path, 'discount_percent', discount_percent,
    'active', active, 'starts_at', starts_at, 'ends_at', ends_at,
    'cta_url', cta_url, 'cta_label', cta_label
  ) from public.promotions where id = ${sqlLiteral(TEMPLATE_PROMOTION_ID)}::uuid) as promotion,
  coalesce((
    select jsonb_agg(bucket_id || '/' || name order by bucket_id, name)
    from storage.objects
    where bucket_id || '/' || name in (${storage})
  ), '[]'::jsonb) as storage_names;
`;
}

function homepageValues(rows) {
  return rows
    .map(
      (row) =>
        `(${sqlLiteral(row.id)}::uuid, ${sqlLiteral(row.type)}, ${row.title === null ? "null" : sqlLiteral(row.title)}, ${row.subtitle === null ? "null" : sqlLiteral(row.subtitle)}, ${row.body === null ? "null" : sqlLiteral(row.body)}, ${row.sort}, ${row.active}, ${sqlLiteral(JSON.stringify(row.config))}::jsonb)`,
    )
    .join(",\n");
}

function bannerValues(rows) {
  return rows
    .map(
      (row) =>
        `(${sqlLiteral(row.id)}::uuid, ${sqlLiteral(row.section_type)}, ${sqlLiteral(row.title)}, ${sqlLiteral(row.subtitle)}, ${sqlLiteral(row.image_path)}, null, ${sqlLiteral(row.cta_label)}, ${sqlLiteral(row.cta_url)}, ${row.sort}, ${row.active}, null, null)`,
    )
    .join(",\n");
}

export function buildApplySql(
  desired = buildDesiredState(),
  checksum = desiredChecksum(desired),
  { replace = false } = {},
) {
  const types = HOMEPAGE_TYPES.map(sqlLiteral).join(", ");
  const desiredSource = `${FACEBOOK_URL}#sha256=${checksum}`;
  const homepageJson = sqlLiteral(JSON.stringify(desired.homepageSections));
  const bannerJson = sqlLiteral(JSON.stringify(desired.banners));
  const aboutJson = sqlLiteral(JSON.stringify(desired.aboutSections));
  const homepageDbJson = sqlLiteral(JSON.stringify(dbHomepageRows(desired)));
  const bannerDbJson = sqlLiteral(JSON.stringify(dbBannerRows(desired)));
  const themeManifestJson = sqlLiteral(JSON.stringify(desired.theme.manifest));
  const themeDesignJson = sqlLiteral(
    JSON.stringify(desired.theme.designConfig),
  );
  const backupKeyPrefix = `${MIGRATION_KEY}:${checksum}`;
  const promotion = desired.promotion;
  const settings = desired.siteSettings;
  const socialsPatch = sqlLiteral(JSON.stringify(settings.socials));
  const replaceGuard = replace
    ? `if existing_source is null or existing_source = ${sqlLiteral(desiredSource)} then
      raise exception 'The --replace guard requires a changed MiniCo checksum';
    end if;`
    : `if existing_source is not null and existing_source <> ${sqlLiteral(desiredSource)} then
      raise exception 'MiniCo content checksum changed; use --replace';
    end if;`;
  const assetChecks = desired.bannerAssets
    .map(
      ({ bucket, path }) =>
        `(bucket_id = ${sqlLiteral(bucket)} and name = ${sqlLiteral(path)})`,
    )
    .join(" or ");
  return `
begin;
select pg_advisory_xact_lock(hashtext(${sqlLiteral(MIGRATION_KEY)}));
lock table provisioning.store_identity in share mode;
lock table provisioning.content_migrations in share row exclusive mode;
lock table provisioning.theme_builder_backups in share row exclusive mode;
lock table public.homepage_sections in share row exclusive mode;
lock table public.banners in share row exclusive mode;
lock table public.promotions in share row exclusive mode;
lock table public.categories in share row exclusive mode;
lock table public.theme_revisions in share row exclusive mode;
lock table public.theme_state in share row exclusive mode;
lock table public.site_settings in share row exclusive mode;
do $$
declare
  existing_source text;
begin
  if (select client_id from provisioning.store_identity where singleton = true) is distinct from ${sqlLiteral(MINICO_CLIENT_ID)} then
    raise exception 'Supabase store identity does not match MiniCo';
  end if;
  if (select count(*) from public.site_settings where id = 1) <> 1 then
    raise exception 'MiniCo singleton settings row is unavailable';
  end if;
  if (select count(*) from public.theme_state where singleton) <> 1
    or (select count(*) from public.theme_state) <> 1 then
    raise exception 'MiniCo theme state singleton is unavailable';
  end if;
  if (select count(*) from public.theme_revisions where status = 'draft') <> 1 then
    raise exception 'MiniCo theme draft singleton is unavailable';
  end if;
  if not exists (
    select 1
    from public.theme_state state
    join public.theme_revisions revision on revision.id = state.published_revision_id
    where state.singleton and revision.status = 'published'
  ) then
    raise exception 'MiniCo published theme is unavailable';
  end if;
  if (select count(*) from storage.objects where ${assetChecks}) <> ${desired.bannerAssets.length} then
    raise exception 'Required MiniCo content assets are unavailable';
  end if;
  select source_url into existing_source
  from provisioning.content_migrations
  where migration_key = ${sqlLiteral(MIGRATION_KEY)};
  ${replaceGuard}
end;
$$;
insert into provisioning.theme_builder_backups (migration_name, snapshot)
values (
  ${sqlLiteral(`${backupKeyPrefix}:`)} || txid_current()::text,
  jsonb_build_object(
    'migrationKey', ${sqlLiteral(MIGRATION_KEY)},
    'desiredChecksum', ${sqlLiteral(checksum)},
    'homepageSections', coalesce((
      select jsonb_agg(to_jsonb(section) order by section.sort, section.id)
      from public.homepage_sections section
      where section.type in (${types})
    ), '[]'::jsonb),
    'banners', coalesce((
      select jsonb_agg(to_jsonb(banner) order by banner.section_type, banner.sort, banner.id)
      from public.banners banner
      where banner.section_type in ('banner', 'banner_v2')
    ), '[]'::jsonb),
    'cmsHomepage', (select socials #> '{_cms,homepage_sections}' from public.site_settings where id = 1),
    'cmsBanners', (select socials #> '{_cms,banners}' from public.site_settings where id = 1),
    'cmsAbout', (select socials #> '{_cms,about_sections}' from public.site_settings where id = 1),
    'promotion', (select to_jsonb(promotion) from public.promotions promotion where promotion.id = ${sqlLiteral(TEMPLATE_PROMOTION_ID)}::uuid),
    'contentLedger', coalesce((
      select jsonb_agg(to_jsonb(ledger) order by ledger.migration_key)
      from provisioning.content_migrations ledger
      where ledger.migration_key = ${sqlLiteral(MIGRATION_KEY)}
    ), '[]'::jsonb),
    'themeState', (select to_jsonb(state) from public.theme_state state where state.singleton),
    'publishedTheme', (
      select to_jsonb(revision)
      from public.theme_state state
      join public.theme_revisions revision on revision.id = state.published_revision_id
      where state.singleton
    ),
    'draftTheme', (select to_jsonb(revision) from public.theme_revisions revision where revision.status = 'draft')
  )
);
do $$
begin
  if not exists (
    select 1
    from provisioning.theme_builder_backups
    where migration_name = ${sqlLiteral(`${backupKeyPrefix}:`)} || txid_current()::text
      and snapshot ->> 'migrationKey' = ${sqlLiteral(MIGRATION_KEY)}
      and snapshot ->> 'desiredChecksum' = ${sqlLiteral(checksum)}
  ) then
    raise exception 'MiniCo operation backup could not be verified';
  end if;
end;
$$;
delete from public.homepage_sections
where type in (${types});
insert into public.homepage_sections (id, type, title, subtitle, body, sort, active, config)
values
${homepageValues(desired.homepageSections)};
delete from public.banners
where section_type in ('banner', 'banner_v2');
insert into public.banners (
  id, section_type, title, subtitle, image_path, mobile_image_path,
  cta_label, cta_url, sort, active, starts_at, ends_at
)
values
${bannerValues(desired.banners)};
insert into public.promotions (
  id, title, description, image_path, discount_percent, active,
  starts_at, ends_at, cta_url, cta_label
)
values (
  ${sqlLiteral(promotion.id)}::uuid,
  ${sqlLiteral(promotion.title)},
  ${sqlLiteral(promotion.description)},
  null,
  null,
  true,
  null,
  null,
  ${sqlLiteral(promotion.cta_url)},
  ${sqlLiteral(promotion.cta_label)}
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  image_path = excluded.image_path,
  discount_percent = excluded.discount_percent,
  active = excluded.active,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  cta_url = excluded.cta_url,
  cta_label = excluded.cta_label;
insert into public.categories (id, name, slug, description, image_path, sort, is_default)
values
${CATEGORIES.map(
  (category) =>
    `(${sqlLiteral(category.id)}::uuid, ${sqlLiteral(category.name)}, ${sqlLiteral(category.slug)}, ${sqlLiteral(category.description)}, ${sqlLiteral(category.image_path)}, ${category.sort}, false)`,
).join(",\n")}
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  image_path = excluded.image_path,
  sort = excluded.sort;
update public.site_settings
set
  store_name = ${sqlLiteral(settings.store_name)},
  currency = ${sqlLiteral(settings.currency)},
  currency_symbol = ${sqlLiteral(settings.currency_symbol)},
  contact_email = ${sqlLiteral(settings.contact_email)},
  contact_phone = ${settings.contact_phone === null ? "null" : sqlLiteral(settings.contact_phone)},
  address = ${settings.address === null ? "null" : sqlLiteral(settings.address)},
  announcement_text = ${sqlLiteral(settings.announcement_text)},
  announcement_active = ${settings.announcement_active},
  announcement_url = ${sqlLiteral(settings.announcement_url)},
  socials = jsonb_set(
    jsonb_set(
      jsonb_set(
        coalesce(socials, '{}'::jsonb),
        '{facebook}',
        to_jsonb(${sqlLiteral(desired.facebook)}::text),
        true
      ),
      '{instagram}',
      to_jsonb(${sqlLiteral(desired.instagram)}::text),
      true
    ),
    '{_cms}',
    (case
      when jsonb_typeof(socials -> '_cms') = 'object' then socials -> '_cms'
      else '{}'::jsonb
    end)
      || (${socialsPatch}::jsonb) #> '{_cms}'
      || jsonb_build_object(
        'banners', ${bannerJson}::jsonb,
        'homepage_sections', ${homepageJson}::jsonb,
        'about_sections', ${aboutJson}::jsonb
      ),
    true
  )
where id = 1;
insert into provisioning.content_migrations (migration_key, source_url)
values (${sqlLiteral(MIGRATION_KEY)}, ${sqlLiteral(desiredSource)})
on conflict (migration_key) do update
set source_url = excluded.source_url,
    applied_at = now();
do $$
declare
  current_draft_version bigint;
  published_matches boolean;
  draft_matches boolean;
begin
  select
    revision.version,
    revision.theme_key = ${sqlLiteral(desired.theme.themeKey)}
      and revision.schema_version = ${desired.theme.schemaVersion}
      and revision.manifest = ${themeManifestJson}::jsonb
      and revision.design_config = ${themeDesignJson}::jsonb
      and revision.source_revision_id = state.published_revision_id
  into current_draft_version, draft_matches
  from public.theme_revisions revision
  cross join public.theme_state state
  where revision.status = 'draft' and state.singleton
  for update of revision;
  if current_draft_version is null then
    raise exception 'MiniCo theme draft optimistic version is unavailable';
  end if;
  select
    revision.theme_key = ${sqlLiteral(desired.theme.themeKey)}
    and revision.schema_version = ${desired.theme.schemaVersion}
    and revision.manifest = ${themeManifestJson}::jsonb
    and revision.design_config = ${themeDesignJson}::jsonb
  into published_matches
  from public.theme_state state
  join public.theme_revisions revision on revision.id = state.published_revision_id
  where state.singleton and revision.status = 'published';
  if not coalesce(published_matches, false)
    or not coalesce(draft_matches, false) then
    perform public.apply_theme(
      current_draft_version,
      ${sqlLiteral(desired.theme.themeKey)},
      ${desired.theme.schemaVersion},
      ${themeManifestJson}::jsonb,
      ${themeDesignJson}::jsonb
    );
  end if;
end;
$$;
do $$
begin
  if coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id::text, 'type', type, 'title', title, 'subtitle', subtitle,
      'body', body, 'sort', sort, 'active', active, 'config', config
    ) order by sort, id)
    from public.homepage_sections
    where type in (${types})
  ), '[]'::jsonb) <> ${homepageDbJson}::jsonb then
    raise exception 'MiniCo homepage assertion failed';
  end if;
  if coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id::text, 'section_type', section_type, 'title', title,
      'subtitle', subtitle, 'image_path', image_path,
      'mobile_image_path', mobile_image_path, 'cta_label', cta_label,
      'cta_url', cta_url, 'sort', sort, 'active', active,
      'starts_at', starts_at, 'ends_at', ends_at
    ) order by section_type, sort, id)
    from public.banners
    where section_type in ('banner', 'banner_v2')
  ), '[]'::jsonb) <> ${bannerDbJson}::jsonb then
    raise exception 'MiniCo banner assertion failed';
  end if;
  if (select socials #> '{_cms,homepage_sections}' from public.site_settings where id = 1) <> ${homepageJson}::jsonb
    or (select socials #> '{_cms,banners}' from public.site_settings where id = 1) <> ${bannerJson}::jsonb
    or (select socials #> '{_cms,about_sections}' from public.site_settings where id = 1) <> ${aboutJson}::jsonb
    or (select socials ->> 'facebook' from public.site_settings where id = 1) <> ${sqlLiteral(desired.facebook)}
    or (select socials ->> 'instagram' from public.site_settings where id = 1) <> ${sqlLiteral(desired.instagram)}
    or (select store_name from public.site_settings where id = 1) <> ${sqlLiteral(settings.store_name)}
    or (select currency from public.site_settings where id = 1) <> ${sqlLiteral(settings.currency)}
    or (select currency_symbol from public.site_settings where id = 1) <> ${sqlLiteral(settings.currency_symbol)} then
    raise exception 'MiniCo CMS assertion failed';
  end if;
  if (select count(*) from public.categories where id in (${CATEGORY_IDS.map((id) => `${sqlLiteral(id)}::uuid`).join(", ")})) <> ${CATEGORY_IDS.length} then
    raise exception 'MiniCo categories assertion failed';
  end if;
  if exists (
    select 1 from public.promotions
    where id = ${sqlLiteral(promotion.id)}::uuid
      and (image_path is distinct from null
        or discount_percent is distinct from null
        or title is distinct from ${sqlLiteral(promotion.title)}
        or description is distinct from ${sqlLiteral(promotion.description)}
        or active is distinct from true
        or starts_at is distinct from null
        or ends_at is distinct from null
        or cta_url is distinct from ${sqlLiteral(promotion.cta_url)}
        or cta_label is distinct from ${sqlLiteral(promotion.cta_label)})
  ) or not exists (
    select 1 from public.promotions where id = ${sqlLiteral(promotion.id)}::uuid
  ) then
    raise exception 'MiniCo promotion assertion failed';
  end if;
  if (select count(*) from public.theme_state) <> 1 or not exists (
    select 1
    from public.theme_state state
    join public.theme_revisions revision on revision.id = state.published_revision_id
    where state.singleton
      and revision.status = 'published'
      and revision.theme_key = ${sqlLiteral(desired.theme.themeKey)}
      and revision.schema_version = ${desired.theme.schemaVersion}
      and revision.manifest = ${themeManifestJson}::jsonb
      and revision.design_config = ${themeDesignJson}::jsonb
  ) then
    raise exception 'MiniCo published theme assertion failed';
  end if;
  if (select count(*) from public.theme_revisions where status = 'draft') <> 1
    or not exists (
      select 1
      from public.theme_revisions draft
      join public.theme_state state on state.published_revision_id = draft.source_revision_id
      where draft.status = 'draft' and state.singleton
    ) then
    raise exception 'MiniCo theme draft assertion failed';
  end if;
end;
$$;
commit;
`;
}

function planFromState(row, desired, checksum, apply) {
  const comparison = compareCurrentState(row, desired);
  const ledger = ledgerStatus(row?.ledger_source, checksum);
  return {
    apply,
    checksum,
    ledger: {
      status: ledger,
      migrationKey: MIGRATION_KEY,
    },
    counts: {
      current: comparison.currentCounts,
      desired: comparison.desiredCounts,
    },
    changed: comparison.changed,
    theme: comparison.theme,
    assets: {
      bannerAssetsExist: comparison.missingBannerAssets.length === 0,
      missingBannerAssets: comparison.missingBannerAssets,
    },
  };
}

function validateManifest(manifest) {
  if (manifest.id !== MINICO_CLIENT_ID) {
    throw new Error("Client manifest does not identify MiniCo");
  }
  if (manifest.supabase?.projectRef !== MINICO_PROJECT_REF) {
    throw new Error(
      "Client manifest does not reference the MiniCo Supabase project",
    );
  }
  if (manifest.supabase?.url !== `https://${MINICO_PROJECT_REF}.supabase.co`) {
    throw new Error("Client manifest has an invalid MiniCo Supabase URL");
  }
}

function assertVerified(row, desired, checksum) {
  if (row?.client_id !== MINICO_CLIENT_ID) {
    throw new Error("Supabase store identity does not match MiniCo");
  }
  const comparison = compareCurrentState(row, desired);
  if (comparison.changed.length) {
    throw new Error(
      `MiniCo content/theme verification failed: ${comparison.changed.join(", ")}`,
    );
  }
  if (ledgerStatus(row?.ledger_source, checksum) !== "match") {
    throw new Error("MiniCo content migration ledger verification failed");
  }
  return comparison;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArguments(argv);
  const apply = args.apply === true;
  const replace = args.replace === true;
  const { manifest } = loadClient(MINICO_CLIENT_ID);
  validateManifest(manifest);
  const secrets = parseEnvFile(
    resolve(repositoryRoot, ".client-secrets", "minicobd.env"),
  );
  const accessToken = secrets.SUPABASE_ACCESS_TOKEN?.trim();
  if (!accessToken) throw new Error("SUPABASE_ACCESS_TOKEN is missing");
  maskSecret(accessToken);
  const managementRequest = (path, options = {}) =>
    requestJson(`${SUPABASE_API}${path}`, {
      token: accessToken,
      ...options,
    });
  const runSql = (query, readOnly = false) =>
    managementRequest(`/v1/projects/${MINICO_PROJECT_REF}/database/query`, {
      method: "POST",
      body: { query, read_only: readOnly },
      expected: [201],
    });
  const desired = buildDesiredState();
  const checksum = desiredChecksum(desired);
  let current = responseRows(await runSql(buildStateSql(), true))[0];
  if (current?.client_id !== MINICO_CLIENT_ID) {
    throw new Error("Supabase store identity does not match MiniCo");
  }
  const plan = planFromState(current, desired, checksum, apply);
  if (replace && plan.ledger.status !== "changed") {
    throw new Error(
      "--replace is only valid when the desired checksum changed",
    );
  }
  if (!apply) {
    console.log(JSON.stringify(plan, null, 2));
    return plan;
  }
  if (plan.ledger.status === "changed" && !replace) {
    throw new Error(
      "MiniCo content checksum changed; rerun with --apply --replace",
    );
  }
  if (!plan.assets.bannerAssetsExist) {
    throw new Error("Required MiniCo banner assets are missing");
  }
  const stateChanged = plan.changed.some(
    (category) => !["bannerAssets"].includes(category),
  );
  if (stateChanged || plan.ledger.status !== "match") {
    await runSql(buildApplySql(desired, checksum, { replace }));
  }
  const verifiedRow = responseRows(await runSql(buildStateSql(), true))[0];
  const verification = assertVerified(verifiedRow, desired, checksum);
  const result = {
    ...plan,
    noOp: !stateChanged && plan.ledger.status === "match",
    verification: {
      homepage: verification.desiredCounts.homepage,
      banners: verification.desiredCounts.banners,
      about: verification.desiredCounts.about,
      assets: desired.bannerAssets.length,
      theme: {
        themeKey: desired.theme.themeKey,
        schemaVersion: desired.theme.schemaVersion,
        themeVersion: desired.theme.themeVersion,
        published: verification.theme.matches,
        stateValid: verification.theme.stateValid,
        draftValid: verification.theme.draftValid,
      },
    },
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await main();
