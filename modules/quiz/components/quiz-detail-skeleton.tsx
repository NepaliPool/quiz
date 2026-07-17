export function QuizDetailSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-6 py-5">
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-10 md:py-14">
        <div className="mb-10 space-y-5">
          <div className="h-7 w-56 animate-pulse rounded-full bg-muted" />
          <div className="space-y-3">
            <div className="h-10 w-3/4 max-w-xl animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-muted" />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="h-7 w-28 animate-pulse rounded-full bg-muted" />
            <div className="h-7 w-28 animate-pulse rounded-full bg-muted" />
            <div className="h-7 w-28 animate-pulse rounded-full bg-muted" />
            <div className="h-7 w-24 animate-pulse rounded-full bg-muted" />
          </div>
        </div>

        <div className="mx-auto w-full max-w-lg space-y-5 rounded-2xl border bg-card p-6 md:p-8">
          <div className="space-y-3">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="h-7 w-56 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
          </div>
          <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        </div>
      </main>
    </div>
  );
}
