export type CmsPageSlug = "about" | "terms" | "privacy" | "refund";

export interface CmsPage {
  slug: CmsPageSlug;
  title: string;
  body_html: string;
  updated_at: string;
}

export interface CmsAnnouncement {
  text: string | null;
  active: boolean;
  url: string | null;
}

export interface CmsSeo {
  title: string;
  description: string;
  keywords: string;
  og_image_path: string | null;
}

export type SeoPageKey =
  | "home"
  | "about"
  | "product"
  | "contact"
  | "reviews"
  | "cart"
  | "wishlist"
  | "checkout"
  | "track"
  | "privacy"
  | "terms"
  | "refund";

export const SEO_PAGE_KEYS: SeoPageKey[] = [
  "home",
  "about",
  "product",
  "contact",
  "reviews",
  "cart",
  "wishlist",
  "checkout",
  "track",
  "privacy",
  "terms",
  "refund",
];

export const SEO_PAGE_META: Record<
  SeoPageKey,
  { label: string; path: string }
> = {
  home: { label: "Home", path: "/" },
  about: { label: "About Us", path: "/about-us" },
  product: { label: "Shop", path: "/product" },
  contact: { label: "Contact Us", path: "/contact-us" },
  reviews: { label: "Reviews", path: "/reviews" },
  cart: { label: "Cart", path: "/cart" },
  wishlist: { label: "Favorites", path: "/wishlist" },
  checkout: { label: "Checkout", path: "/checkout" },
  track: { label: "Track Order", path: "/track-order" },
  privacy: { label: "Privacy Policy", path: "/privacy-policy" },
  terms: { label: "Terms of Service", path: "/terms-of-service" },
  refund: { label: "Refund Policy", path: "/refund-policy" },
};

export const DEFAULT_SEO: CmsSeo = {
  title: "Store | Shop Online",
  description:
    "Browse products, discover new arrivals, and shop securely online.",
  keywords: "Store, Online Shopping, New Arrivals, Quality Products",
  og_image_path: null,
};

export const DEFAULT_PAGES_SEO: Record<SeoPageKey, CmsSeo> = {
  home: { ...DEFAULT_SEO },
  about: {
    title: "About Us | Store",
    description:
      "Learn about our store, values, and commitment to quality products and service.",
    keywords: "Store, About Us, Brand Story, Quality Products",
    og_image_path: null,
  },
  product: {
    title: "Shop | Store",
    description:
      "Explore our collection and shop new arrivals, featured products, and best sellers.",
    keywords: "Store, Shop, Collections, Best Sellers, Online Store",
    og_image_path: null,
  },
  contact: {
    title: "Contact Us | Store",
    description:
      "Get in touch with our store for customer support, inquiries, or feedback.",
    keywords: "Store, Contact, Customer Support",
    og_image_path: null,
  },
  reviews: {
    title: "Customer Reviews | Store",
    description:
      "Read authentic customer reviews and see what customers say about their purchases.",
    keywords: "Store, Customer Reviews, Testimonials",
    og_image_path: null,
  },
  cart: {
    title: "Shopping Cart | Store",
    description: "Review the selected items in your shopping cart.",
    keywords: "Store, Shopping Cart",
    og_image_path: null,
  },
  wishlist: {
    title: "Favorites | Store",
    description:
      "Your saved favorites are kept on this device so you can come back anytime.",
    keywords: "Store, Favorites, Wishlist",
    og_image_path: null,
  },
  checkout: {
    title: "Checkout | Store",
    description: "Complete your purchase with a fast, secure checkout.",
    keywords: "Store, Checkout, Secure Checkout",
    og_image_path: null,
  },
  track: {
    title: "Track Order | Store",
    description: "Track your order status by entering your order number.",
    keywords: "Store, Track Order, Order Status, Order Tracking",
    og_image_path: null,
  },
  privacy: {
    title: "Privacy Policy | Store",
    description:
      "Read our privacy policy to understand how we collect, use, and protect personal information.",
    keywords: "Store, Privacy Policy, Data Protection",
    og_image_path: null,
  },
  terms: {
    title: "Terms and Conditions | Store",
    description:
      "Read our terms and conditions covering products, pricing, shipping, and returns.",
    keywords: "Store, Terms of Service, Terms and Conditions",
    og_image_path: null,
  },
  refund: {
    title: "Shipping & Return Policy | Store",
    description:
      "Learn about our shipping and return policy, delivery times, and order tracking.",
    keywords: "Store, Shipping Policy, Return Policy, Refund Policy",
    og_image_path: null,
  },
};

export function normalizePagesSeo(
  raw: unknown,
  homeSeo?: Partial<CmsSeo> | null,
): Record<SeoPageKey, CmsSeo> {
  const source =
    raw && typeof raw === "object"
      ? (raw as Partial<Record<SeoPageKey, Partial<CmsSeo>>>)
      : {};

  const pages = {} as Record<SeoPageKey, CmsSeo>;
  for (const key of SEO_PAGE_KEYS) {
    const defaults =
      key === "home"
        ? { ...DEFAULT_SEO, ...(homeSeo ?? {}) }
        : DEFAULT_PAGES_SEO[key];
    pages[key] = {
      ...defaults,
      ...(source[key] ?? {}),
    };
  }

  // Keep legacy top-level `seo` in sync with home when pages_seo.home is empty.
  if (!source.home && homeSeo) {
    pages.home = { ...DEFAULT_SEO, ...homeSeo };
  }

  return pages;
}

export type { CurrencyCode, CurrencySettings } from "@/lib/currency";
export {
  DEFAULT_CURRENCY_SETTINGS,
  SUPPORTED_CURRENCIES,
} from "@/lib/currency";

export type { DeliveryCharges } from "@/lib/delivery";
export { DEFAULT_DELIVERY_CHARGES } from "@/lib/delivery";

export type { ChatWidgets } from "@/lib/chatWidgets";
export { DEFAULT_CHAT_WIDGETS } from "@/lib/chatWidgets";
