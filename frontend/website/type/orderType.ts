export interface OrderItemInput {
  product: string; // product id (uuid)
  variantId: string;
  title?: string;
  size: string | null;
  color?: string | null;
  quantity: number;
  unitPrice: number;
}

export interface OrderFormData {
  delivery: {
    country: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    postalCode?: string;
    phone: string;
    /** Customer email for order confirmation */
    email?: string;
    shippingMethod?: "inside-dhaka" | "outside-dhaka";
  };
  items: OrderItemInput[];
  totals: {
    subtotal: number;
    shipping: number;
    total: number;
    discount?: number;
    discount_percent?: number;
    promo_code?: string | null;
  };
  /** Optional checkout promo code (validated server-side). */
  promoCode?: string | null;
  notes?: string;
  paymentMethod?: "cod" | "bkash";
}

export interface OrderFormResponse {
  success: boolean;
  id?: string;
  orderNumber?: string;
  redirectUrl?: string;
  message?: string;
  error?: string;
}

export interface TrackOrderItem {
  title: string;
  size: string | null;
  color: string | null;
  quantity: number;
  unitPrice: number;
}

export interface TrackOrderResult {
  orderNumber: string;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  createdAt: string;
  paymentMethod: string;
  paymentStatus?: string;
  bkashTrxId?: string | null;
  courier?: {
    provider: "pathao" | "steadfast" | "redx";
    trackingCode: string | null;
    status: string | null;
    message: string | null;
    updatedAt: string | null;
    events: {
      status: string;
      message: string | null;
      time: string;
    }[];
  } | null;
  items: TrackOrderItem[];
  totals: {
    subtotal: number;
    shipping: number;
    total: number;
    discount?: number;
    discount_percent?: number;
    promo_code?: string | null;
  };
  delivery: {
    name: string;
    city: string | null;
    zone: string;
  };
}
