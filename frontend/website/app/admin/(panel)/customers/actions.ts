"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { writeAuditLog } from "@/lib/admin/auditLog";
import {
  RESTOCK_ON_DELETE_STATUSES,
} from "@/lib/admin/orderStock";
import type { OrderStatus } from "@/type/db";

/**
 * Permanently delete customers and all of their orders (items cascade).
 * Restocks unshipped orders the same way as order delete.
 */
export async function deleteCustomers(
  customerIds: string[],
): Promise<{ error?: string } | void> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }

  const ids = [...new Set(customerIds.filter(Boolean))];
  if (!ids.length) return { error: "No customers selected." };
  if (ids.length > 50) {
    return { error: "Select at most 50 customers at a time." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing, error: readError } = await supabase
    .from("customers")
    .select("id, name, phone")
    .in("id", ids);
  if (readError) return { error: readError.message };

  const customers = (existing ?? []) as {
    id: string;
    name: string | null;
    phone: string | null;
  }[];
  if (!customers.length) return { error: "No customers found." };

  const customerIdsFound = customers.map((c) => c.id);

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, order_number, status")
    .in("customer_id", customerIdsFound);
  if (ordersError) return { error: ordersError.message };

  const orderRows = (orders ?? []) as {
    id: string;
    order_number: string;
    status: OrderStatus;
  }[];

  if (orderRows.length) {
    const { data: linkedShipments, error: shipmentError } = await supabase
      .from("order_shipments")
      .select("order_id")
      .in(
        "order_id",
        orderRows.map((order) => order.id),
      );
    if (shipmentError) return { error: shipmentError.message };
    if (linkedShipments?.length) {
      return {
        error:
          "This customer has one or more courier-synced orders and cannot be deleted.",
      };
    }
  }

  const restockIds = orderRows
    .filter((r) => RESTOCK_ON_DELETE_STATUSES.includes(r.status))
    .map((r) => r.id);

  const { error: deleteCustomersError } = await supabase.rpc(
    "delete_customers_safely",
    { p_customer_ids: customerIdsFound },
  );
  if (deleteCustomersError) {
    if (/courier-synced/i.test(deleteCustomersError.message)) {
      return {
        error:
          "This customer has one or more courier-synced orders and cannot be deleted.",
      };
    }
    return { error: deleteCustomersError.message };
  }

  const labels = customers
    .map((c) => c.name || c.phone || c.id.slice(0, 8))
    .join(", ");

  await writeAuditLog({
    actor: s,
    action: "delete",
    entity: "customer",
    entityId: customers.length === 1 ? customers[0].id : null,
    summary:
      customers.length === 1
        ? `Deleted customer ${labels} and ${orderRows.length} related order${orderRows.length === 1 ? "" : "s"}`
        : `Deleted ${customers.length} customers and ${orderRows.length} related order${orderRows.length === 1 ? "" : "s"} (${labels})`,
    metadata: {
      customerIds: customerIdsFound,
      orderIds: orderRows.map((r) => r.id),
      orderCount: orderRows.length,
      restockedIds: restockIds,
    },
  });

  revalidatePath("/admin/customers");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/reports");
}
