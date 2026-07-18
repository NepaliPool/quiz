import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
      <div className="border border-dashed bg-card px-6 py-16 text-center">
        <h3 className="text-lg font-medium">No faculties yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Published quiz sets will show up here once faculties are ready.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-px border bg-border md:grid-cols-2 xl:grid-cols-3">
        {faculties.map((faculty) => (
          <article
            key={faculty.id}
            className="group flex min-h-56 flex-col justify-between bg-card p-6 transition-colors hover:bg-accent/50"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-display text-2xl tracking-tight transition-colors group-hover:text-primary">
                  {faculty.name}
                </h3>
                <span className="shrink-0 border px-2 py-1 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                  {faculty.setCount}{" "}
                  {faculty.setCount === 1 ? "set" : "sets"}
                </span>
              </div>

              <p className="text-sm leading-6 text-muted-foreground">
                {faculty.totalQuestions}{" "}
                {faculty.totalQuestions === 1 ? "question" : "questions"} across
                published sets.
              </p>
            </div>

            <Button
              asChild
              className="mt-8 w-full rounded-none"
              variant="outline"
            >
              <Link href={`/faculty/${faculty.slug}`}>
                View quiz sets
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
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
