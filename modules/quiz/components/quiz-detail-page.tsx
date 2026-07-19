"use client";

import {
  CheckCircle2,
  Clock3,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { startAttempt } from "@/actions/quiz/start-attempt";
import { submitAttempt } from "@/actions/quiz/submit-attempt";
import { MathText } from "@/components/math-text";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type {
  PublicQuizSection,
  PublicQuizSetMeta,
} from "@/dal/public/get-quiz-set";
import { cn } from "@/lib/utils";
import { PublicPageShell } from "@/modules/public/components/public-page-shell";
import { ContentLeakGuard } from "@/modules/quiz/components/content-leak-guard";
import {
  startAttemptSchema,
  submitAttemptSchema,
} from "@/modules/quiz/schemas/attempt";

type Step = "code" | "taking";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

function resultHref(quizSet: PublicQuizSetMeta, code: string) {
  return `/faculty/${quizSet.faculty.slug}/${quizSet.slug}/result?code=${encodeURIComponent(code)}`;
}

export function QuizDetailPage({
  quizSet,
  initialCode,
}: {
  quizSet: PublicQuizSetMeta;
  initialCode?: string;
}) {
  const router = useRouter();
  const autoStartedRef = useRef(false);
  const [step, setStep] = useState<Step>("code");
  const [accessCode, setAccessCode] = useState(initialCode?.toUpperCase() ?? "");
  const [codeError, setCodeError] = useState<string>();
  const [isVerifying, setIsVerifying] = useState(Boolean(initialCode));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string>();
  const [sections, setSections] = useState<PublicQuizSection[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const totalMarks = quizSet.totalMarks;
  const totalQuestions = quizSet.questionCount;
  const answeredCount = Object.keys(answers).length;
  const progress =
    totalQuestions === 0
      ? 0
      : Math.round((answeredCount / totalQuestions) * 100);

  async function verifyAndStart(code: string, { silent = false } = {}) {
    const parsed = startAttemptSchema.safeParse({
      quizSetId: quizSet.id,
      code,
    });

    if (!parsed.success) {
      setCodeError(
        parsed.error.flatten().fieldErrors.code?.[0] ??
          parsed.error.issues[0]?.message ??
          "Enter a valid access code.",
      );
      setIsVerifying(false);
      return;
    }

    setCodeError(undefined);
    setIsVerifying(true);

    try {
      const response = await startAttempt(parsed.data);

      if (!response.success) {
        setCodeError(response.errors?.code ?? response.message);
        if (!silent) {
          toast.error(response.message);
        }
        return;
      }

      if (response.data.completed) {
        toast.success(response.message ?? "Viewing your results.");
        router.replace(resultHref(quizSet, parsed.data.code));
        return;
      }

      if (!response.data.sections?.length) {
        setCodeError("This quiz set has no questions yet.");
        toast.error("This quiz set has no questions yet.");
        return;
      }

      setAttemptId(response.data.attemptId);
      setAccessCode(parsed.data.code);
      setSections(response.data.sections);
      setStep("taking");
      toast.success(
        response.message ??
          (response.data.resumed
            ? "Resuming your in-progress attempt."
            : "Code accepted. Good luck."),
      );

      router.replace(`/faculty/${quizSet.faculty.slug}/${quizSet.slug}`, {
        scroll: false,
      });
    } finally {
      setIsVerifying(false);
    }
  }

  useEffect(() => {
    if (!initialCode || autoStartedRef.current) {
      return;
    }

    autoStartedRef.current = true;
    void verifyAndStart(initialCode, { silent: true });
    // Auto-start once when arriving with ?code=
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  async function handleVerifyCode(event: FormEvent) {
    event.preventDefault();
    await verifyAndStart(accessCode);
  }

  function selectOption(questionId: string, optionId: string) {
    if (isSubmitting) return;

    setAnswers((current) => ({
      ...current,
      [questionId]: optionId,
    }));
  }

  async function handleSubmit() {
    if (isSubmitting) return;

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
      router.push(resultHref(quizSet, accessCode.trim().toUpperCase()));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PublicPageShell
      backHref={`/faculty/${quizSet.faculty.slug}`}
      backLabel={`Back to ${quizSet.faculty.name}`}
    >
      <div className="mb-10 space-y-5 border-b pb-8">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          {quizSet.faculty.name}
        </p>

        <div className="space-y-3">
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">
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
              className="border bg-muted/50 px-3 py-1.5 text-xs font-medium"
            >
              {section.subject.name} · {section.fullMarks} marks
            </span>
          ))}
        </div>
      </div>

      {step === "code" && (
        <section className="w-full max-w-lg border bg-card p-6 md:p-8">
          <div className="mb-6 space-y-2">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Access required
            </p>
            <h2 className="font-display text-3xl tracking-tight">
              {isVerifying && initialCode
                ? "Starting your quiz…"
                : "Enter your one-time code"}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {isVerifying && initialCode
                ? "Validating your access code and opening the quiz set."
                : "One code unlocks the full faculty set — all subject sections on this page."}
            </p>
          </div>

          {isVerifying && initialCode ? (
            <div className="space-y-3">
              <div className="h-11 w-full animate-pulse bg-muted" />
              <div className="h-10 w-40 animate-pulse bg-muted" />
            </div>
          ) : (
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
                  disabled={isVerifying}
                />
                <FieldError>{codeError}</FieldError>
              </Field>

              <Button type="submit" className="w-full" disabled={isVerifying}>
                {isVerifying ? "Verifying..." : "Start quiz set"}
              </Button>
            </form>
          )}
        </section>
      )}

      {step === "taking" && sections ? (
        <ContentLeakGuard
          watermark={`${quizSet.title} · ${accessCode.trim().toUpperCase() || "QuizDesk"}`}
        >
          <section className="space-y-10">
            <div className="sticky top-0 z-10 -mx-6 border-b bg-background/95 px-6 py-4 backdrop-blur">
              <div className="flex items-center justify-between gap-4 text-sm">
                <p className="text-muted-foreground">
                  {answeredCount} of {totalQuestions} answered
                </p>
                <p className="font-medium">{progress}%</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden border bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {sections.map((section) => {
                  const done = section.questions.every((q) => answers[q.id]);
                  return (
                    <a
                      key={section.id}
                      href={`#section-${section.id}`}
                      className={cn(
                        "border px-3 py-1 text-xs transition-colors",
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

            {sections.map((section) => (
              <SubjectSection
                key={section.id}
                section={section}
                answers={answers}
                disabled={isSubmitting}
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
        </ContentLeakGuard>
      ) : null}
    </PublicPageShell>
  );
}

function SubjectSection({
  section,
  answers,
  disabled = false,
  onSelect,
}: {
  section: PublicQuizSection;
  answers: Record<string, string>;
  disabled?: boolean;
  onSelect: (questionId: string, optionId: string) => void;
}) {
  return (
    <div id={`section-${section.id}`} className="scroll-mt-28 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Subject section
          </p>
          <h2 className="mt-1 font-display text-3xl tracking-tight">
            {section.subject.name}
          </h2>
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {section.fullMarks} marks · {section.questions.length} questions
        </p>
      </div>

      <div className="space-y-4">
        {section.questions.map((question) => (
          <article key={question.id} className="border bg-card p-5 md:p-6">
            <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
              Q{question.position}
            </p>
            <MathText
              as="h3"
              text={question.prompt}
              className="mt-2 text-base font-medium leading-7 md:text-lg"
            />

            <div className="mt-5 space-y-2.5">
              {question.options.map((option, index) => {
                const selected = answers[question.id] === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelect(question.id, option.id)}
                    className={cn(
                      "flex w-full items-start gap-3 border px-4 py-3.5 text-left transition-colors",
                      selected
                        ? "border-foreground bg-muted"
                        : "hover:bg-muted/60",
                      disabled &&
                        "cursor-not-allowed opacity-60 hover:bg-transparent",
                      disabled && selected && "hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center border text-xs font-medium",
                        selected &&
                          "border-foreground bg-foreground text-background",
                      )}
                    >
                      {OPTION_LETTERS[index]}
                    </span>
                    <MathText
                      text={option.label}
                      className="text-sm leading-6"
                    />
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
    <span className="inline-flex items-center gap-2 border px-3 py-1.5">
      {icon}
      {label}
    </span>
  );
}
