"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { writeAuditLog } from "@/lib/admin/auditLog";
import { ORDER_TRANSITIONS } from "@/lib/admin/format";
import { RESTOCK_ON_DELETE_STATUSES } from "@/lib/admin/orderStock";
import { getSiteSettings } from "@/utility/getSettings";
import { paymentMethodLabel } from "@/lib/payments/paymentLabels";
import type { InvoiceData } from "@/lib/admin/invoicePdf";
import type { OrderItemRow, OrderRow, OrderStatus } from "@/type/db";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getCourierSettings,
  courierSettingsReady,
} from "@/lib/couriers/settings";
import { courierAdapter } from "@/lib/couriers/registry";
import { COURIER_META } from "@/lib/couriers/metadata";
import { CourierApiError } from "@/lib/couriers/http";
import { applyCourierUpdate, courierEventKey } from "@/lib/couriers/shipments";
import type { CourierArea } from "@/lib/couriers/types";
import type { OrderShipmentRow } from "@/type/db";

export type CreateShipmentInput = {
  weightKg: number;
  instruction?: string | null;
  deliveryAreaId?: string | null;
  deliveryAreaName?: string | null;
};

export async function searchCourierAreas(
  query: string,
): Promise<{ data?: CourierArea[]; error?: string }> {
  const s = await requireAdminSession();
  if (!canWrite(s.role))
    return { error: "You do not have permission to do this." };
  const settings = await getCourierSettings();
  const active = Object.values(settings).find((item) => item.active);
  if (!active || active.provider !== "redx") return { data: [] };
  try {
    return {
      data: await courierAdapter("redx").listAreas(active, query.trim()),
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not load REDX areas.",
    };
  }
}

export async function createCourierShipment(
  orderId: string,
  input: CreateShipmentInput,
): Promise<{ error?: string }> {
  const s = await requireAdminSession();
  if (!canWrite(s.role))
    return { error: "You do not have permission to do this." };

  const admin = createSupabaseAdminClient();
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError || !order)
    return { error: orderError?.message ?? "Order not found." };

  const o = order as OrderRow;
  if (!(["confirmed", "processing"] as OrderStatus[]).includes(o.status)) {
    return { error: "Confirm the order before sending it to a courier." };
  }
  if (o.payment_method === "bkash" && o.payment_status !== "paid") {
    return { error: "Only paid bKash orders can be sent to a courier." };
  }

  const settings = await getCourierSettings();
  const active = Object.values(settings).find((item) => item.active);
  if (!active) return { error: "Activate a courier in Settings first." };
  if (!courierSettingsReady(active)) {
    return {
      error: `${COURIER_META[active.provider].label} configuration is incomplete.`,
    };
  }

  const weightKg = Number(input.weightKg);
  if (
    active.provider !== "steadfast" &&
    (!Number.isFinite(weightKg) || weightKg < 0.5 || weightKg > 10)
  ) {
    return { error: "Parcel weight must be between 0.5 and 10 kg." };
  }
  if (
    active.provider === "redx" &&
    (!input.deliveryAreaId || !input.deliveryAreaName)
  ) {
    return { error: "Select a REDX delivery area." };
  }

  const { data: items, error: itemsError } = await admin
    .from("order_items")
    .select("title, size, color, quantity")
    .eq("order_id", orderId);
  if (itemsError) return { error: itemsError.message };
  const recipientName =
    [o.delivery?.firstName, o.delivery?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || "Customer";
  const recipientPhone = o.delivery?.phone?.trim() ?? "";
  const recipientAddress = [
    o.delivery?.address,
    o.delivery?.city,
    o.delivery?.postalCode,
    o.delivery?.country,
  ]
    .filter(Boolean)
    .join(", ");
  if (!recipientPhone || !recipientAddress) {
    return {
      error: "The order needs a recipient phone number and delivery address.",
    };
  }

  const itemRows = (items ?? []) as Pick<
    OrderItemRow,
    "title" | "size" | "color" | "quantity"
  >[];
  const itemQuantity = itemRows.reduce((sum, item) => sum + item.quantity, 0);
  const itemDescription = itemRows
    .map((item) =>
      [item.title, item.size, item.color, `x${item.quantity}`]
        .filter(Boolean)
        .join(" "),
    )
    .join(", ")
    .slice(0, 500);
  const total = Number(o.totals?.total) || 0;
  const shipmentInput = {
    orderNumber: o.order_number,
    recipientName,
    recipientPhone,
    recipientAddress,
    codAmount: o.payment_method === "cod" ? total : 0,
    declaredValue: total,
    itemQuantity: Math.max(1, itemQuantity),
    itemDescription,
    weightKg:
      active.provider === "steadfast"
        ? Math.max(0.5, weightKg || 0.5)
        : weightKg,
    instruction: input.instruction?.trim() || null,
    deliveryAreaId: input.deliveryAreaId?.trim() || null,
    deliveryAreaName: input.deliveryAreaName?.trim() || null,
  };

  const { data: shipmentId, error: reserveError } = await admin.rpc(
    "reserve_courier_shipment",
    {
      p_order_id: orderId,
      p_provider: active.provider,
      p_delivery_area_id: shipmentInput.deliveryAreaId,
      p_delivery_area_name: shipmentInput.deliveryAreaName,
      p_parcel_weight: shipmentInput.weightKg,
      p_request_payload: shipmentInput,
      p_created_by: s.userId,
    },
  );
  if (reserveError || !shipmentId) {
    return {
      error:
        reserveError?.code === "23505"
          ? "This order has already been sent to a courier."
          : (reserveError?.message ?? "Could not reserve the shipment."),
    };
  }
  const { data: shipment, error: shipmentError } = await admin
    .from("order_shipments")
    .select("*")
    .eq("id", shipmentId)
    .single();
  if (shipmentError || !shipment) {
    return { error: shipmentError?.message ?? "Could not load the shipment." };
  }

  try {
    const result = await courierAdapter(active.provider).createShipment(
      active,
      shipmentInput,
    );
    const now = new Date().toISOString();
    const { error: updateError } = await admin
      .from("order_shipments")
      .update({
        sync_state: "synced",
        external_id: result.externalId,
        tracking_code: result.trackingCode,
        response_payload:
          result.raw && typeof result.raw === "object" ? result.raw : {},
        synced_at: now,
      })
      .eq("id", shipment.id);
    if (updateError) {
      const { error: fallbackError } = await admin
        .from("order_shipments")
        .update({
          sync_state: "unknown",
          external_id: result.externalId,
          tracking_code: result.trackingCode,
          courier_status: result.status,
          status_message: `Courier created the shipment, but local confirmation failed: ${updateError.message}`,
          response_payload:
            result.raw && typeof result.raw === "object" ? result.raw : {},
        })
        .eq("id", shipment.id)
        .eq("sync_state", "creating")
        .is("last_event_at", null);
      return {
        error: fallbackError
          ? `The courier created tracking ID ${result.trackingCode || result.externalId}, but local storage failed. Record this ID and do not send the order again.`
          : "The courier created this shipment, but local confirmation needs reconciliation. Use Refresh status; do not send it again.",
      };
    }

    const eventResult = await applyCourierUpdate({
      shipment: shipment as OrderShipmentRow,
      eventName: "shipment.created",
      status: result.status,
      message: result.message,
      providerTime: now,
      payload: result.raw,
      eventKey: courierEventKey(
        active.provider,
        shipment.id,
        "shipment.created",
        now,
        result.raw,
      ),
    });
    if (eventResult.error) return { error: eventResult.error };

    if (o.status === "confirmed") {
      await admin
        .from("orders")
        .update({ status: "processing", updated_at: now })
        .eq("id", orderId)
        .eq("status", "confirmed");
    }

    await writeAuditLog({
      actor: s,
      action: "create",
      entity: "shipment",
      entityId: shipment.id,
      summary: `Sent order ${o.order_number} to ${COURIER_META[active.provider].label}`,
      metadata: {
        orderId,
        provider: active.provider,
        externalId: result.externalId,
        trackingCode: result.trackingCode,
      },
    });
  } catch (error) {
    if (
      error instanceof CourierApiError &&
      error.status >= 400 &&
      error.status < 500
    ) {
      await admin
        .from("order_shipments")
        .delete()
        .eq("id", shipment.id)
        .eq("sync_state", "creating")
        .is("last_event_at", null);
    } else {
      await admin
        .from("order_shipments")
        .update({
          sync_state: "unknown",
          status_message:
            error instanceof Error ? error.message : "Courier request failed.",
        })
        .eq("id", shipment.id)
        .eq("sync_state", "creating")
        .is("last_event_at", null);
    }
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not create the courier shipment.",
    };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return {};
}

export async function refreshCourierShipment(
  orderId: string,
): Promise<{ error?: string }> {
  const s = await requireAdminSession();
  if (!canWrite(s.role))
    return { error: "You do not have permission to do this." };
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("order_shipments")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error || !data) return { error: error?.message ?? "Shipment not found." };
  const shipment = data as OrderShipmentRow;
  if (!shipment.external_id)
    return { error: "This shipment has no courier tracking ID yet." };
  const settings = await getCourierSettings();
  const providerSettings = settings[shipment.provider];
  if (!courierSettingsReady(providerSettings)) {
    return {
      error: `${COURIER_META[shipment.provider].label} credentials are unavailable.`,
    };
  }
  try {
    const result = await courierAdapter(shipment.provider).getStatus(
      providerSettings,
      shipment.external_id,
      shipment.tracking_code,
    );
    const applied = await applyCourierUpdate({
      shipment,
      eventName: "status.refresh",
      status: result.status,
      message: result.message,
      providerTime: result.providerTime,
      payload: result.raw,
    });
    if (applied.error) return { error: applied.error };
  } catch (refreshError) {
    return {
      error:
        refreshError instanceof Error
          ? refreshError.message
          : "Could not refresh courier status.",
    };
  }
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return {};
}

// Update an order's status, enforcing the allowed workflow transitions.
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ error?: string }> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: current, error: readError } = await supabase
    .from("orders")
    .select("status, order_number")
    .eq("id", orderId)
    .single();

  if (readError || !current) {
    return { error: readError?.message ?? "Order not found." };
  }

  const from = current.status as OrderStatus;

  // Delivered orders are final — never cancel / reverse.
  if (from === "delivered") {
    return { error: "Delivered orders cannot be cancelled or changed." };
  }

  const allowed = ORDER_TRANSITIONS[from] ?? [];
  if (!allowed.includes(status)) {
    return {
      error: `Cannot change status from "${from}" to "${status}".`,
    };
  }

  if (status === "cancelled") {
    const { data: shipment } = await supabase
      .from("order_shipments")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle();
    if (shipment) {
      return {
        error:
          "Courier-synced orders cannot be cancelled locally. Handle the parcel with the courier first.",
      };
    }
  }

  if (status === "cancelled" && from !== "cancelled") {
    const { error } = await supabase.rpc("cancel_order_safely", {
      p_order_id: orderId,
    });
    if (error) {
      if (/courier-synced/i.test(error.message)) {
        return {
          error:
            "Courier-synced orders cannot be cancelled locally. Handle the parcel with the courier first.",
        };
      }
      return { error: error.message };
    }
  } else {
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) return { error: error.message };
  }

  const orderNumber = current.order_number as string;
  await writeAuditLog({
    actor: s,
    action: "status_change",
    entity: "order",
    entityId: orderId,
    summary: `Changed order ${orderNumber} status from ${from} to ${status}`,
    metadata: {
      from,
      to: status,
      restocked: status === "cancelled",
    },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/inventory");
  return {};
}

// Save free-form internal notes on an order.
export async function saveOrderNotes(
  orderId: string,
  notes: string,
): Promise<{ error?: string }> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: orderRow } = await supabase
    .from("orders")
    .select("order_number")
    .eq("id", orderId)
    .maybeSingle();

  const { error } = await supabase
    .from("orders")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) return { error: error.message };

  const orderLabel = orderRow?.order_number ?? orderId;
  await writeAuditLog({
    actor: s,
    action: "update",
    entity: "order",
    entityId: orderId,
    summary: `Updated notes for order ${orderLabel}`,
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return {};
}

function toInvoiceData(
  o: OrderRow,
  orderItems: OrderItemRow[],
  settings: Awaited<ReturnType<typeof getSiteSettings>>,
): InvoiceData {
  const customerName =
    [o.delivery?.firstName, o.delivery?.lastName].filter(Boolean).join(" ") ||
    "Guest";
  const addressParts = [
    o.delivery?.address,
    o.delivery?.city,
    o.delivery?.postalCode,
    o.delivery?.country,
  ].filter(Boolean);

  return {
    orderNumber: o.order_number,
    createdAt: o.created_at,
    status: o.status,
    paymentMethod: paymentMethodLabel(o.payment_method),
    storeName: settings.store_name,
    storeEmail: settings.contact_email,
    storePhone: settings.contact_phone,
    currencyCode: settings.currency || "BDT",
    logoUrl: settings.logoUrl,
    palette: settings.palette,
    customerName,
    phone: o.delivery?.phone ?? null,
    addressLines: addressParts.map(String),
    deliveryZone: o.delivery?.shippingMethod
      ? o.delivery.shippingMethod === "outside-dhaka"
        ? "Outside Dhaka"
        : "Inside Dhaka"
      : null,
    items: orderItems.map((it) => ({
      title: it.title ?? "Item",
      size: it.size,
      color: it.color,
      quantity: it.quantity,
      unitPrice: Number(it.unit_price) || 0,
    })),
    subtotal: Number(o.totals?.subtotal) || 0,
    shipping: Number(o.totals?.shipping) || 0,
    discount: Number(o.totals?.discount) || 0,
    discountPercent: Number(o.totals?.discount_percent) || undefined,
    promoCode: o.totals?.promo_code ?? null,
    total: Number(o.totals?.total) || 0,
  };
}

/** Load invoice payloads for bulk PDF download. */
export async function getOrdersInvoiceData(
  orderIds: string[],
): Promise<{ data?: InvoiceData[]; error?: string }> {
  await requireAdminSession();
  const ids = [...new Set(orderIds.filter(Boolean))];
  if (!ids.length) return { error: "No orders selected." };
  if (ids.length > 50) return { error: "Select at most 50 orders at a time." };

  const supabase = await createSupabaseServerClient();
  const [{ data: orders, error }, settings] = await Promise.all([
    supabase.from("orders").select("*").in("id", ids),
    getSiteSettings(),
  ]);
  if (error) return { error: error.message };

  const list = (orders as OrderRow[] | null) ?? [];
  if (!list.length) return { error: "No orders found." };

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .in(
      "order_id",
      list.map((o) => o.id),
    );
  if (itemsError) return { error: itemsError.message };

  const byOrder = new Map<string, OrderItemRow[]>();
  for (const it of (items as OrderItemRow[] | null) ?? []) {
    const bucket = byOrder.get(it.order_id) ?? [];
    bucket.push(it);
    byOrder.set(it.order_id, bucket);
  }

  const orderById = new Map(list.map((o) => [o.id, o]));
  const data = ids
    .map((id) => orderById.get(id))
    .filter((o): o is OrderRow => Boolean(o))
    .map((o) => toInvoiceData(o, byOrder.get(o.id) ?? [], settings));

  return { data };
}

/** Permanently delete one or more orders (items cascade). */
export async function deleteOrders(
  orderIds: string[],
): Promise<{ error?: string } | void> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }

  const ids = [...new Set(orderIds.filter(Boolean))];
  if (!ids.length) return { error: "No orders selected." };
  if (ids.length > 50) return { error: "Select at most 50 orders at a time." };

  const supabase = await createSupabaseServerClient();
  const { data: existing, error: readError } = await supabase
    .from("orders")
    .select("id, order_number, status")
    .in("id", ids);
  if (readError) return { error: readError.message };

  const rows = (existing ?? []) as {
    id: string;
    order_number: string;
    status: OrderStatus;
  }[];
  if (!rows.length) return { error: "No orders found." };

  const { data: linkedShipments, error: shipmentError } = await supabase
    .from("order_shipments")
    .select("order_id")
    .in(
      "order_id",
      rows.map((row) => row.id),
    );
  if (shipmentError) return { error: shipmentError.message };
  if (linkedShipments?.length) {
    const locked = new Set(linkedShipments.map((row) => row.order_id));
    const numbers = rows
      .filter((row) => locked.has(row.id))
      .map((row) => row.order_number)
      .join(", ");
    return {
      error: `Cannot delete courier-synced order${locked.size === 1 ? "" : "s"}: ${numbers}.`,
    };
  }

  // Only unshipped orders return stock. Cancelled already restocked on cancel;
  // shipped/delivered keep stock out (goods left / delivered).
  const restockIds = rows
    .filter((r) => RESTOCK_ON_DELETE_STATUSES.includes(r.status as OrderStatus))
    .map((r) => r.id);

  const { error } = await supabase.rpc("delete_orders_safely", {
    p_order_ids: rows.map((row) => row.id),
  });
  if (error) {
    if (/courier-synced/i.test(error.message)) {
      return { error: "Courier-synced orders cannot be deleted." };
    }
    return { error: error.message };
  }

  const numbers = rows.map((r) => r.order_number).join(", ");
  await writeAuditLog({
    actor: s,
    action: "delete",
    entity: "order",
    entityId: rows.length === 1 ? rows[0].id : null,
    summary:
      rows.length === 1
        ? `Deleted order ${rows[0].order_number}`
        : `Deleted ${rows.length} orders (${numbers})`,
    metadata: {
      ids: rows.map((r) => r.id),
      count: rows.length,
      restockedIds: restockIds,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/inventory");
}
