import "server-only";

import { courierFetch } from "./http";
import type { CourierAdapter } from "./types";

const BASE_URL = "https://portal.packzy.com/api/v1";

function request<T>(
  apiKey: string | null,
  secretKey: string | null,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  return courierFetch<T>(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Api-Key": apiKey ?? "",
      "Secret-Key": secretKey ?? "",
      ...init.headers,
    },
  });
}

export const steadfastAdapter: CourierAdapter = {
  async testConnection(settings) {
    await request(settings.api_key, settings.secret_key, "/get_balance");
  },

  async listStores() {
    return [];
  },

  async listAreas() {
    return [];
  },

  async createShipment(settings, input) {
    const response = await request<Record<string, unknown>>(
      settings.api_key,
      settings.secret_key,
      "/create_order",
      {
        method: "POST",
        body: JSON.stringify({
          invoice: input.orderNumber,
          recipient_name: input.recipientName,
          recipient_phone: input.recipientPhone,
          recipient_address: input.recipientAddress,
          cod_amount: input.codAmount,
          note: input.instruction || undefined,
          item_description: input.itemDescription,
          total_lot: input.itemQuantity,
          delivery_type: 0,
        }),
      },
    );
    const consignment = (response.consignment ?? response) as Record<
      string,
      unknown
    >;
    const externalId = String(consignment.consignment_id ?? "");
    if (!externalId)
      throw new Error("Steadfast did not return a consignment ID.");
    return {
      externalId,
      trackingCode: consignment.tracking_code
        ? String(consignment.tracking_code)
        : null,
      status: String(consignment.status ?? "in_review"),
      message: typeof response.message === "string" ? response.message : null,
      raw: response,
    };
  },

  async getStatus(settings, externalId) {
    const response = await request<Record<string, unknown>>(
      settings.api_key,
      settings.secret_key,
      `/status_by_cid/${encodeURIComponent(externalId)}`,
    );
    return {
      status: String(response.delivery_status ?? response.status ?? "unknown"),
      message: typeof response.message === "string" ? response.message : null,
      providerTime: null,
      raw: response,
    };
  },
};
