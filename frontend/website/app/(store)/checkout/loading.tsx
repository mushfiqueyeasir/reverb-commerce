import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutPageLoading() {
  return (
    <section className="mx-auto max-w-[1600px] px-5 pb-24 pt-24 sm:px-6 md:px-10 md:pt-36">
      <Skeleton className="mb-8 h-12 w-52 font-display" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <div className="flex gap-3">
              <Skeleton className="h-12 w-[130px] rounded-lg" />
              <Skeleton className="h-12 flex-1 rounded-lg" />
            </div>
            <Skeleton className="h-4 w-64" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-6 w-20" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          </div>

          <Skeleton className="h-12 w-full rounded-full" />
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="w-full max-w-none rounded-2xl border border-border bg-card p-5 sm:p-6 lg:max-w-sm">
            <Skeleton className="mb-6 h-7 w-40" />
            <div className="mb-6 space-y-4">
              {Array.from({ length: 2 }, (_, index) => (
                <div key={index} className="flex gap-4">
                  <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2 pt-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-5 space-y-2 border-t border-border pt-4">
              <Skeleton className="h-4 w-20" />
              <div className="flex gap-2">
                <Skeleton className="h-11 flex-1 rounded-xl" />
                <Skeleton className="h-11 w-20 rounded-full" />
              </div>
            </div>
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-14" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-10" />
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-7 w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}