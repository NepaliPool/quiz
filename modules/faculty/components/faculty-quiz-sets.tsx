import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PublicQuizSetCard } from "@/dal/public/get-quiz-sets";

export function FacultyQuizSets({ quizSets }: { quizSets: PublicQuizSetCard[] }) {
  if (quizSets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
        <h3 className="text-lg font-semibold">No quiz sets yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          This faculty does not have any published quiz sets right now.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {quizSets.map((set) => (
        <article
          key={set.id}
          className="flex min-h-80 flex-col justify-between rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                {set.sections.length} subjects
              </span>
              <BookOpen className="size-5 shrink-0 text-muted-foreground" />
            </div>

            <div>
              <h3 className="text-xl font-semibold">{set.title}</h3>
              {set.description ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {set.description}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {set.sections.map((section) => (
                  <span
                    key={section.id}
                    className="rounded-md border bg-muted/40 px-2.5 py-1 text-xs"
                  >
                    {section.subjectName} · {section.fullMarks}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <Stat label="Questions" value={set.questionCount} />
              <Stat label="Total" value={set.totalMarks} />
              <Stat label="Time" value={`${set.durationMinutes} min`} />
            </div>
          </div>

          <Button asChild className="mt-6 w-full" variant="outline">
            <Link href={`/faculty/${set.faculty.slug}/${set.slug}`}>
              Open set
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </article>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <p className="font-medium">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
