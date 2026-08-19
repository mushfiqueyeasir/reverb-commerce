import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Package,
  Settings2,
  ShoppingBag,
} from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { getDashboardData } from "@/lib/admin/dashboard";
import { getSiteSettings } from "@/utility/getSettings";
import { StatCard } from "@/components/admin/StatCard";
import {
  WeeklyOrdersChart,
  WeeklySalesChart,
} from "@/components/admin/DashboardCharts";
import { Badge } from "@/components/ui/badge";
import {
  formatMoney,
  formatDate,
  ORDER_STATUS_STYLES,
} from "@/lib/admin/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const QUICK_LINKS = [
  { href: "/admin/products/new", label: "Add product", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/settings", label: "Settings", icon: Settings2 },
] as const;

export default async function DashboardPage() {
  const session = await requireAdminSession();
  const [data, settings] = await Promise.all([
    getDashboardData(),
    getSiteSettings(),
  ]);
  const symbol = settings.currency_symbol || "$";
  const firstName = session.fullName?.split(" ")[0] ?? "there";

  return (
    <div className="relative">
      {/* Soft atmosphere — CSS-variable safe for Daylight + dark presets */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-4 h-72 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 10% 0%, rgb(var(--primary-rgb) / 0.14), transparent 55%)",
        }}
        aria-hidden
      />

      <div className="relative">
        {/* Hero */}
        <div className="mb-8 flex flex-col gap-6 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-border bg-card/70 px-3.5 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Live overview
            </div>
            <h1 className="mt-4 font-display text-[clamp(1.85rem,4vw,2.75rem)] font-bold leading-[0.95] tracking-[-0.035em] text-foreground">
              Welcome back, <span className="text-primary">{firstName}</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
              Orders, sales, and stock at a glance — keep the drop moving.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground transition hover:border-primary hover:text-primary"
              >
                <link.icon className="size-3.5 opacity-70" />
                {link.label}
                <ArrowUpRight className="size-3.5 opacity-50 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Orders today"
            value={data.ordersToday}
            icon="ShoppingCart"
            hint={`${data.ordersWeek} in the last 7 days`}
            accent="primary"
            href="/admin/orders"
          />
          <StatCard
            label="Sales (7 days)"
            value={formatMoney(data.salesWeek, symbol)}
            icon="DollarSign"
            hint={`${formatMoney(data.salesTotal, symbol)} all-time`}
            accent="success"
            href="/admin/reports"
          />
          <StatCard
            label="New customers"
            value={data.newCustomersWeek}
            icon="UserPlus"
            hint="Last 7 days"
            accent="info"
            href="/admin/customers"
          />
          <StatCard
            label="Low stock"
            value={data.lowStockCount}
            icon="AlertTriangle"
            hint={`${data.pendingCount} orders pending`}
            accent="warning"
            href="/admin/inventory"
          />
        </div>

        {/* Charts */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                  Pulse
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-foreground">
                  Orders this week
                </h2>
              </div>
            </div>
            <WeeklyOrdersChart data={data.weekly} />
          </section>
          <section className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                  Revenue
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-foreground">
                  Sales this week
                </h2>
              </div>
            </div>
            <WeeklySalesChart data={data.weekly} symbol={symbol} />
          </section>
        </div>

        {/* Recent orders */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card/90 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                Pipeline
              </p>
              <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-foreground">
                Recent orders
              </h2>
            </div>
            <Link
              href="/admin/orders"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary transition hover:gap-2.5"
            >
              View all
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {data.recentOrders.length === 0 ? (
            <div className="px-5 py-14 text-center sm:px-6">
              <p className="font-display text-lg font-semibold text-foreground">
                No orders yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                When customers check out, they&apos;ll show up here.
              </p>
              <Link
                href="/admin/products"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-background transition hover:bg-primary hover:text-primary-foreground"
              >
                Manage catalog
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="flex flex-col gap-2 px-5 py-3.5 transition-colors hover:bg-foreground/[0.035] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {o.order_number}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {[o.delivery?.firstName, o.delivery?.lastName]
                        .filter(Boolean)
                        .join(" ") || "Guest"}{" "}
                      · {formatDate(o.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:shrink-0 sm:justify-end sm:gap-4">
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        ORDER_STATUS_STYLES[o.status],
                      )}
                    >
                      {o.status}
                    </Badge>
                    <span className="min-w-16 text-right font-medium tabular-nums text-foreground">
                      {formatMoney(o.totals?.total ?? 0, symbol)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
