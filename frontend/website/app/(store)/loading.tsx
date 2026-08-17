export default function StorePageLoading() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="mx-auto min-h-[60vh] max-w-[1600px] animate-pulse px-4 py-12 sm:px-6 sm:py-16 lg:px-10"
    >
      <div className="h-8 w-40 bg-muted sm:h-10" />
      <div className="mt-4 h-4 w-full max-w-xl bg-muted" />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index}>
            <div className="aspect-[3/4] bg-muted" />
            <div className="mt-4 h-4 w-4/5 bg-muted" />
            <div className="mt-2 h-4 w-2/5 bg-muted" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading page</span>
    </div>
  );
}
