import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCourierSettings } from "@/lib/couriers/settings";
import { isCourierProvider, type CourierProvider } from "@/lib/couriers/metadata";
import { applyCourierUpdate, courierEventKey } from "@/lib/couriers/shipments";
import type { OrderShipmentRow } from "@/type/db";

export const dynamic = "force-dynamic";

function secureEqual(received: string, expected: string): boolean {
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function webhookResponse(
  provider: CourierProvider,
  secret: string,
  body: Record<string, unknown>,
  status = 200,
): NextResponse {
  const response = NextResponse.json(body, { status });
  if (provider === "pathao") {
    response.headers.set(
      "X-Pathao-Merchant-Webhook-Integration-Secret",
      secret,
    );
  }
  return response;
}

function authenticated(
  request: NextRequest,
  provider: CourierProvider,
  secret: string,
): boolean {
  if (provider === "pathao") {
    return secureEqual(request.headers.get("x-pathao-signature") ?? "", secret);
  }
  if (provider === "steadfast") {
    const authorization = request.headers.get("authorization") ?? "";
    return secureEqual(authorization, `Bearer ${secret}`);
  }
  return secureEqual(request.nextUrl.searchParams.get("token") ?? "", secret);
}

function stringValue(payload: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value).trim();
      if (text) return text;
    }
  }
  return "";
}

async function findShipment(
  provider: CourierProvider,
  externalId: string,
  invoice: string,
): Promise<OrderShipmentRow | null> {
  const admin = createSupabaseAdminClient();
  if (externalId) {
    const { data: byExternalId } = await admin
      .from("order_shipments")
      .select("*")
      .eq("provider", provider)
      .eq("external_id", externalId)
      .maybeSingle();
    if (byExternalId) return byExternalId as OrderShipmentRow;
    const { data: byTrackingCode } = await admin
      .from("order_shipments")
      .select("*")
      .eq("provider", provider)
      .eq("tracking_code", externalId)
      .maybeSingle();
    if (byTrackingCode) return byTrackingCode as OrderShipmentRow;
  }
  if (invoice) {
    const { data: order } = await admin
      .from("orders")
      .select("id")
      .eq("order_number", invoice)
      .maybeSingle();
    if (order) {
      const { data } = await admin
        .from("order_shipments")
        .select("*")
        .eq("order_id", order.id)
        .eq("provider", provider)
        .maybeSingle();
      if (data) return data as OrderShipmentRow;
    }
  }
  return null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: rawProvider } = await context.params;
  if (!isCourierProvider(rawProvider)) {
    return NextResponse.json({ error: "Unknown courier." }, { status: 404 });
  }
  const provider = rawProvider;
  const settings = await getCourierSettings();
  const secret = settings[provider].webhook_secret;
  if (!secret || !authenticated(request, provider, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return webhookResponse(provider, secret, { error: "Invalid JSON" }, 400);
  }

  const externalId =
    provider === "pathao"
      ? stringValue(payload, "consignment_id")
      : provider === "steadfast"
        ? stringValue(payload, "consignment_id", "tracking_code")
        : stringValue(payload, "tracking_number", "tracking_id");
  const invoice = stringValue(
    payload,
    "merchant_order_id",
    "invoice",
    "invoice_number",
  );
  const eventName =
    provider === "pathao"
      ? stringValue(payload, "event") || "order.updated"
      : stringValue(payload, "notification_type") || "status.updated";
  const receivedStatus = stringValue(payload, "status", "delivery_status");
  const message =
    stringValue(
      payload,
      "tracking_message",
      "message_en",
      "message",
      "reason",
    ) || null;
  const providerTime =
    stringValue(payload, "timestamp", "updated_at") || null;
  const shipment = await findShipment(provider, externalId, invoice);
  if (!shipment) {
    return webhookResponse(
      provider,
      secret,
      { accepted: true, matched: false },
      202,
    );
  }
  const status =
    provider === "pathao"
      ? eventName
      : receivedStatus || shipment.courier_status || "unknown";

  const result = await applyCourierUpdate({
    shipment,
    eventName,
    status,
    message,
    providerTime,
    payload,
    eventKey: courierEventKey(
      provider,
      shipment.id,
      eventName,
      providerTime,
      payload,
    ),
  });
  if (result.error) {
    return webhookResponse(provider, secret, { error: result.error }, 500);
  }

  return webhookResponse(provider, secret, {
    success: true,
    duplicate: result.duplicate ?? false,
  });
}
