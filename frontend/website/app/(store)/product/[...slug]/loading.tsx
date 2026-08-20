import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <section className="mx-auto max-w-[1600px] px-6 pb-24 pt-24 md:px-10 md:pt-36">
      <div className="mb-12 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-4">
          <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
          <div className="flex gap-2 px-10">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton
                key={index}
                className="aspect-square w-[30%] min-w-[96px] max-w-[140px] rounded-xl"
              />
            ))}
          </div>
        </div>

        <div className="space-y-6 pt-1">
          <Skeleton className="h-3 w-32 rounded-full" />
          <Skeleton className="h-10 w-4/5 font-display" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-12" />
            <div className="flex gap-3">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="size-12 rounded-full" />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-11 w-fit rounded-full px-16" />
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
    </section>
  );
}