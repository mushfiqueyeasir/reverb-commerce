import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/utility/getSettings";
import { PageHeader } from "@/components/admin/PageHeader";
import { CustomersTable } from "./CustomersTable";
import type { CustomerRow } from "@/type/db";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const session = await requireAdminSession();
  const supabase = await createSupabaseServerClient();
  const [{ data: customers }, settings] = await Promise.all([
    supabase
      .from("customers")
      .select("*, orders(order_shipments(id))")
      .order("total_spent", { ascending: false }),
    getSiteSettings(),
  ]);
  const symbol = settings.currency_symbol || "$";
  const rows = (
    (customers as unknown as
      | (CustomerRow & {
          orders?: {
            order_shipments?: { id: string } | { id: string }[] | null;
          }[];
        })[]
      | null) ?? []
  ).map((customer) => ({
    ...customer,
    deletion_locked: Boolean(
      customer.orders?.some((order) =>
        Array.isArray(order.order_shipments)
          ? order.order_shipments.length > 0
          : Boolean(order.order_shipments),
      ),
    ),
  }));

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`${rows.length} customer${rows.length === 1 ? "" : "s"}`}
      />
      <CustomersTable
        data={rows}
        symbol={symbol}
        canWrite={canWrite(session.role)}
      />
    </div>
  );
}
