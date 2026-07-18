export function FacultyQuizSetsSkeleton() {
  return (
    <div className="grid gap-px border bg-border md:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-80 flex-col justify-between bg-card p-6"
        >
          <div className="space-y-5">
            <div className="h-7 w-24 animate-pulse bg-muted" />
            <div className="space-y-3">
              <div className="h-8 w-3/4 animate-pulse bg-muted" />
              <div className="h-4 w-full animate-pulse bg-muted" />
              <div className="flex flex-wrap gap-2">
                <div className="h-6 w-24 animate-pulse bg-muted" />
                <div className="h-6 w-20 animate-pulse bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-px border bg-border">
              <div className="h-16 animate-pulse bg-muted" />
              <div className="h-16 animate-pulse bg-muted" />
              <div className="h-16 animate-pulse bg-muted" />
            </div>
          </div>
          <div className="mt-6 h-9 w-full animate-pulse bg-muted" />
        </div>
      ))}
    </div>
  );
}
