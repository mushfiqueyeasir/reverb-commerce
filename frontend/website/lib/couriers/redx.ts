import "server-only";

import { courierFetch } from "./http";
import type { CourierAdapter, CourierArea, CourierStore } from "./types";

function baseUrl(sandbox: boolean): string {
  return sandbox
    ? "https://sandbox.redx.com.bd/v1.0.0-beta"
    : "https://openapi.redx.com.bd/v1.0.0-beta";
}

function request<T>(
  sandbox: boolean,
  token: string | null,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const accessToken = token?.startsWith("Bearer ")
    ? token
    : `Bearer ${token ?? ""}`;
  return courierFetch<T>(`${baseUrl(sandbox)}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "API-ACCESS-TOKEN": accessToken,
      ...init.headers,
    },
  });
}

function findList(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value as Record<string, unknown>[];
  if (!value || typeof value !== "object") return [];
  const data = value as Record<string, unknown>;
  for (const key of ["data", "areas", "pickup_stores", "stores"]) {
    const nested = data[key];
    if (Array.isArray(nested)) return nested as Record<string, unknown>[];
    if (nested && typeof nested === "object") {
      const deeper = findList(nested);
      if (deeper.length) return deeper;
    }
  }
  return [];
}

export const redxAdapter: CourierAdapter = {
  async testConnection(settings) {
    const stores = await this.listStores(settings);
    if (!stores.some((store) => store.id === settings.pickup_store_id)) {
      throw new Error("The selected REDX pickup store was not found.");
    }
  },

  async listStores(settings): Promise<CourierStore[]> {
    const response = await request<unknown>(
      settings.sandbox,
      settings.access_token,
      "/pickup/stores",
    );
    return findList(response)
      .map((item) => ({
        id: String(item.id ?? item.pickup_store_id ?? ""),
        name: String(item.name ?? item.store_name ?? "REDX pickup store"),
      }))
      .filter((item) => item.id);
  },

  async listAreas(settings, query): Promise<CourierArea[]> {
    const params = new URLSearchParams();
    if (query?.trim()) params.set("district_name", query.trim());
    const response = await request<unknown>(
      settings.sandbox,
      settings.access_token,
      `/areas${params.size ? `?${params.toString()}` : ""}`,
    );
    return findList(response)
      .map((item) => ({
        id: String(item.id ?? item.area_id ?? ""),
        name: String(item.name ?? item.area_name ?? item.full_name ?? ""),
      }))
      .filter((item) => item.id && item.name);
  },

  async createShipment(settings, input) {
    const response = await request<Record<string, unknown>>(
      settings.sandbox,
      settings.access_token,
      "/parcel",
      {
        method: "POST",
        body: JSON.stringify({
          customer_name: input.recipientName,
          customer_phone: input.recipientPhone,
          delivery_area: input.deliveryAreaName,
          delivery_area_id: Number(input.deliveryAreaId),
          customer_address: input.recipientAddress,
          merchant_invoice_id: input.orderNumber,
          cash_collection_amount: input.codAmount,
          parcel_weight: Math.round(input.weightKg * 1000),
          instruction: input.instruction || undefined,
          value: input.declaredValue,
          pickup_store_id: Number(settings.pickup_store_id),
        }),
      },
    );
    const data = (response.data ?? response) as Record<string, unknown>;
    const trackingId = String(data.tracking_id ?? data.trackingId ?? "");
    if (!trackingId) throw new Error("REDX did not return a tracking ID.");
    return {
      externalId: trackingId,
      trackingCode: trackingId,
      status: String(data.status ?? "pickup-pending"),
      message: typeof response.message === "string" ? response.message : null,
      raw: response,
    };
  },

  async getStatus(settings, externalId, trackingCode) {
    const id = trackingCode || externalId;
    const response = await request<Record<string, unknown>>(
      settings.sandbox,
      settings.access_token,
      `/parcel/info/${encodeURIComponent(id)}`,
    );
    const data = (response.data ?? response) as Record<string, unknown>;
    return {
      status: String(data.status ?? data.parcel_status ?? "unknown"),
      message:
        typeof data.message_en === "string"
          ? data.message_en
          : typeof response.message === "string"
            ? response.message
            : null,
      providerTime:
        typeof data.updated_at === "string"
          ? data.updated_at
          : typeof data.created_at === "string"
            ? data.created_at
            : null,
      raw: response,
    };
  },
};
