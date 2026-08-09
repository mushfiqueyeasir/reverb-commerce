import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { OrdersTable, type OrderTableRow } from "./OrdersTable";
import type { OrderRow } from "@/type/db";
import { getCourierSettings } from "@/lib/couriers/settings";
import { COURIER_PROVIDERS } from "@/lib/couriers/metadata";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await requireAdminSession();
  const supabase = await createSupabaseServerClient();
  const [{ data: orders }, { data: settings }, courierSettings] =
    await Promise.all([
      supabase
        .from("orders")
        .select(
          "id, order_number, status, delivery, totals, created_at, order_shipments(provider, courier_status)",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("site_settings")
        .select("currency_symbol")
        .eq("id", 1)
        .maybeSingle(),
      getCourierSettings(),
    ]);
  const symbol = settings?.currency_symbol || "$";
  const activeProvider =
    COURIER_PROVIDERS.find((provider) => courierSettings[provider].active) ??
    null;

  const rows: OrderTableRow[] = (
    (orders as unknown as
      | (OrderRow & {
          order_shipments?:
            | {
                provider: OrderTableRow["courier"];
                courier_status: string | null;
              }
            | {
                provider: OrderTableRow["courier"];
                courier_status: string | null;
              }[];
        })[]
      | null) ?? []
  ).map((o) => {
    const shipment = Array.isArray(o.order_shipments)
      ? o.order_shipments[0]
      : o.order_shipments;
    return {
      id: o.id,
      order_number: o.order_number,
      customer:
        [o.delivery?.firstName, o.delivery?.lastName]
          .filter(Boolean)
          .join(" ") || "Guest",
      created_at: o.created_at,
      status: o.status,
      total: o.totals?.total ?? 0,
      courier: shipment?.provider ?? null,
      courier_status: shipment?.courier_status ?? null,
      deletion_locked: Boolean(shipment),
      delivery_city: o.delivery?.city ?? "",
    };
  });

  return (
    <div>
      <PageHeader
        title="Orders"
        description={`${rows.length} order${rows.length === 1 ? "" : "s"} total`}
      />
      <OrdersTable
        data={rows}
        symbol={symbol}
        canWrite={canWrite(session.role)}
        activeProvider={activeProvider}
      />
    </div>
  );
}
