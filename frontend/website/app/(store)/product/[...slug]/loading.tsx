import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <section className="mx-auto max-w-[1600px] px-6 pb-24 pt-24 md:px-10 md:pt-36">
      <div className="mb-12 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
            <Skeleton className="absolute bottom-3 right-3 h-6 w-12 rounded-full" />
          </div>
          <div className="relative">
            <Skeleton className="absolute left-0 top-1/2 z-10 size-11 -translate-y-1/2 rounded-full" />
            <Skeleton className="absolute right-0 top-1/2 z-10 size-11 -translate-y-1/2 rounded-full" />
            <div className="scrollbar-hide flex gap-2 overflow-hidden px-10">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton
                  key={index}
                  className="aspect-square w-[30%] min-w-[96px] max-w-[140px] flex-shrink-0 rounded-xl"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Skeleton className="h-3 w-32 rounded-full" />
          <Skeleton className="h-10 w-4/5 font-display" />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="size-12 rounded-full" />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-16" />
            <div className="flex w-fit items-center rounded-full border border-foreground/20">
              <Skeleton className="size-11 rounded-full border-0" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="size-11 rounded-full border-0" />
            </div>
          </div>
          <div className="space-y-3 pt-4">
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
          <div className="space-y-3 border-t border-border pt-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-5 rounded-md" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-4">
          <Skeleton className="h-7 w-40 font-display" />
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-7 w-40 font-display" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}