import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { appConfig } from "@/lib/config";
import { writeAuditLog } from "@/lib/admin/auditLog";
import { executeBkashPayment, queryBkashPayment } from "@/lib/payments/bkash";
import { sendOrderEmails } from "@/lib/email/sendOrderEmails";
import { getSiteSettings } from "@/utility/getSettings";
import { productImageUrl } from "@/utility/imageUrl";
import { deliveryZoneLabel, type DeliveryZone } from "@/lib/delivery";
import type {
  OrderDelivery,
  OrderItemRow,
  OrderRow,
  ProductImageRow,
} from "@/type/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function siteOrigin(request: NextRequest) {
  return (appConfig.siteUrl || request.nextUrl.origin).replace(/\/$/, "");
}

function isTerminalPaymentFailure(status: string | undefined): boolean {
  return ["failed", "cancelled", "canceled"].includes(
    (status ?? "").trim().toLowerCase(),
  );
}

function redirectTo(
  request: NextRequest,
  path: string,
  params?: Record<string, string>,
) {
  const url = new URL(path, `${siteOrigin(request)}/`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return NextResponse.redirect(url);
}

async function removeUnpaidOrder(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  orderId: string,
) {
  await supabase.rpc("delete_unpaid_gateway_order", {
    p_order_id: orderId,
  });
}

export async function GET(request: NextRequest) {
  const paymentID = request.nextUrl.searchParams.get("paymentID")?.trim();
  const status = (
    request.nextUrl.searchParams.get("status") ?? ""
  ).toLowerCase();

  if (!paymentID) {
    return redirectTo(request, "/checkout", {
      payment: "failed",
      reason: "missing_payment",
    });
  }

  const supabase = createSupabaseAdminClient();
  const { data: orderRow } = await supabase
    .from("orders")
    .select("*")
    .eq("bkash_payment_id", paymentID)
    .maybeSingle();

  const order = orderRow as OrderRow | null;

  if (!order) {
    return redirectTo(request, "/checkout", {
      payment: "failed",
      reason: "order_not_found",
    });
  }

  if (order.payment_status === "paid" && order.bkash_trx_id) {
    return redirectTo(request, "/track-order", {
      order: order.order_number,
      paid: "1",
    });
  }

  if (status !== "success" && status !== "completed") {
    if (order.payment_status !== "paid") {
      await removeUnpaidOrder(supabase, order.id);
      await writeAuditLog({
        action: "update",
        entity: "order",
        entityId: order.id,
        summary: `bKash payment ${status || "failed"} for ${order.order_number}`,
        metadata: { paymentID, status },
      });
    }
    return redirectTo(request, "/checkout", {
      payment: "failed",
      reason: status || "failed",
    });
  }

  try {
    let recoveryOnly = false;
    const { data: claimedOrder, error: claimError } = await supabase
      .from("orders")
      .update({
        payment_status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("payment_status", "unpaid")
      .neq("status", "cancelled")
      .select("id")
      .maybeSingle();
    if (claimError) throw claimError;
    if (!claimedOrder) {
      const { data: current } = await supabase
        .from("orders")
        .select("payment_status, bkash_trx_id, updated_at")
        .eq("id", order.id)
        .maybeSingle();
      if (current?.payment_status === "paid" && current.bkash_trx_id) {
        return redirectTo(request, "/track-order", {
          order: order.order_number,
          paid: "1",
        });
      }
      const processingAge = current?.updated_at
        ? Date.now() - new Date(current.updated_at).getTime()
        : 0;
      if (
        current?.payment_status === "processing" &&
        processingAge >= 120_000
      ) {
        recoveryOnly = true;
      } else {
        return redirectTo(request, "/checkout", {
          payment: "failed",
          reason: "payment_processing",
        });
      }
    }

    let result;
    if (recoveryOnly) {
      result = await queryBkashPayment(paymentID);
    } else {
      try {
        result = await executeBkashPayment(paymentID);
      } catch {
        result = await queryBkashPayment(paymentID);
      }
    }

    const trxOk =
      Boolean(result.trxID) &&
      (result.transactionStatus === "Completed" ||
        result.statusCode === "0000");

    if (!trxOk) {
      result = await queryBkashPayment(paymentID);
    }

    const paid =
      Boolean(result.trxID) &&
      (result.transactionStatus === "Completed" ||
        result.statusCode === "0000");

    if (!paid) {
      if (recoveryOnly || !isTerminalPaymentFailure(result.transactionStatus)) {
        return redirectTo(request, "/checkout", {
          payment: "failed",
          reason: "payment_processing",
        });
      }
      await supabase
        .from("orders")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .eq("payment_status", "processing");
      await removeUnpaidOrder(supabase, order.id);
      await writeAuditLog({
        action: "update",
        entity: "order",
        entityId: order.id,
        summary: `bKash execute failed for ${order.order_number}`,
        metadata: {
          paymentID,
          statusMessage: result.statusMessage,
          transactionStatus: result.transactionStatus,
        },
      });
      return redirectTo(request, "/checkout", {
        payment: "failed",
        reason: "execute_failed",
      });
    }

    const { data: completedOrder, error: completionError } = await supabase
      .from("orders")
      .update({
        status: "confirmed",
        payment_status: "paid",
        bkash_trx_id: result.trxID ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("payment_status", "processing")
      .neq("status", "cancelled")
      .select("id")
      .maybeSingle();
    if (completionError || !completedOrder) {
      throw completionError ?? new Error("Could not finalize the paid order.");
    }

    // Send order emails only after successful payment
    try {
      const settings = await getSiteSettings();
      const delivery = (order.delivery ?? {}) as OrderDelivery;
      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);

      const orderItems = (items as OrderItemRow[] | null) ?? [];
      const productIds = [
        ...new Set(
          orderItems.map((i) => i.product_id).filter(Boolean) as string[],
        ),
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

      const customerName =
        [delivery.firstName, delivery.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() || "Customer";
      const deliveryAddress = [
        delivery.address,
        delivery.city,
        delivery.postalCode,
        delivery.country,
      ]
        .filter(Boolean)
        .join(", ");
      const zone = (delivery.shippingMethod ?? "inside-dhaka") as DeliveryZone;
      const customerEmail = (delivery.email ?? "").trim();

      if (customerEmail) {
        await sendOrderEmails({
          orderNumber: order.order_number,
          customerName,
          customerEmail,
          customerPhone: delivery.phone ?? "",
          deliveryAddress,
          shippingLabel: `bKash · ${deliveryZoneLabel(zone)}`,
          items: orderItems.map((item) => ({
            title: item.title ?? "Product",
            size: item.size,
            quantity: item.quantity,
            unitPrice: Number(item.unit_price) || 0,
            imageUrl: item.product_id
              ? (imageByProduct.get(item.product_id) ?? null)
              : null,
          })),
          subtotal: Number(order.totals?.subtotal) || 0,
          shipping: Number(order.totals?.shipping) || 0,
          discount: Number(order.totals?.discount) || 0,
          discountPercent: Number(order.totals?.discount_percent) || undefined,
          promoCode: order.totals?.promo_code ?? null,
          total: Number(order.totals?.total) || 0,
          currencyLabel: settings.currency || "BDT",
          storeName: settings.store_name || "Store",
          logoUrl: settings.logoUrl,
          palette: settings.palette,
        });
      }
    } catch {
      // Ignore mail errors — payment already succeeded
    }

    await writeAuditLog({
      action: "update",
      entity: "order",
      entityId: order.id,
      summary: `bKash payment completed for ${order.order_number}`,
      metadata: { paymentID, trxID: result.trxID },
    });

    return redirectTo(request, "/track-order", {
      order: order.order_number,
      paid: "1",
    });
  } catch {
    // Keep uncertain captures reserved for a later provider-status recovery.
    return redirectTo(request, "/checkout", {
      payment: "failed",
      reason: "callback_error",
    });
  }
}
