export default function AdminQuizDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-8 w-64 max-w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          </div>
        ))}
      </div>
      <div className="space-y-4 rounded-xl border bg-card p-5">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-xl border p-4">
            <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-20 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
