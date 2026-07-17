import { AdminPageHeader } from "@/modules/admin/components/admin-page-header";

export default function AdminOverviewLoading() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Welcome back"
        description="Here's what's running across faculties, quiz sets, and access codes."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-xl border bg-card p-4">
            <div className="space-y-3">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-9 w-16 animate-pulse rounded bg-muted" />
              <div className="h-3 w-28 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          <div className="overflow-hidden rounded-xl border bg-card">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="space-y-2 border-b px-4 py-4 last:border-b-0"
              >
                <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl border bg-card p-4">
              <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-muted/20 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex gap-6">
            <div className="h-10 w-16 animate-pulse rounded bg-muted" />
            <div className="h-10 w-16 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </section>
    </div>
  );
}
