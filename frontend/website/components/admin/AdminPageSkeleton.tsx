"use client";

import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const cardClass = "rounded-2xl border border-border bg-card/80 p-5 sm:p-6";

function HeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-2">
        <Skeleton className="h-8 w-40 max-w-full sm:h-9" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {action ? <Skeleton className="h-10 w-32 rounded-full" /> : null}
    </div>
  );
}

function BackHeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <>
      <Skeleton className="mb-4 h-5 w-28" />
      <HeaderSkeleton action={action} />
    </>
  );
}

function FieldSkeleton({ large = false }: { large?: boolean }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className={cn("w-full rounded-xl", large ? "h-36" : "h-11")} />
    </div>
  );
}

function ActionFooterSkeleton() {
  return (
    <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
      <Skeleton className="h-10 w-24 rounded-full" />
      <Skeleton className="h-10 w-32 rounded-full" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="relative">
      <div className="mb-8 flex flex-col gap-6 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-4">
          <Skeleton className="h-7 w-32 rounded-full" />
          <Skeleton className="h-10 w-80 max-w-full sm:h-11" />
          <Skeleton className="h-5 w-[30rem] max-w-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={cardClass}>
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="size-10 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className={cardClass}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-6 w-40" />
            <Skeleton className="mt-6 h-52 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card/90">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-36" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
            >
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-52 max-w-full" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="hidden h-4 w-16 sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type ListSkeletonProps = {
  action?: boolean;
  filters?: number;
  header?: boolean;
  image?: "square" | "round";
  selectable?: boolean;
  sortable?: boolean;
  toolbar?: boolean;
  trailing?: number;
};

function ListSkeleton({
  action = false,
  filters = 0,
  header = true,
  image,
  selectable = false,
  sortable = false,
  toolbar = false,
  trailing = 2,
}: ListSkeletonProps) {
  return (
    <div>
      {header ? <HeaderSkeleton action={action} /> : null}
      <div className="space-y-3">
        {sortable ? <Skeleton className="h-4 w-64 max-w-full" /> : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full max-w-sm items-center gap-2">
            {selectable ? (
              <Skeleton className="size-9 shrink-0 rounded-xl" />
            ) : null}
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
          {toolbar || filters > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Array.from(
                { length: Math.max(filters, toolbar ? 1 : 0) },
                (_, index) => (
                  <Skeleton key={index} className="h-10 w-28 rounded-full" />
                ),
              )}
            </div>
          ) : null}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card/80 px-3 py-3 sm:flex-row sm:items-center sm:px-4"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {selectable || sortable ? (
                  <Skeleton className="size-9 shrink-0 rounded-xl" />
                ) : null}
                {image ? (
                  <Skeleton
                    className={cn(
                      "size-12 shrink-0",
                      image === "round" ? "rounded-full" : "rounded-lg",
                    )}
                  />
                ) : null}
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-44 max-w-full" />
                  <Skeleton className="h-3 w-64 max-w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-border/60 pt-3 sm:border-0 sm:pt-0">
                {Array.from({ length: trailing }, (_, actionIndex) => (
                  <Skeleton key={actionIndex} className="size-9 rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionListSkeleton() {
  return (
    <div>
      <HeaderSkeleton />
      <Skeleton className="mb-3 h-4 w-[32rem] max-w-full" />
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card/80 px-3 py-3 sm:flex-row sm:items-center sm:px-4"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-3 w-56 max-w-full" />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border/60 pt-3 sm:border-0 sm:pt-0">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="size-9 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormSkeleton({
  maxWidth = "max-w-3xl",
  tabs = 0,
  upload = false,
}: {
  maxWidth?: string;
  tabs?: number;
  upload?: boolean;
}) {
  return (
    <div>
      <BackHeaderSkeleton />
      <div className={cn("mx-auto space-y-8", maxWidth)}>
        {tabs > 0 ? (
          <div className="flex flex-wrap gap-1 rounded-xl bg-card p-1">
            {Array.from({ length: tabs }, (_, index) => (
              <Skeleton key={index} className="h-9 w-24 rounded-lg" />
            ))}
          </div>
        ) : null}
        <div className={cardClass}>
          <div className="mb-5 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="space-y-5">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton large />
            {upload ? <Skeleton className="h-48 w-full rounded-xl" /> : null}
            <ActionFooterSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

function SplitFormSkeleton({ banner = false }: { banner?: boolean }) {
  return (
    <div>
      <BackHeaderSkeleton />
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className={cn(cardClass, "space-y-5 lg:col-span-2")}>
            <Skeleton className="h-6 w-40" />
            <FieldSkeleton />
            <FieldSkeleton large />
            {banner ? <FieldSkeleton /> : null}
          </div>
          <div className="space-y-6">
            <div className={cardClass}>
              <Skeleton className="mb-4 h-6 w-28" />
              <Skeleton className="h-44 w-full rounded-xl" />
            </div>
            {banner ? (
              <div className={cardClass}>
                <Skeleton className="mb-4 h-6 w-32" />
                <Skeleton className="h-36 w-full rounded-xl" />
              </div>
            ) : null}
            <div className={cardClass}>
              <Skeleton className="mb-4 h-6 w-24" />
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            </div>
          </div>
        </div>
        <ActionFooterSkeleton />
      </div>
    </div>
  );
}

function InventorySkeleton() {
  return (
    <div>
      <HeaderSkeleton />
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-11 w-full max-w-sm rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card/80 p-3 sm:flex-row sm:items-center sm:p-4"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Skeleton className="size-16 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-44 max-w-full" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="size-10 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div>
      <HeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={cardClass}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-20" />
            <Skeleton className="mt-3 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className={cn(cardClass, "mt-6")}>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-4 w-60 max-w-full" />
        <div className="mt-4 flex flex-wrap gap-3">
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-36 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function PagesSkeleton() {
  const PageCard = ({ full = false }: { full?: boolean }) => (
    <div className={cn(cardClass, full && "md:col-span-2")}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-48 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-4/5" />
    </div>
  );

  return (
    <div>
      <HeaderSkeleton />
      <div className="grid gap-4 md:grid-cols-2">
        <PageCard full />
        <PageCard />
        <PageCard />
        <PageCard />
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div>
      <HeaderSkeleton />
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-wrap gap-1 rounded-xl bg-card p-1">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-24 rounded-lg" />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-28 rounded-full" />
          ))}
        </div>
        <div className={cn(cardClass, "space-y-5")}>
          <FieldSkeleton />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-44 rounded-xl" />
          </div>
          <Skeleton className="h-44 rounded-xl" />
          <ActionFooterSkeleton />
        </div>
      </div>
    </div>
  );
}

function SecuritySkeleton() {
  return (
    <div>
      <HeaderSkeleton />
      <div className={cn(cardClass, "mb-6")}>
        <Skeleton className="mb-5 h-6 w-32" />
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <FieldSkeleton />
          <FieldSkeleton />
          <Skeleton className="h-11 w-24 rounded-full" />
        </div>
      </div>
      <ListSkeleton header={false} trailing={1} />
    </div>
  );
}

function AuditSkeleton() {
  return (
    <div>
      <HeaderSkeleton />
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-44 rounded-full" />
          <Skeleton className="h-10 w-44 rounded-full" />
          <Skeleton className="h-10 w-64 max-w-full rounded-full" />
        </div>
        <Skeleton className="h-11 w-full max-w-sm rounded-full" />
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card/80 p-4 sm:flex-row sm:items-center"
            >
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-52 max-w-full" />
                <Skeleton className="h-3 w-72 max-w-full" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerDetailSkeleton() {
  return (
    <div>
      <BackHeaderSkeleton />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <InfoCard rows={3} />
          <InfoCard rows={2} />
        </div>
        <div className="lg:col-span-2">
          <TableCard />
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  rows = 3,
  tall = false,
}: {
  rows?: number;
  tall?: boolean;
}) {
  return (
    <div className={cardClass}>
      <Skeleton className="mb-5 h-4 w-28" />
      <div className="space-y-4">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className={cn("h-4", tall ? "w-36" : "w-20")} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TableCard() {
  return (
    <div className={cardClass}>
      <Skeleton className="mb-5 h-4 w-28" />
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="flex gap-6 border-b border-border p-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-3 flex-1" />
          ))}
        </div>
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex gap-6 border-b border-border p-4 last:border-0"
          >
            {Array.from({ length: 4 }, (_, cellIndex) => (
              <Skeleton key={cellIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div>
      <BackHeaderSkeleton action />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <TableCard />
          <div className={cardClass}>
            <Skeleton className="mb-4 h-4 w-20" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </div>
        <div className="space-y-6">
          <InfoCard rows={3} />
          <InfoCard rows={4} tall />
          <InfoCard rows={2} />
          <InfoCard rows={4} tall />
        </div>
      </div>
    </div>
  );
}

function RedirectSkeleton() {
  return (
    <div className="flex min-h-56 items-center justify-center" role="status">
      <div className="space-y-3 text-center">
        <Skeleton className="mx-auto size-10 rounded-full" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}

function skeletonForPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const section = segments[1];
  const detail = segments.length > 2;

  if (pathname === "/admin") return <DashboardSkeleton />;
  if (section === "banners" || pathname === "/admin/homepage/new")
    return <RedirectSkeleton />;
  if (section === "products")
    return detail ? (
      <FormSkeleton tabs={6} upload />
    ) : (
      <ListSkeleton action image="square" sortable trailing={2} />
    );
  if (section === "inventory") return <InventorySkeleton />;
  if (section === "categories")
    return detail ? (
      <FormSkeleton maxWidth="max-w-2xl" upload />
    ) : (
      <ListSkeleton action image="square" sortable trailing={2} />
    );
  if (section === "orders")
    return detail ? (
      <OrderDetailSkeleton />
    ) : (
      <ListSkeleton filters={1} selectable trailing={2} />
    );
  if (section === "customers")
    return detail ? (
      <CustomerDetailSkeleton />
    ) : (
      <ListSkeleton selectable trailing={1} />
    );
  if (section === "reports") return <ReportsSkeleton />;
  if (section === "promo-codes") return <ListSkeleton action trailing={3} />;
  if (section === "promotions")
    return detail ? (
      <SplitFormSkeleton />
    ) : (
      <ListSkeleton action image="square" trailing={3} />
    );
  if (section === "reviews")
    return detail ? (
      <SplitFormSkeleton />
    ) : (
      <ListSkeleton action image="round" trailing={3} />
    );
  if (section === "homepage") {
    if (segments[2] === "banners") return <SplitFormSkeleton banner />;
    return detail ? (
      <FormSkeleton maxWidth="max-w-4xl" tabs={2} />
    ) : (
      <SectionListSkeleton />
    );
  }
  if (section === "about")
    return detail ? <FormSkeleton /> : <SectionListSkeleton />;
  if (section === "pages") return detail ? <FormSkeleton /> : <PagesSkeleton />;
  if (section === "contact") return <ListSkeleton trailing={2} />;
  if (section === "settings") return <SettingsSkeleton />;
  if (section === "users") return <ListSkeleton action trailing={2} />;
  if (section === "security") return <SecuritySkeleton />;
  if (section === "audit") return <AuditSkeleton />;
  return <ListSkeleton />;
}

export function AdminPageSkeleton() {
  const pathname = usePathname();

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading admin page"
      role="status"
    >
      <span className="sr-only">Loading admin page</span>
      <div aria-hidden="true">{skeletonForPath(pathname)}</div>
    </div>
  );
}
