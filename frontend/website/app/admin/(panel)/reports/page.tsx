import { requireAdminSession } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/utility/getSettings";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { formatMoney, formatNumber } from "@/lib/admin/format";
import type { OrderRow } from "@/type/db";
import { CsvButton } from "./CsvButton";
import { exportOrdersCsv, exportProductsCsv } from "./actions";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();

  const [ordersCount, productsCount, customersCount, salesRes, settings] =
    await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("totals, status"),
      getSiteSettings(),
    ]);

  const symbol = settings.currency_symbol || "$";

  const totalOrders = ordersCount.count ?? 0;
  const totalProducts = productsCount.count ?? 0;
  const totalCustomers = customersCount.count ?? 0;

  // Total sales = sum of totals.total for non-cancelled orders.
  const totalSales = (
    (salesRes.data as Pick<OrderRow, "totals" | "status">[] | null) ?? []
  )
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.totals?.total ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Store performance overview and data exports."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total orders"
          value={formatNumber(totalOrders)}
          icon="ShoppingCart"
          accent="primary"
        />
        <StatCard
          label="Total sales"
          value={formatMoney(totalSales, symbol)}
          icon="DollarSign"
          hint="Excludes cancelled orders"
          accent="success"
        />
        <StatCard
          label="Total products"
          value={formatNumber(totalProducts)}
          icon="Package"
          accent="info"
        />
        <StatCard
          label="Total customers"
          value={formatNumber(totalCustomers)}
          icon="Users"
          accent="warning"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card/80 p-5 sm:p-6">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Data exports
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Download store data as CSV files.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <CsvButton
            label="Export orders"
            filename="orders"
            action={exportOrdersCsv}
          />
          <CsvButton
            label="Export products"
            filename="products"
            action={exportProductsCsv}
          />
        </div>
      </div>
    </div>
  );
}
