import { FacultyQuizSetsSkeleton } from "@/modules/faculty/components/faculty-quiz-sets-skeleton";

export default function FacultyLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10 md:py-14">
        <div className="mb-10 space-y-4">
          <div className="h-7 w-20 animate-pulse rounded-full bg-muted" />
          <div className="h-10 w-2/3 max-w-xl animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-muted" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        </div>
        <FacultyQuizSetsSkeleton />
      </main>
    </div>
  );
}
