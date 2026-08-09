import type { OrderStatus } from "@/type/db";
import type { CourierProvider } from "./metadata";

function normalized(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

export function mappedOrderStatus(
  provider: CourierProvider,
  courierStatus: string,
): OrderStatus | null {
  const status = normalized(courierStatus);
  if (["delivered", "order.delivered"].includes(status)) {
    return "delivered";
  }

  if (provider === "pathao") {
    if (
      [
        "order.picked",
        "order.at-sorting-hub",
        "order.at-the-sorting-hub",
        "order.in-transit",
        "order.received-at-last-mile-hub",
        "order.assigned-for-delivery",
      ].includes(status)
    ) {
      return "shipped";
    }
  }

  if (provider === "redx") {
    if (["ready-for-delivery", "delivery-in-progress"].includes(status)) {
      return "shipped";
    }
  }

  return null;
}

const STATUS_RANK: Partial<Record<OrderStatus, number>> = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
};

export function shouldAdvanceOrderStatus(
  current: OrderStatus,
  next: OrderStatus,
): boolean {
  if (current === "cancelled" || current === "delivered") return false;
  return (STATUS_RANK[next] ?? -1) > (STATUS_RANK[current] ?? -1);
}
