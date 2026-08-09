import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSiteSettings } from "@/utility/getSettings";
import { productImageUrl } from "@/utility/imageUrl";
import {
  deliveryZoneLabel,
  shippingCostForZone,
  type DeliveryZone,
} from "@/lib/delivery";
import { sendOrderEmails } from "@/lib/email/sendOrderEmails";
import { writeAuditLog } from "@/lib/admin/auditLog";
import { computePromoDiscount } from "@/lib/promoCodes";
import { resolveActivePromoCode } from "@/lib/promoCodes.server";
import { appConfig } from "@/lib/config";
import { createBkashPayment } from "@/lib/payments/bkash";
import { getBkashSettings, isBkashReady } from "@/lib/payments/bkashSettings";
import { paymentMethodLabel } from "@/lib/payments/paymentLabels";
import type { OrderFormData } from "@/type/orderType";
import type { ProductImageRow } from "@/type/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function resolveZone(value: string | undefined): DeliveryZone {
  return value === "outside-dhaka" ? "outside-dhaka" : "inside-dhaka";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

interface CheckoutVariantRow {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  stock_quantity: number;
}

interface CheckoutProductRow {
  id: string;
  title: string;
  current_price: number;
  status: string;
}

async function failUnpaidOrder(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  orderId: string,
) {
  await supabase.rpc("delete_unpaid_gateway_order", {
    p_order_id: orderId,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: OrderFormData = await request.json();

    if (!body.delivery || !body.items || !body.totals) {
      return NextResponse.json(
        { error: "Delivery, items, and totals are required" },
        { status: 400 },
      );
    }

    const { firstName, lastName, address, city, phone } = body.delivery;
    const customerEmail = (body.delivery.email ?? "").trim();
    const paymentMethod =
      body.paymentMethod === "bkash" ? ("bkash" as const) : ("cod" as const);

    if (!firstName || !lastName || !address || !city || !phone) {
      return NextResponse.json(
        { error: "Please complete all delivery information" },
        { status: 400 },
      );
    }

    if (!customerEmail || !isValidEmail(customerEmail)) {
      return NextResponse.json(
        { error: "A valid email address is required for order confirmation" },
        { status: 400 },
      );
    }

    if (body.items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const requestedItems = body.items.map((item) => ({
      productId: item.product,
      variantId: item.variantId,
      quantity: Number(item.quantity),
    }));

    if (
      requestedItems.some(
        (item) =>
          !item.productId ||
          !item.variantId ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1,
      )
    ) {
      return NextResponse.json(
        { error: "Every cart item must have a valid variant and quantity." },
        { status: 400 },
      );
    }

    const variantIds = [
      ...new Set(requestedItems.map((item) => item.variantId)),
    ];
    const { data: variantData, error: variantError } = await supabase
      .from("product_variants")
      .select("id, product_id, size, color, stock_quantity")
      .in("id", variantIds);
    if (variantError) throw variantError;

    const variants = (variantData as CheckoutVariantRow[] | null) ?? [];
    const productIds = [
      ...new Set(variants.map((variant) => variant.product_id)),
    ];
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("id, title, current_price, status")
      .in("id", productIds);
    if (productError) throw productError;

    const variantById = new Map(
      variants.map((variant) => [variant.id, variant]),
    );
    const productById = new Map(
      ((productData as CheckoutProductRow[] | null) ?? []).map((product) => [
        product.id,
        product,
      ]),
    );
    const authoritativeItems = requestedItems.map((requested) => {
      const variant = variantById.get(requested.variantId);
      const product = variant ? productById.get(variant.product_id) : null;
      if (
        !variant ||
        !product ||
        product.status !== "active" ||
        variant.product_id !== requested.productId
      ) {
        throw new Error("A cart item is no longer available.");
      }
      if (variant.stock_quantity < requested.quantity) {
        throw new Error(`Insufficient stock for ${product.title}.`);
      }
      return {
        productId: product.id,
        variantId: variant.id,
        title: product.title,
        size: variant.size,
        color: variant.color,
        quantity: requested.quantity,
        unitPrice: Number(product.current_price),
      };
    });

    const settings = await getSiteSettings();
    const zone = resolveZone(body.delivery.shippingMethod);
    const shipping = shippingCostForZone(settings.deliveryCharges, zone);
    const subtotal = authoritativeItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    if (paymentMethod === "bkash") {
      const bkash = await getBkashSettings();
      if (!isBkashReady(bkash)) {
        return NextResponse.json(
          { error: "bKash payments are not available right now." },
          { status: 400 },
        );
      }
      if ((settings.currency || "BDT").toUpperCase() !== "BDT") {
        return NextResponse.json(
          { error: "bKash requires store currency BDT." },
          { status: 400 },
        );
      }
    }

    let discount = 0;
    let discountPercent: number | undefined;
    let promoCode: string | null = null;
    const requestedCode =
      body.promoCode?.trim() || body.totals.promo_code?.trim() || "";

    if (requestedCode) {
      const resolved = await resolveActivePromoCode(requestedCode);
      if (resolved.error || !resolved.promo) {
        return NextResponse.json(
          { error: resolved.error || "Invalid promo code." },
          { status: 400 },
        );
      }
      promoCode = resolved.promo.code;
      discountPercent = resolved.promo.percent;
      discount = computePromoDiscount(subtotal, resolved.promo.percent);
    }

    const total = Math.max(0, subtotal - discount) + shipping;

    const payload = {
      delivery: {
        country: body.delivery.country?.trim() ?? "",
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address: address.trim(),
        city: city.trim(),
        postalCode: body.delivery.postalCode?.trim() ?? "",
        phone: phone.trim(),
        email: customerEmail,
        shippingMethod: zone,
      },
      items: authoritativeItems.map((item) => ({
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
      totals: {
        subtotal,
        shipping,
        discount,
        discount_percent: discountPercent ?? null,
        promo_code: promoCode,
        total,
      },
      notes: body.notes?.trim() ?? "",
      payment_method: paymentMethod,
    };

    const { data, error } = await supabase.rpc("place_order", { payload });

    if (error) throw error;

    const result = data as {
      id: string;
      order_number: string;
      totals: {
        subtotal: number;
        shipping: number;
        discount: number;
        discount_percent: number;
        promo_code: string | null;
        total: number;
      };
    };
    const placedSubtotal = Number(result.totals.subtotal) || 0;
    const placedShipping = Number(result.totals.shipping) || 0;
    const placedDiscount = Number(result.totals.discount) || 0;
    const placedTotal = Number(result.totals.total) || 0;
    const customerName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const deliveryAddress = [
      address.trim(),
      city.trim(),
      body.delivery.postalCode?.trim(),
      body.delivery.country?.trim(),
    ]
      .filter(Boolean)
      .join(", ");

    if (paymentMethod === "bkash") {
      try {
        const origin = (appConfig.siteUrl || request.nextUrl.origin).replace(
          /\/$/,
          "",
        );
        const callbackURL = `${origin}/api/payment/bkash/callback`;
        const payment = await createBkashPayment({
          amount: placedTotal,
          merchantInvoiceNumber: result.order_number,
          payerReference: phone.trim().replace(/\D/g, "").slice(-11) || "01",
          callbackURL,
        });

        await supabase
          .from("orders")
          .update({
            bkash_payment_id: payment.paymentID,
            updated_at: new Date().toISOString(),
          })
          .eq("id", result.id);

        await writeAuditLog({
          action: "create",
          entity: "order",
          entityId: result.id,
          summary: promoCode
            ? `New bKash order ${result.order_number} (promo ${promoCode})`
            : `New bKash order ${result.order_number}`,
          metadata: {
            payment_method: "bkash",
            bkash_payment_id: payment.paymentID,
            promo_code: promoCode,
            discount,
            discount_percent: discountPercent,
          },
        });

        return NextResponse.json(
          {
            success: true,
            id: result.id,
            orderNumber: result.order_number,
            redirectUrl: payment.bkashURL,
            message: "Redirecting to bKash",
          },
          { status: 200 },
        );
      } catch (err) {
        await failUnpaidOrder(supabase, result.id);
        return NextResponse.json(
          {
            error:
              err instanceof Error
                ? err.message
                : "Failed to start bKash payment. Please try again.",
          },
          { status: 502 },
        );
      }
    }

    // COD — send emails immediately
    try {
      const productIds = [
        ...new Set(authoritativeItems.map((item) => item.productId)),
      ];
      const imageByProduct = new Map<string, string>();
      if (productIds.length > 0) {
        const { data: imageRows } = await supabase
          .from("product_images")
          .select("product_id, path, is_main, sort")
          .in("product_id", productIds)
          .order("is_main", { ascending: false })
          .order("sort", { ascending: true });

        for (const row of (imageRows as ProductImageRow[] | null) ?? []) {
          if (imageByProduct.has(row.product_id)) continue;
          const url = productImageUrl(row.path);
          if (url) imageByProduct.set(row.product_id, url);
        }
      }

      await sendOrderEmails({
        orderNumber: result.order_number,
        customerName,
        customerEmail,
        customerPhone: phone.trim(),
        deliveryAddress,
        shippingLabel: `${paymentMethodLabel("cod")} · ${deliveryZoneLabel(zone)}`,
        items: authoritativeItems.map((item) => ({
          title: item.title,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          imageUrl: imageByProduct.get(item.productId) ?? null,
        })),
        subtotal: placedSubtotal,
        shipping: placedShipping,
        discount: placedDiscount,
        discountPercent,
        promoCode,
        total: placedTotal,
        currencyLabel: settings.currency || "BDT",
        storeName: settings.store_name || "Store",
        logoUrl: settings.logoUrl,
        palette: settings.palette,
      });
    } catch {
      // Ignore mail errors — order is already placed
    }

    await writeAuditLog({
      action: "create",
      entity: "order",
      entityId: result.id,
      summary: promoCode
        ? `New storefront order ${result.order_number} (promo ${promoCode})`
        : `New storefront order ${result.order_number}`,
      metadata: promoCode
        ? {
            payment_method: "cod",
            promo_code: promoCode,
            discount,
            discount_percent: discountPercent,
          }
        : { payment_method: "cod" },
    });

    return NextResponse.json(
      {
        success: true,
        id: result.id,
        orderNumber: result.order_number,
        message: "Order placed successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/stock|variant|cart item|unavailable/i.test(message)) {
      return NextResponse.json(
        { error: message || "A cart item is no longer available." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to place order. Please try again later." },
      { status: 500 },
    );
  }
}
