"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Check, Loader2, PackageSearch, X } from "lucide-react";
import Input from "@/components/Common/Input";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { ORDER_STATUS_STYLES, formatDateTime } from "@/lib/admin/format";
import {
  paymentMethodLabel,
  paymentStatusLabel,
} from "@/lib/payments/paymentLabels";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useCheckoutStore } from "@/store/checkoutStore";
import type { OrderStatus } from "@/type/db";
import type { TrackOrderResult } from "@/type/orderType";
import { trackOrder } from "@/utility/trackOrder";
import { toast } from "sonner";
import { COURIER_META } from "@/lib/couriers/metadata";

const FLOW_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

function stepIndex(status: OrderStatus) {
  return FLOW_STEPS.indexOf(status);
}

export default function TrackOrderPageScreen() {
  const searchParams = useSearchParams();
  const { format } = useCurrency();
  const clearCart = useCartStore((s) => s.clearCart);
  const setAppliedPromo = useCheckoutStore((s) => s.setAppliedPromo);
  const [orderNumber, setOrderNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TrackOrderResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  const lookup = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error("Please enter your order number");
      return;
    }

    setIsLoading(true);
    setNotFound(false);
    setResult(null);

    try {
      const data = await trackOrder(trimmed);
      setResult(data);
      setOrderNumber(data.orderNumber);
    } catch (error) {
      setNotFound(true);
      toast.error(error instanceof Error ? error.message : "Order not found");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fromQuery = searchParams.get("order")?.trim();
    if (!fromQuery) return;
    setOrderNumber(fromQuery.toUpperCase());
    void lookup(fromQuery);
    if (searchParams.get("paid") === "1") {
      clearCart();
      setAppliedPromo(null);
      toast.success("Payment successful", {
        description: "Your bKash payment was confirmed.",
      });
    }
  }, [searchParams, clearCart, setAppliedPromo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void lookup(orderNumber);
  };

  const currentIdx =
    result && result.status !== "cancelled" ? stepIndex(result.status) : -1;
  const isCancelled = result?.status === "cancelled";

  return (
    <section className="mx-auto max-w-3xl px-6 pb-24 pt-24 md:px-10 md:pt-36">
      <div className="mb-10 lg:mb-14">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary-readable">
          Order status
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Track your order
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Enter the order number from your confirmation email or checkout
          receipt (for example ORD-1001).
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-2xl border border-border bg-card/60 p-4 sm:flex-row sm:items-end sm:p-5"
      >
        <div className="min-w-0 flex-1">
          <Input
            id="orderNumber"
            name="orderNumber"
            label="Order number"
            placeholder="ORD-1001"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-foreground px-7 text-sm font-semibold uppercase tracking-wider text-background transition hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Looking up
            </>
          ) : (
            <>
              <PackageSearch className="size-4" />
              Track order
            </>
          )}
        </button>
      </form>

      {notFound && !result && !isLoading && (
        <div className="mt-8 rounded-2xl border border-border bg-card/40 px-5 py-8 text-center">
          <p className="font-display text-xl font-semibold">Order not found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Double-check the number and try again. Need help?{" "}
            <a
              href="/contact-us"
              className="text-primary-readable underline-offset-4 hover:underline"
            >
              Contact us
            </a>
            .
          </p>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-5">
          <div className="rounded-2xl border border-border bg-card/80 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Order
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  {result.orderNumber}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Placed {formatDateTime(result.createdAt)}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize",
                  ORDER_STATUS_STYLES[result.status],
                )}
              >
                {result.status}
              </span>
            </div>

            {isCancelled ? (
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                <X className="size-4 shrink-0" />
                This order was cancelled.
              </div>
            ) : (
              <ol className="mt-8 grid grid-cols-5 gap-1 sm:gap-2">
                {FLOW_STEPS.map((step, idx) => {
                  const done = currentIdx >= idx;
                  const active = currentIdx === idx;
                  return (
                    <li
                      key={step}
                      className="flex flex-col items-center gap-2 text-center"
                    >
                      <span
                        className={cn(
                          "grid size-8 place-items-center rounded-full border text-[10px] font-semibold sm:size-9 sm:text-xs",
                          done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground",
                          active && "ring-2 ring-primary/40",
                        )}
                      >
                        {done ? (
                          <Check className="size-3.5 sm:size-4" />
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-[9px] uppercase tracking-wider sm:text-[10px]",
                          done ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {step}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {result.courier ? (
            <div className="rounded-2xl border border-border bg-card/80 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-24 place-items-center rounded-lg bg-white px-2">
                    <Image
                      src={COURIER_META[result.courier.provider].logo}
                      alt={`${COURIER_META[result.courier.provider].label} logo`}
                      width={86}
                      height={32}
                      className="max-h-8 w-auto max-w-full"
                    />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      Courier tracking
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {result.courier.trackingCode ||
                        "Tracking is being prepared"}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium capitalize text-foreground">
                    {(result.courier.status || "processing").replaceAll(
                      "-",
                      " ",
                    )}
                  </p>
                  {result.courier.updatedAt ? (
                    <p className="text-xs text-muted-foreground">
                      Updated {formatDateTime(result.courier.updatedAt)}
                    </p>
                  ) : null}
                </div>
              </div>
              {result.courier.message ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {result.courier.message}
                </p>
              ) : null}
              {result.courier.events.length ? (
                <ol className="mt-4 space-y-3 border-t border-border pt-4">
                  {result.courier.events.slice(0, 5).map((event, index) => (
                    <li
                      key={`${event.time}-${event.status}-${index}`}
                      className="text-sm"
                    >
                      <p className="font-medium capitalize text-foreground">
                        {event.status.replaceAll("-", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(event.time)}
                        {event.message ? ` · ${event.message}` : ""}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card/80 p-5">
              <h3 className="font-display text-lg font-semibold">Delivery</h3>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="text-right font-medium">
                    {result.delivery.name}
                  </dd>
                </div>
                {result.delivery.city && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">City</dt>
                    <dd className="text-right font-medium">
                      {result.delivery.city}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Zone</dt>
                  <dd className="text-right font-medium">
                    {result.delivery.zone}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Payment</dt>
                  <dd className="text-right font-medium">
                    {paymentMethodLabel(result.paymentMethod)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Payment status</dt>
                  <dd className="text-right font-medium">
                    {paymentStatusLabel(result.paymentStatus)}
                  </dd>
                </div>
                {result.bkashTrxId ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">bKash TrxID</dt>
                    <dd className="text-right font-mono text-xs font-medium">
                      {result.bkashTrxId}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="rounded-2xl border border-border bg-card/80 p-5">
              <h3 className="font-display text-lg font-semibold">Totals</h3>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-medium">
                    {format(result.totals.subtotal)}
                  </dd>
                </div>
                {(result.totals.discount ?? 0) > 0 ? (
                  <div className="flex justify-between gap-3 text-primary-readable">
                    <dt>
                      Promo
                      {result.totals.promo_code
                        ? ` (${result.totals.promo_code})`
                        : ""}
                      {result.totals.discount_percent
                        ? ` · ${result.totals.discount_percent}%`
                        : ""}
                    </dt>
                    <dd className="font-medium">
                      -{format(result.totals.discount ?? 0)}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd className="font-medium">
                    {format(result.totals.shipping)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-border pt-2 text-base">
                  <dt className="font-semibold">Total</dt>
                  <dd className="font-display font-bold">
                    {format(result.totals.total)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/80 p-5 sm:p-6">
            <h3 className="font-display text-lg font-semibold">Items</h3>
            <ul className="mt-4 divide-y divide-border">
              {result.items.map((item, idx) => (
                <li
                  key={`${item.title}-${item.size}-${idx}`}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {[item.size, item.color].filter(Boolean).join(" · ") ||
                        "—"}
                      {" · "}
                      Qty {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium">
                    {format(item.unitPrice * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
