export function LandingFacultiesSkeleton() {
  return (
    <div className="grid gap-px border bg-border md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-56 flex-col justify-between bg-card p-6"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="h-8 w-2/3 animate-pulse bg-muted" />
              <div className="h-7 w-16 animate-pulse bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse bg-muted" />
              <div className="h-4 w-2/3 animate-pulse bg-muted" />
            </div>
          </div>
          <div className="mt-8 h-9 w-full animate-pulse bg-muted" />
        </div>
      ))}
    </div>
  );
}
