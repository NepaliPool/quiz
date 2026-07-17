import { ArrowLeft, GraduationCap } from "lucide-react";
import Link from "next/link";

import { PublicPagination } from "@/components/public-pagination";
import type { PublicFaculty } from "@/dal/public/get-faculties";
import type { PublicQuizSetListResult } from "@/dal/public/get-quiz-sets";
import { FacultyQuizSets } from "@/modules/faculty/components/faculty-quiz-sets";

export function FacultyDetailPage({
  faculty,
  quizSets,
}: {
  faculty: PublicFaculty;
  quizSets: PublicQuizSetListResult;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <Link
            href="/#faculties"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            All faculties
          </Link>
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg border bg-card">
              <GraduationCap className="size-4" />
            </span>
            QuizDesk
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10 md:py-14">
        <div className="mb-10 space-y-4">
          <span className="inline-flex rounded-full border px-3 py-1 text-sm text-muted-foreground">
            Faculty
          </span>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {faculty.name}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Browse published quiz sets for this faculty. Each set unlocks with
              a one-time access code.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {quizSets.total}{" "}
            {quizSets.total === 1
              ? "available quiz set"
              : "available quiz sets"}
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
      </main>
    </div>
  );
}
