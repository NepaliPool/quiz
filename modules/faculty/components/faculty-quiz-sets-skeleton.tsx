export function FacultyQuizSetsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-80 flex-col justify-between rounded-2xl border bg-card p-5"
        >
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="h-7 w-24 animate-pulse rounded-full bg-muted" />
              <div className="size-5 animate-pulse rounded bg-muted" />
            </div>
            <div className="space-y-3">
              <div className="h-7 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="flex flex-wrap gap-2">
                <div className="h-6 w-24 animate-pulse rounded-md bg-muted" />
                <div className="h-6 w-20 animate-pulse rounded-md bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="h-16 animate-pulse rounded-xl bg-muted" />
              <div className="h-16 animate-pulse rounded-xl bg-muted" />
              <div className="h-16 animate-pulse rounded-xl bg-muted" />
            </div>
          </div>
          <div className="mt-6 h-9 w-full animate-pulse rounded-md bg-muted" />
        </div>
      ))}
    </div>
  );
}
