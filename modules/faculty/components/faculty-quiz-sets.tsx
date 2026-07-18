import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PublicQuizSetCard } from "@/dal/public/get-quiz-sets";

export function FacultyQuizSets({ quizSets }: { quizSets: PublicQuizSetCard[] }) {
  if (quizSets.length === 0) {
    return (
      <div className="border border-dashed bg-card px-6 py-16 text-center">
        <h3 className="font-display text-xl tracking-tight">No quiz sets yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          This faculty does not have any published quiz sets right now.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-px border bg-border md:grid-cols-2">
      {quizSets.map((set) => (
        <article
          key={set.id}
          className="group flex min-h-80 flex-col justify-between bg-card p-6 transition-colors hover:bg-accent/40"
        >
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <span className="border px-2 py-1 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                {set.sections.length} subjects
              </span>
            </div>

            <div>
              <h3 className="font-display text-2xl tracking-tight transition-colors group-hover:text-primary">
                {set.title}
              </h3>
              {set.description ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {set.description}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {set.sections.map((section) => (
                  <span
                    key={section.id}
                    className="border bg-muted/40 px-2.5 py-1 text-xs"
                  >
                    {section.subjectName} · {section.fullMarks}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-px border bg-border text-sm">
              <Stat label="Questions" value={set.questionCount} />
              <Stat label="Total" value={set.totalMarks} />
              <Stat label="Time" value={`${set.durationMinutes} min`} />
            </div>
          </div>

          <Button asChild className="mt-6 w-full" variant="outline">
            <Link href={`/faculty/${set.faculty.slug}/${set.slug}`}>
              Open set
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </article>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-muted/50 p-3">
      <p className="font-medium">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
