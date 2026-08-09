import "server-only";

import { courierFetch } from "./http";
import type {
  CourierAdapter,
  CourierArea,
  CourierProviderSettings,
  CourierStore,
} from "./types";

function baseUrl(settings: CourierProviderSettings): string {
  return settings.sandbox
    ? "https://courier-api-sandbox.pathao.com"
    : "https://api-hermes.pathao.com";
}

async function accessToken(settings: CourierProviderSettings): Promise<string> {
  const response = await courierFetch<{ access_token?: string }>(
    `${baseUrl(settings)}/aladdin/api/v1/issue-token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: settings.client_id,
        client_secret: settings.client_secret,
        grant_type: "password",
        username: settings.username,
        password: settings.password,
      }),
    },
  );
  if (!response.access_token)
    throw new Error("Pathao did not return an access token.");
  return response.access_token;
}

async function request<T>(
  settings: CourierProviderSettings,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await accessToken(settings);
  return courierFetch<T>(`${baseUrl(settings)}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
}

function dataList<T>(value: unknown): T[] {
  if (!value || typeof value !== "object") return [];
  const root = value as Record<string, unknown>;
  const data = root.data;
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const nested = data as Record<string, unknown>;
    if (Array.isArray(nested.data)) return nested.data as T[];
  }
  return [];
}

export const pathaoAdapter: CourierAdapter = {
  async testConnection(settings) {
    await accessToken(settings);
    const stores = await this.listStores(settings);
    if (!stores.some((store) => store.id === settings.pickup_store_id)) {
      throw new Error("The selected Pathao pickup store was not found.");
    }
  },

  async listStores(settings): Promise<CourierStore[]> {
    const response = await request<unknown>(settings, "/aladdin/api/v1/stores");
    return dataList<Record<string, unknown>>(response)
      .filter((item) => item.is_active === 1 || item.is_active === true)
      .map((item) => ({
        id: String(item.store_id ?? ""),
        name: String(item.store_name ?? item.name ?? "Pathao store"),
      }))
      .filter((item) => item.id);
  },

  async listAreas(settings, query): Promise<CourierArea[]> {
    const response = await request<unknown>(
      settings,
      "/aladdin/api/v1/city-list",
    );
    const search = query?.trim().toLowerCase() ?? "";
    return dataList<Record<string, unknown>>(response)
      .map((item) => ({
        id: String(item.city_id ?? ""),
        name: String(item.city_name ?? ""),
      }))
      .filter(
        (item) =>
          item.id && (!search || item.name.toLowerCase().includes(search)),
      );
  },

  async createShipment(settings, input) {
    const response = await request<Record<string, unknown>>(
      settings,
      "/aladdin/api/v1/orders",
      {
        method: "POST",
        body: JSON.stringify({
          store_id: Number(settings.pickup_store_id),
          merchant_order_id: input.orderNumber,
          recipient_name: input.recipientName,
          recipient_phone: input.recipientPhone,
          recipient_address: input.recipientAddress,
          delivery_type: 48,
          item_type: 2,
          special_instruction: input.instruction || undefined,
          item_quantity: input.itemQuantity,
          item_weight: input.weightKg,
          item_description: input.itemDescription,
          amount_to_collect: input.codAmount,
        }),
      },
    );
    const data = (response.data ?? response) as Record<string, unknown>;
    const externalId = String(data.consignment_id ?? "");
    if (!externalId) throw new Error("Pathao did not return a consignment ID.");
    return {
      externalId,
      trackingCode: externalId,
      status: String(data.order_status ?? "Pending"),
      message: typeof response.message === "string" ? response.message : null,
      raw: response,
    };
  },

  async getStatus(settings, externalId) {
    const response = await request<Record<string, unknown>>(
      settings,
      `/aladdin/api/v1/orders/${encodeURIComponent(externalId)}/info`,
    );
    const data = (response.data ?? response) as Record<string, unknown>;
    return {
      status: String(data.order_status_slug ?? data.order_status ?? "unknown"),
      message: typeof response.message === "string" ? response.message : null,
      providerTime:
        typeof data.updated_at === "string" ? data.updated_at : null,
      raw: response,
    };
  },
};
