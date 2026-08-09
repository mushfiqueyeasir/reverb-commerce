import type { CourierProvider } from "./metadata";

export type CourierSettingsRow = {
  provider: CourierProvider;
  active: boolean;
  sandbox: boolean;
  client_id: string | null;
  client_secret: string | null;
  username: string | null;
  password: string | null;
  api_key: string | null;
  secret_key: string | null;
  access_token: string | null;
  pickup_store_id: string | null;
  webhook_secret: string | null;
  updated_at: string;
};

export type CourierProviderSettings = CourierSettingsRow;

export type CourierProviderSettingsPublic = {
  provider: CourierProvider;
  active: boolean;
  sandbox: boolean;
  clientId: string | null;
  username: string | null;
  apiKey: string | null;
  pickupStoreId: string | null;
  webhookSecret: string | null;
  hasClientSecret: boolean;
  hasPassword: boolean;
  hasSecretKey: boolean;
  hasAccessToken: boolean;
  hasWebhookSecret: boolean;
};

export type CourierSettingsPublic = {
  activeProvider: CourierProvider | null;
  providers: Record<CourierProvider, CourierProviderSettingsPublic>;
};

export type SaveCourierProviderInput = {
  provider: CourierProvider;
  sandbox: boolean;
  clientId: string | null;
  clientSecret: string | null;
  username: string | null;
  password: string | null;
  apiKey: string | null;
  secretKey: string | null;
  accessToken: string | null;
  pickupStoreId: string | null;
  webhookSecret: string | null;
};

export type SaveCourierSettingsInput = {
  activeProvider: CourierProvider | null;
  providers: SaveCourierProviderInput[];
};

export type CourierStore = { id: string; name: string };
export type CourierArea = { id: string; name: string };

export type CreateCourierShipmentInput = {
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  codAmount: number;
  declaredValue: number;
  itemQuantity: number;
  itemDescription: string;
  weightKg: number;
  instruction?: string | null;
  deliveryAreaId?: string | null;
  deliveryAreaName?: string | null;
};

export type CourierShipmentResult = {
  externalId: string;
  trackingCode: string | null;
  status: string;
  message: string | null;
  raw: unknown;
};

export type CourierStatusResult = {
  status: string;
  message: string | null;
  providerTime: string | null;
  raw: unknown;
};

export type CourierAdapter = {
  testConnection(settings: CourierProviderSettings): Promise<void>;
  listStores(settings: CourierProviderSettings): Promise<CourierStore[]>;
  listAreas(
    settings: CourierProviderSettings,
    query?: string,
  ): Promise<CourierArea[]>;
  createShipment(
    settings: CourierProviderSettings,
    input: CreateCourierShipmentInput,
  ): Promise<CourierShipmentResult>;
  getStatus(
    settings: CourierProviderSettings,
    externalId: string,
    trackingCode?: string | null,
  ): Promise<CourierStatusResult>;
};
