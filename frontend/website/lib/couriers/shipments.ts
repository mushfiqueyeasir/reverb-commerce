import "server-only";

import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { mappedOrderStatus } from "./status";
import type { CourierProvider } from "./metadata";
import type { OrderShipmentRow } from "@/type/db";

export function courierEventKey(
  provider: CourierProvider,
  shipmentId: string,
  eventName: string,
  providerTime: string | null,
  payload: unknown,
): string {
  return createHash("sha256")
    .update(
      JSON.stringify({ provider, shipmentId, eventName, providerTime, payload }),
    )
    .digest("hex");
}

function validDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function applyCourierUpdate(input: {
  shipment: OrderShipmentRow;
  eventName: string;
  status: string;
  message: string | null;
  providerTime: string | null;
  payload: unknown;
  eventKey?: string;
}): Promise<{ duplicate?: boolean; error?: string }> {
  const admin = createSupabaseAdminClient();
  const providerTime = validDate(input.providerTime);
  const eventKey =
    input.eventKey ??
    courierEventKey(
      input.shipment.provider,
      input.shipment.id,
      input.eventName,
      providerTime,
      input.payload,
    );

  const { data, error } = await admin.rpc("apply_courier_event", {
    p_shipment_id: input.shipment.id,
    p_provider: input.shipment.provider,
    p_event_key: eventKey,
    p_event_name: input.eventName,
    p_courier_status: input.status,
    p_message: input.message,
    p_provider_time: providerTime,
    p_payload:
      input.payload && typeof input.payload === "object" ? input.payload : {},
    p_next_order_status: mappedOrderStatus(input.shipment.provider, input.status),
  });
  if (error) return { error: error.message };
  return (data as { duplicate?: boolean } | null)?.duplicate
    ? { duplicate: true }
    : {};
}
