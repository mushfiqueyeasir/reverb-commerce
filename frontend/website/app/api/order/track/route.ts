import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { deliveryZoneLabel } from "@/lib/delivery";
import type {
  OrderDelivery,
  OrderItemRow,
  OrderRow,
  OrderStatus,
} from "@/type/db";
import type { CourierEventRow, OrderShipmentRow } from "@/type/db";

export const dynamic = "force-dynamic";

function normalizeOrderNumber(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { orderNumber?: unknown };
    const orderNumber = normalizeOrderNumber(body.orderNumber);

    if (!orderNumber) {
      return NextResponse.json(
        { error: "Please enter an order number." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, order_number, status, delivery, totals, payment_method, payment_status, bkash_trx_id, created_at",
      )
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json(
        { error: "Failed to look up order. Please try again." },
        { status: 500 },
      );
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const o = order as Pick<
      OrderRow,
      | "id"
      | "order_number"
      | "status"
      | "delivery"
      | "totals"
      | "payment_method"
      | "payment_status"
      | "bkash_trx_id"
      | "created_at"
    >;

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("title, size, color, quantity, unit_price")
      .eq("order_id", o.id)
      .order("title", { ascending: true });

    if (itemsError) {
      return NextResponse.json(
        { error: "Failed to look up order. Please try again." },
        { status: 500 },
      );
    }

    const { data: shipmentData } = await supabase
      .from("order_shipments")
      .select("*")
      .eq("order_id", o.id)
      .maybeSingle();
    const shipment = (shipmentData as OrderShipmentRow | null) ?? null;
    const { data: courierEventData } = shipment
      ? await supabase
          .from("courier_events")
          .select("event_name, courier_status, message, provider_time, created_at")
          .eq("shipment_id", shipment.id)
          .order("provider_time", { ascending: false, nullsFirst: false })
          .limit(10)
      : { data: [] };
    const courierEvents =
      (courierEventData as Pick<
        CourierEventRow,
        | "event_name"
        | "courier_status"
        | "message"
        | "provider_time"
        | "created_at"
      >[] | null) ?? [];

    const delivery = (o.delivery ?? {}) as OrderDelivery;
    const name =
      [delivery.firstName, delivery.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || "Customer";
    const zone = delivery.shippingMethod ?? "inside-dhaka";

    return NextResponse.json({
      orderNumber: o.order_number,
      status: o.status as OrderStatus,
      createdAt: o.created_at,
      paymentMethod: o.payment_method || "cod",
      paymentStatus: o.payment_status || "unpaid",
      bkashTrxId: o.bkash_trx_id ?? null,
      courier: shipment
        ? {
            provider: shipment.provider,
            trackingCode: shipment.tracking_code ?? shipment.external_id,
            status: shipment.courier_status,
            message: shipment.status_message,
            updatedAt: shipment.last_event_at ?? shipment.updated_at,
            events: courierEvents.map((event) => ({
              status: event.courier_status ?? event.event_name,
              message: event.message,
              time: event.provider_time ?? event.created_at,
            })),
          }
        : null,
      items: (
        (items as Pick<
          OrderItemRow,
          "title" | "size" | "color" | "quantity" | "unit_price"
        >[]) ?? []
      ).map((item) => ({
        title: item.title ?? "Item",
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price) || 0,
      })),
      totals: {
        subtotal: Number(o.totals?.subtotal) || 0,
        shipping: Number(o.totals?.shipping) || 0,
        discount: Number(o.totals?.discount) || 0,
        discount_percent: Number(o.totals?.discount_percent) || undefined,
        promo_code: o.totals?.promo_code ?? null,
        total: Number(o.totals?.total) || 0,
      },
      delivery: {
        name,
        city: delivery.city?.trim() || null,
        zone: deliveryZoneLabel(zone),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to look up order. Please try again." },
      { status: 500 },
    );
  }
}
