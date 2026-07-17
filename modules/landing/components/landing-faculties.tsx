import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PublicPagination } from "@/components/public-pagination";
import { getFacultiesWithPublishedSets } from "@/dal/public/get-faculties";
import { LandingFacultiesError } from "@/modules/landing/components/landing-faculties-error";

export async function LandingFaculties({ page = 1 }: { page?: number }) {
  let result;

  try {
    result = await getFacultiesWithPublishedSets({ page });
  } catch (error) {
    console.error(error);
    return (
      <LandingFacultiesError message="Could not load faculties right now." />
    );
  }

  const { items: faculties, total, pageSize, pageCount } = result;

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
        <h3 className="text-lg font-semibold">No faculties yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Published quiz sets will show up here once faculties are ready.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {faculties.map((faculty) => (
          <article
            key={faculty.id}
            className="flex min-h-64 flex-col justify-between rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <span className="flex size-10 items-center justify-center rounded-xl border bg-background">
                  <GraduationCap className="size-5" />
                </span>
                <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                  {faculty.setCount}{" "}
                  {faculty.setCount === 1 ? "quiz set" : "quiz sets"}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-semibold">{faculty.name}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {faculty.totalQuestions}{" "}
                  {faculty.totalQuestions === 1 ? "question" : "questions"}{" "}
                  across published sets.
                </p>
              </div>
            </div>

            <Button asChild className="mt-6 w-full" variant="outline">
              <Link href={`/faculty/${faculty.slug}`}>
                View quiz sets
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </article>
        ))}
      </div>

      <PublicPagination
        page={result.page}
        pageCount={pageCount}
        totalItems={total}
        pageSize={pageSize}
        hrefForPage={(nextPage) =>
          nextPage <= 1 ? "/#faculties" : `/?page=${nextPage}#faculties`
        }
      />
    </div>
  );
}
