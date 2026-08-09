import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPageLoading() {
  return (
    <div aria-label="Loading admin page" className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="mb-5 flex gap-3">
          <Skeleton className="h-11 flex-1 rounded-full" />
          <Skeleton className="h-11 w-28 rounded-full" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
