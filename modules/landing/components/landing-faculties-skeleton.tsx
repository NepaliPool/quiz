export function LandingFacultiesSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-64 flex-col justify-between rounded-2xl border bg-card p-5"
        >
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="size-10 animate-pulse rounded-xl bg-muted" />
              <div className="h-7 w-24 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="space-y-3">
              <div className="h-7 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="mt-6 h-9 w-full animate-pulse rounded-md bg-muted" />
        </div>
      ))}
    </div>
  );
}
