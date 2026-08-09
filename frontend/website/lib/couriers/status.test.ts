import { describe, expect, it } from "vitest";
import { mappedOrderStatus, shouldAdvanceOrderStatus } from "./status";

describe("courier status mapping", () => {
  it("maps Pathao transit events without mapping failures or returns", () => {
    expect(mappedOrderStatus("pathao", "order.in-transit")).toBe("shipped");
    expect(mappedOrderStatus("pathao", "order.at-sorting-hub")).toBe(
      "shipped",
    );
    expect(mappedOrderStatus("pathao", "order.delivered")).toBe("delivered");
    expect(mappedOrderStatus("pathao", "order.returned")).toBeNull();
  });

  it("maps REDX delivery progress", () => {
    expect(mappedOrderStatus("redx", "ready-for-delivery")).toBe("shipped");
    expect(mappedOrderStatus("redx", "delivery-in-progress")).toBe("shipped");
    expect(mappedOrderStatus("redx", "returned")).toBeNull();
  });

  it("does not treat Steadfast approval states as delivered", () => {
    expect(mappedOrderStatus("steadfast", "delivered")).toBe("delivered");
    expect(
      mappedOrderStatus("steadfast", "delivered_approval_pending"),
    ).toBeNull();
    expect(mappedOrderStatus("steadfast", "partial_delivered")).toBeNull();
  });

  it("only advances the main order workflow", () => {
    expect(shouldAdvanceOrderStatus("processing", "shipped")).toBe(true);
    expect(shouldAdvanceOrderStatus("shipped", "processing")).toBe(false);
    expect(shouldAdvanceOrderStatus("cancelled", "delivered")).toBe(false);
    expect(shouldAdvanceOrderStatus("delivered", "shipped")).toBe(false);
  });
});
