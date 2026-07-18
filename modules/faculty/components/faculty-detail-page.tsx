import { PublicPagination } from "@/components/public-pagination";
import type { PublicFaculty } from "@/dal/public/get-faculties";
import type { PublicQuizSetListResult } from "@/dal/public/get-quiz-sets";
import { FacultyQuizSets } from "@/modules/faculty/components/faculty-quiz-sets";
import { PublicPageShell } from "@/modules/public/components/public-page-shell";

export function FacultyDetailPage({
  faculty,
  quizSets,
}: {
  faculty: PublicFaculty;
  quizSets: PublicQuizSetListResult;
}) {
  return (
    <PublicPageShell
      backHref="/#faculties"
      backLabel="All faculties"
      maxWidth="max-w-6xl"
    >
      <div className="mb-10 space-y-4 border-b pb-8">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Faculty
        </p>
        <div className="space-y-3">
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">
            {faculty.name}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Browse published quiz sets for this faculty. Each set unlocks with a
            one-time access code.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {quizSets.total}{" "}
          {quizSets.total === 1 ? "available quiz set" : "available quiz sets"}
        </p>
      </div>

      <div className="space-y-6">
        <FacultyQuizSets quizSets={quizSets.items} />
        <PublicPagination
          page={quizSets.page}
          pageCount={quizSets.pageCount}
          totalItems={quizSets.total}
          pageSize={quizSets.pageSize}
          hrefForPage={(nextPage) =>
            nextPage <= 1
              ? `/faculty/${faculty.slug}`
              : `/faculty/${faculty.slug}?page=${nextPage}`
          }
        />
      </div>
    </PublicPageShell>
  );
}
