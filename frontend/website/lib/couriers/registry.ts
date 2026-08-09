import "server-only";

import type { CourierProvider } from "./metadata";
import type { CourierAdapter } from "./types";
import { pathaoAdapter } from "./pathao";
import { redxAdapter } from "./redx";
import { steadfastAdapter } from "./steadfast";

const adapters: Record<CourierProvider, CourierAdapter> = {
  pathao: pathaoAdapter,
  steadfast: steadfastAdapter,
  redx: redxAdapter,
};

export function courierAdapter(provider: CourierProvider): CourierAdapter {
  return adapters[provider];
}
