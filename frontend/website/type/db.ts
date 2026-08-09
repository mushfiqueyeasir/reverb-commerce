// Database row types (Supabase Postgres). Snake_case mirrors the SQL schema.

export type UserRole = "admin" | "editor" | "viewer";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export interface ProfileRow {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface ProductSizeChartRow {
  size: string;
  chest: string;
  length: string;
}

export interface ProductRow {
  id: string;
  title: string;
  slug: string;
  original_price: number;
  current_price: number;
  description: { html?: string } | null;
  size_chart: ProductSizeChartRow[] | null;
  sizing_mode: "none" | "required";
  status: "active" | "draft" | "archived";
  product_type: string | null;
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImageRow {
  id: string;
  product_id: string;
  path: string;
  alt: string | null;
  is_main: boolean;
  sort: number;
  created_at: string;
}

export interface ProductVariantRow {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerRow {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  address: Record<string, unknown> | null;
  orders_count: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface OrderDelivery {
  country?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  shippingMethod?: "inside-dhaka" | "outside-dhaka";
}

export interface OrderTotals {
  subtotal: number;
  shipping: number;
  total: number;
  /** Flat % promo discount amount (applied to subtotal only). */
  discount?: number;
  discount_percent?: number;
  promo_code?: string | null;
}

export interface PromoCodeRow {
  id: string;
  code: string;
  percent: number;
  starts_at: string;
  ends_at: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = "cod" | "bkash";
export type PaymentStatus = "unpaid" | "processing" | "paid" | "failed";

export interface OrderRow {
  id: string;
  order_number: string;
  status: OrderStatus;
  customer_id: string | null;
  delivery: OrderDelivery;
  totals: OrderTotals;
  payment_method: PaymentMethod | string;
  payment_status?: PaymentStatus | string;
  bkash_payment_id?: string | null;
  bkash_trx_id?: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BkashSettingsRow {
  id: number;
  enabled: boolean;
  sandbox: boolean;
  username: string | null;
  password: string | null;
  app_key: string | null;
  app_secret: string | null;
  updated_at: string;
}

export interface OrderShipmentRow {
  id: string;
  order_id: string;
  provider: "pathao" | "steadfast" | "redx";
  sync_state: "creating" | "synced" | "failed" | "unknown";
  external_id: string | null;
  tracking_code: string | null;
  courier_status: string | null;
  status_message: string | null;
  delivery_area_id: string | null;
  delivery_area_name: string | null;
  parcel_weight: number | null;
  request_payload: Record<string, unknown> | null;
  response_payload: Record<string, unknown> | null;
  last_event_at: string | null;
  synced_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourierEventRow {
  id: string;
  shipment_id: string;
  provider: "pathao" | "steadfast" | "redx";
  event_key: string;
  event_name: string;
  courier_status: string | null;
  message: string | null;
  provider_time: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  title: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  unit_price: number;
}

export interface PromotionRow {
  id: string;
  title: string;
  description: string | null;
  image_path: string | null;
  discount_percent: number | null;
  /** Storefront CTA — usually `/product/{slug}` */
  cta_url: string | null;
  cta_label: string | null;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewRow {
  id: string;
  customer_name: string | null;
  image_path: string | null;
  rating: number | null;
  body: string | null;
  product_id: string | null;
  is_published: boolean;
  created_at: string;
}

export interface ContactSubmissionRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean;
  submitted_at: string;
}

export interface SiteSettingsRow {
  id: number;
  store_name: string;
  logo_path: string | null;
  /** Present after 0011_favicon migration is applied. */
  favicon_path?: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  currency: string;
  currency_symbol: string;
  shipping_flat: number;
  free_shipping_threshold: number | null;
  socials: Record<string, string>;
  google_analytics_id: string | null;
  meta_pixel_id: string | null;
  gtm_id: string | null;
  analytics_enabled: boolean;
  security_enabled: boolean;
  /** Present after 0006_cms migration is applied. */
  announcement_text?: string | null;
  announcement_active?: boolean;
  announcement_url?: string | null;
  updated_at: string;
}

export interface BannerRow {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_path: string;
  mobile_image_path: string | null;
  cta_label: string | null;
  cta_url: string | null;
  sort: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export type HomepageSectionType =
  "banner" | "categories" | "featured" | "reviews" | "promo" | "richtext";

export const HOMEPAGE_SECTION_TYPES: HomepageSectionType[] = [
  "banner",
  "categories",
  "featured",
  "reviews",
  "promo",
  "richtext",
];

export interface BannerStatItem {
  label: string;
  value: string;
}

export const DEFAULT_BANNER_STATS: BannerStatItem[] = [
  { label: "Weight", value: "240 GSM" },
  { label: "Cotton", value: "100%" },
  { label: "Fit", value: "Oversized" },
  { label: "Origin", value: "Made for Riders" },
];

export const DEFAULT_BANNER_MARQUEE: string[] = [
  "LIMITED DROP",
  "PREMIUM COTTON",
  "OVERSIZED FIT",
  "240 GSM",
  "MADE FOR RIDERS",
  "SHIPPED WORLDWIDE",
  "DROP 04 // LIVE",
];

export const DEFAULT_BANNER_DESCRIPTION =
  "Heavyweight 240 GSM oversized streetwear. Cut for riders, engineered for the road, worn well past the ride home.";

export interface HomepageSectionRow {
  id: string;
  type: HomepageSectionType;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  sort: number;
  active: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Fixed homepage layout — toggle visibility / edit copy, do not create new types. */
export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionRow[] = [
  {
    id: "section-banner",
    type: "banner",
    title: null,
    subtitle: null,
    body: null,
    sort: 0,
    active: true,
    config: {
      description: DEFAULT_BANNER_DESCRIPTION,
      show_marquee: true,
      stats: DEFAULT_BANNER_STATS,
      marquee_items: DEFAULT_BANNER_MARQUEE,
    },
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
  {
    id: "section-categories",
    type: "categories",
    title: "Shop by Category",
    subtitle: "Find your fit",
    body: null,
    sort: 1,
    active: true,
    config: {},
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
  {
    id: "section-featured",
    type: "featured",
    title: "Featured Gear",
    subtitle: "Latest drops",
    body: null,
    sort: 2,
    active: true,
    config: {},
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
  {
    id: "section-reviews",
    type: "reviews",
    title: "From the Community",
    subtitle: null,
    body: null,
    sort: 3,
    active: true,
    config: {},
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
  {
    id: "section-promo",
    type: "promo",
    title: null,
    subtitle: null,
    body: null,
    sort: 4,
    active: true,
    config: {},
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
  {
    id: "section-richtext",
    type: "richtext",
    title: "Our Story",
    subtitle: null,
    body: null,
    sort: 5,
    active: false,
    config: {},
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
];

export interface BlockedIpRow {
  id: string;
  ip: string;
  reason: string | null;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  summary: string;
  metadata: Record<string, unknown>;
}
