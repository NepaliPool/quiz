"use client";

import { Check, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { unlockAnswerSheet } from "@/actions/quiz/unlock-answer-sheet";
import { MathText } from "@/components/math-text";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type {
  AnswerSheetOption,
  AnswerSheetQuestion,
  AnswerSheetSection,
  AttemptAnswerSheet,
  AttemptResultSummary,
} from "@/dal/public/get-attempt-result";
import { cn } from "@/lib/utils";
import { PublicPageShell } from "@/modules/public/components/public-page-shell";
import { ContentLeakGuard } from "@/modules/quiz/components/content-leak-guard";
import { unlockAnswerSheetSchema } from "@/modules/quiz/schemas/attempt";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

export function QuizResultPage({
  summary,
  initialSheet,
}: {
  summary: AttemptResultSummary;
  initialSheet?: AttemptAnswerSheet | null;
}) {
  const [sheet, setSheet] = useState<AttemptAnswerSheet | null>(
    initialSheet ?? null,
  );
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string>();
  const [isUnlocking, setIsUnlocking] = useState(false);

  const completedDate = summary.completedAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  async function handleUnlock(event: FormEvent) {
    event.preventDefault();

    const parsed = unlockAnswerSheetSchema.safeParse({
      facultySlug: summary.facultySlug,
      quizSetSlug: summary.quizSetSlug,
      code,
      attemptId: summary.attemptId,
    });

    if (!parsed.success) {
      setCodeError(
        parsed.error.flatten().fieldErrors.code?.[0] ??
          parsed.error.issues[0]?.message ??
          "Enter a valid access code.",
      );
      return;
    }

    setCodeError(undefined);
    setIsUnlocking(true);

    try {
      const response = await unlockAnswerSheet(parsed.data);

      if (!response.success) {
        setCodeError(response.errors?.code ?? response.message);
        toast.error(response.message);
        return;
      }

      setSheet(response.data);
      toast.success("Answer sheet unlocked.");
    } finally {
      setIsUnlocking(false);
    }
  }

  return (
    <PublicPageShell
      backHref={`/faculty/${summary.facultySlug}`}
      backLabel={`Back to ${summary.facultyName}`}
    >
      <div className="mb-8 space-y-3 border-b pb-8">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          {summary.facultyName}
        </p>
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">
          {summary.quizSetTitle}
        </h1>
        <p className="text-sm text-muted-foreground">Submitted {completedDate}</p>
        {summary.isFreeMock ? (
          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              href={`/faculty/${summary.facultySlug}/${summary.quizSetSlug}/leaderboard`}
              className="underline underline-offset-4"
            >
              View leaderboard
            </Link>
            <Link href="/mocks" className="underline underline-offset-4">
              All free mocks
            </Link>
          </div>
        ) : null}
      </div>

      <section className="mb-10 space-y-6 border bg-card p-6 md:p-8">
        <div className="space-y-2 text-center sm:text-left">
          <div className="mx-auto flex size-12 items-center justify-center border sm:mx-0">
            <Trophy className="size-5" />
          </div>
          <h2 className="font-display text-3xl tracking-tight">Set complete</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {summary.isFreeMock
              ? "Your score is on the public leaderboard."
              : "Your score is saved against your access code."}
            {!sheet
              ? " Enter that same code to unlock your full answer sheet."
              : " Review every question below."}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-px border bg-border text-center">
          <ResultStat label="Score" value={`${summary.score}`} />
          <ResultStat label="Out of" value={`${summary.maxScore}`} />
          <ResultStat label="Percent" value={`${summary.percentage}%`} />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            By subject
          </p>
          <div className="divide-y border">
            {summary.sections.map((section) => (
              <div
                key={section.sectionId}
                className="flex items-center justify-between bg-background px-4 py-3 text-sm"
              >
                <span>{section.subjectName}</span>
                <span className="font-medium">
                  {section.score} / {section.fullMarks}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!sheet ? (
        <section className="mx-auto w-full max-w-lg border bg-card p-6 md:p-8">
          <div className="mb-6 space-y-2">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Answer sheet
            </p>
            <h2 className="font-display text-3xl tracking-tight">
              Enter your access code
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {summary.isFreeMock
                ? "Enter the shared free-mock code you used to take this set to view which answers were right or wrong."
                : "Use the same one-time code you used to take this quiz to view which answers were right or wrong."}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleUnlock}>
            <Field>
              <FieldLabel htmlFor="result-code">Access code</FieldLabel>
              <Input
                id="result-code"
                value={code}
                onChange={(event) => {
                  setCodeError(undefined);
                  setCode(event.target.value.toUpperCase());
                }}
                placeholder="Example: FST-2026-88"
                className="h-11 tracking-wide"
                aria-invalid={Boolean(codeError)}
                autoComplete="off"
              />
              <FieldError>{codeError}</FieldError>
            </Field>

            <Button type="submit" className="w-full" disabled={isUnlocking}>
              {isUnlocking ? "Unlocking..." : "View answer sheet"}
            </Button>
          </form>
        </section>
      ) : (
        <ContentLeakGuard
          watermark={`${summary.quizSetTitle} · ${code.trim().toUpperCase() || summary.attemptId.slice(0, 8)}`}
        >
          <AnswerSheetView sections={sheet.sections} />
        </ContentLeakGuard>
      )}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="flex-1" variant="outline">
          <Link href="/">Back home</Link>
        </Button>
        <Button asChild className="flex-1">
          <Link
            href={
              summary.isFreeMock
                ? `/faculty/${summary.facultySlug}/${summary.quizSetSlug}`
                : `/faculty/${summary.facultySlug}`
            }
          >
            {summary.isFreeMock ? "Take again" : "More quiz sets"}
          </Link>
        </Button>
      </div>
    </PublicPageShell>
  );
}

function AnswerSheetView({ sections }: { sections: AnswerSheetSection[] }) {
  return (
    <section className="space-y-10">
      <div className="space-y-2 border-b pb-6">
        <h2 className="font-display text-3xl tracking-tight">Answer sheet</h2>
        <p className="text-sm text-muted-foreground">
          Green means you picked the right option. Red means your choice was
          wrong — the correct answer is outlined.
        </p>
        <div className="flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground">
          <Legend
            swatch="bg-emerald-500/15 border-emerald-600/40"
            label="Your correct pick"
          />
          <Legend
            swatch="bg-red-500/10 border-red-600/40"
            label="Your wrong pick"
          />
          <Legend
            swatch="border-emerald-600 border-2 bg-background"
            label="Correct answer"
          />
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.sectionId} className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
            <div>
              <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                Subject section
              </p>
              <h3 className="mt-1 font-display text-3xl tracking-tight">
                {section.subjectName}
              </h3>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {section.score} / {section.fullMarks} marks
            </p>
          </div>

          <div className="space-y-4">
            {section.questions.map((question) => (
              <QuestionReview key={question.id} question={question} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function QuestionReview({ question }: { question: AnswerSheetQuestion }) {
  return (
    <article className="border bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Q{question.position}
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-1 border px-2.5 py-1 text-xs font-medium",
            question.isCorrect
              ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border-red-600/30 bg-red-500/10 text-red-800 dark:text-red-300",
          )}
        >
          {question.isCorrect ? (
            <>
              <Check className="size-3.5" />
              Correct
            </>
          ) : (
            <>
              <X className="size-3.5" />
              Incorrect
            </>
          )}
        </span>
      </div>

      <MathText
        as="h4"
        text={question.prompt}
        className="mt-2 text-base font-medium leading-7 md:text-lg"
      />

      <div className="mt-5 space-y-2.5">
        {question.options.map((option, index) => (
          <OptionRow
            key={option.id}
            option={option}
            letter={OPTION_LETTERS[index] ?? String(index + 1)}
          />
        ))}
      </div>
    </article>
  );
}

function OptionRow({
  option,
  letter,
}: {
  option: AnswerSheetOption;
  letter: string;
}) {
  const selectedCorrect = option.isSelected && option.isCorrect;
  const selectedWrong = option.isSelected && !option.isCorrect;
  const correctUnselected = option.isCorrect && !option.isSelected;

  return (
    <div
      className={cn(
        "flex w-full items-start gap-3 border px-4 py-3.5 text-left",
        selectedCorrect &&
          "border-emerald-600/50 bg-emerald-500/10 text-emerald-950 dark:text-emerald-50",
        selectedWrong &&
          "border-red-600/50 bg-red-500/10 text-red-950 dark:text-red-50",
        correctUnselected && "border-2 border-emerald-600 bg-emerald-500/5",
        !option.isSelected &&
          !option.isCorrect &&
          "border-border bg-background text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center border text-xs font-medium",
          selectedCorrect && "border-emerald-700 bg-emerald-700 text-white",
          selectedWrong && "border-red-700 bg-red-700 text-white",
          correctUnselected && "border-emerald-700 bg-emerald-700 text-white",
        )}
      >
        {letter}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <MathText text={option.label} className="text-sm leading-6" />
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          {option.isSelected ? (
            <span
              className={
                option.isCorrect
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-red-700 dark:text-red-300"
              }
            >
              Your answer
            </span>
          ) : null}
          {option.isCorrect ? (
            <span className="text-emerald-700 dark:text-emerald-300">
              Correct answer
            </span>
          ) : null}
        </div>
      </div>
      {selectedCorrect || correctUnselected ? (
        <Check className="mt-1 size-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
      ) : null}
      {selectedWrong ? (
        <X className="mt-1 size-4 shrink-0 text-red-700 dark:text-red-300" />
      ) : null}
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("size-3.5 border", swatch)} />
      {label}
    </span>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-4">
      <p className="font-display text-2xl tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
