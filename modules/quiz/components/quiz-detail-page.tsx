"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  GraduationCap,
  KeyRound,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { startAttempt } from "@/actions/quiz/start-attempt";
import { submitAttempt } from "@/actions/quiz/submit-attempt";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type {
  PublicQuizSection,
  PublicQuizSetDetail,
} from "@/dal/public/get-quiz-set";
import { cn } from "@/lib/utils";
import {
  startAttemptSchema,
  submitAttemptSchema,
} from "@/modules/quiz/schemas/attempt";

type Step = "code" | "taking";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

function resultHref(
  quizSet: PublicQuizSetDetail,
  opts: { attemptId?: string; code?: string },
) {
  const base = `/faculty/${quizSet.faculty.slug}/${quizSet.slug}/result`;

  if (opts.code) {
    return `${base}?code=${encodeURIComponent(opts.code)}`;
  }

  if (opts.attemptId) {
    return `${base}?attempt=${encodeURIComponent(opts.attemptId)}`;
  }

  return base;
}

export function QuizDetailPage({
  quizSet,
  initialCode,
}: {
  quizSet: PublicQuizSetDetail;
  initialCode?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("code");
  const [accessCode, setAccessCode] = useState(initialCode?.toUpperCase() ?? "");
  const [codeError, setCodeError] = useState<string>();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string>();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const totalMarks = quizSet.totalMarks;
  const totalQuestions = quizSet.questionCount;
  const answeredCount = Object.keys(answers).length;
  const progress =
    totalQuestions === 0
      ? 0
      : Math.round((answeredCount / totalQuestions) * 100);

  async function handleVerifyCode(event: FormEvent) {
    event.preventDefault();

    const parsed = startAttemptSchema.safeParse({
      quizSetId: quizSet.id,
      code: accessCode,
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
    setIsVerifying(true);

    try {
      const response = await startAttempt(parsed.data);

      if (!response.success) {
        setCodeError(response.errors?.code ?? response.message);
        toast.error(response.message);
        return;
      }

      if (response.data.completed) {
        toast.success(response.message ?? "Viewing your results.");
        router.push(resultHref(quizSet, { code: parsed.data.code }));
        return;
      }

      setAttemptId(response.data.attemptId);
      setStep("taking");
      toast.success(
        response.message ??
          (response.data.resumed
            ? "Resuming your in-progress attempt."
            : "Code accepted. Good luck."),
      );
    } finally {
      setIsVerifying(false);
    }
  }

  function selectOption(questionId: string, optionId: string) {
    setAnswers((current) => ({
      ...current,
      [questionId]: optionId,
    }));
  }

  async function handleSubmit() {
    if (!attemptId) {
      toast.error("Start the quiz with a valid access code first.");
      setStep("code");
      return;
    }

    const unanswered = totalQuestions - answeredCount;
    if (unanswered > 0) {
      toast.error(`Answer all questions before submitting (${unanswered} left).`);
      return;
    }

    const parsed = submitAttemptSchema.safeParse({
      attemptId,
      answers,
    });

    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message ?? "Unable to submit this attempt.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await submitAttempt(parsed.data);

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      toast.success("Quiz submitted.");
      router.push(
        resultHref(quizSet, {
          attemptId: response.data.attemptId,
        }),
      );    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-6 py-5">
          <Link
            href={`/faculty/${quizSet.faculty.slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to {quizSet.faculty.name}
          </Link>
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg border bg-card">
              <GraduationCap className="size-4" />
            </span>
            QuizDesk
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-10 md:py-14">
        <div className="mb-10 space-y-5">
          <span className="inline-flex rounded-full border px-3 py-1 text-sm text-muted-foreground">
            {quizSet.faculty.name}
          </span>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {quizSet.title}
            </h1>
            {quizSet.description ? (
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                {quizSet.description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <MetaChip
              icon={<Trophy className="size-4" />}
              label={`${totalMarks} total marks`}
            />
            <MetaChip
              icon={<Clock3 className="size-4" />}
              label={`${quizSet.durationMinutes} min`}
            />
            <MetaChip
              icon={<CheckCircle2 className="size-4" />}
              label={`${totalQuestions} questions`}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {quizSet.sections.map((section) => (
              <span
                key={section.id}
                className="rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-medium"
              >
                {section.subject.name} · {section.fullMarks} marks
              </span>
            ))}
          </div>
        </div>

        {step === "code" && (
          <section className="w-full max-w-lg rounded-2xl border bg-card p-6 md:p-8">
            <div className="mb-6 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <KeyRound className="size-4" />
                <p className="text-sm">Access required</p>
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                Enter your one-time code
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                One code unlocks the full faculty set — all subject sections on
                this page.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleVerifyCode}>
              <Field>
                <FieldLabel htmlFor="access-code">Access code</FieldLabel>
                <Input
                  id="access-code"
                  value={accessCode}
                  onChange={(event) => {
                    setCodeError(undefined);
                    setAccessCode(event.target.value.toUpperCase());
                  }}
                  placeholder="Example: FST-2026-88"
                  className="h-11 tracking-wide"
                  aria-invalid={Boolean(codeError)}
                  autoComplete="off"
                />
                <FieldError>{codeError}</FieldError>
              </Field>

              <Button type="submit" className="w-full" disabled={isVerifying}>
                {isVerifying ? "Verifying..." : "Start quiz set"}
              </Button>
            </form>
          </section>
        )}

        {step === "taking" && (
          <section className="space-y-10">
            <div className="sticky top-0 z-10 -mx-6 border-b bg-background/95 px-6 py-4 backdrop-blur">
              <div className="flex items-center justify-between gap-4 text-sm">
                <p className="text-muted-foreground">
                  {answeredCount} of {totalQuestions} answered
                </p>
                <p className="font-medium">{progress}%</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {quizSet.sections.map((section) => {
                  const done = section.questions.every((q) => answers[q.id]);
                  return (
                    <a
                      key={section.id}
                      href={`#section-${section.id}`}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors",
                        done
                          ? "border-foreground bg-foreground text-background"
                          : "hover:bg-muted",
                      )}
                    >
                      {section.subject.name}
                    </a>
                  );
                })}
              </div>
            </div>

            {quizSet.sections.map((section) => (
              <SubjectSection
                key={section.id}
                section={section}
                answers={answers}
                onSelect={selectOption}
              />
            ))}

            <div className="flex justify-end border-t pt-6">
              <Button
                type="button"
                size="lg"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit entire set"}
                <CheckCircle2 className="size-4" />
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function SubjectSection({
  section,
  answers,
  onSelect,
}: {
  section: PublicQuizSection;
  answers: Record<string, string>;
  onSelect: (questionId: string, optionId: string) => void;
}) {
  return (
    <div id={`section-${section.id}`} className="scroll-mt-28 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
        <div>
          <p className="text-sm text-muted-foreground">Subject section</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            {section.subject.name}
          </h2>
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {section.fullMarks} marks · {section.questions.length} questions
        </p>
      </div>

      <div className="space-y-4">
        {section.questions.map((question) => (
          <article
            key={question.id}
            className="rounded-2xl border bg-card p-5 md:p-6"
          >
            <p className="text-sm font-medium text-muted-foreground">
              Q{question.position}
            </p>
            <h3 className="mt-2 text-base font-semibold leading-7 md:text-lg">
              {question.prompt}
            </h3>

            <div className="mt-5 space-y-2.5">
              {question.options.map((option, index) => {
                const selected = answers[question.id] === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onSelect(question.id, option.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors",
                      selected
                        ? "border-foreground bg-muted"
                        : "hover:bg-muted/60",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border text-xs font-medium",
                        selected &&
                          "border-foreground bg-foreground text-background",
                      )}
                    >
                      {OPTION_LETTERS[index]}
                    </span>
                    <span className="text-sm leading-6">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function MetaChip({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
      {icon}
      {label}
    </span>
  );
}
