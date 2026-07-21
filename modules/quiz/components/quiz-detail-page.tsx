"use client";

import { CheckCircle2, Clock3, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useEffectEvent,
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
import {
  clearMockAttemptCookie,
  getMockAttemptCookie,
  setMockAttemptCookie,
} from "@/lib/mock-attempt-cookie";
import { PublicPageShell } from "@/modules/public/components/public-page-shell";
import { ContentLeakGuard } from "@/modules/quiz/components/content-leak-guard";
import {
  startAttemptSchema,
  submitAttemptSchema,
} from "@/modules/quiz/schemas/attempt";

type Step = "code" | "taking";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;
const WARN_20_MS = 20 * 60_000;
const WARN_5_MS = 5 * 60_000;

function resultHref(
  quizSet: PublicQuizSetMeta,
  {
    code,
    attemptId,
  }: {
    code?: string;
    attemptId?: string;
  },
) {
  const params = new URLSearchParams();
  if (attemptId) {
    params.set("attemptId", attemptId);
  }
  if (code) {
    params.set("code", code);
  }
  return `/faculty/${quizSet.faculty.slug}/${quizSet.slug}/result?${params.toString()}`;
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function QuizDetailPage({
  quizSet,
  initialCode,
  initialName,
}: {
  quizSet: PublicQuizSetMeta;
  initialCode?: string;
  initialName?: string;
}) {
  const router = useRouter();
  const autoStartedRef = useRef(false);
  const warned20Ref = useRef(false);
  const warned5Ref = useRef(false);
  const autoSubmitRef = useRef(false);
  const [step, setStep] = useState<Step>("code");
  const [accessCode, setAccessCode] = useState(initialCode?.toUpperCase() ?? "");
  const [participantName, setParticipantName] = useState(initialName ?? "");
  const [nameError, setNameError] = useState<string>();
  const [codeError, setCodeError] = useState<string>();
  const [isVerifying, setIsVerifying] = useState(() => {
    if (!initialCode) {
      return false;
    }
    if (!quizSet.isFreeMock) {
      return true;
    }
    return Boolean(initialName?.trim() || getMockAttemptCookie(quizSet.id));
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string>();
  const [deadlineAt, setDeadlineAt] = useState<string>();
  const [remainingMs, setRemainingMs] = useState<number>();
  const [sections, setSections] = useState<PublicQuizSection[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hasStoredAttempt, setHasStoredAttempt] = useState(false);

  const totalMarks = quizSet.totalMarks;
  const totalQuestions = quizSet.questionCount;
  const answeredCount = Object.keys(answers).length;
  const progress =
    totalQuestions === 0
      ? 0
      : Math.round((answeredCount / totalQuestions) * 100);

  const leaderboardHref = `/faculty/${quizSet.faculty.slug}/${quizSet.slug}/leaderboard`;

  useEffect(() => {
    if (!quizSet.isFreeMock) {
      return;
    }
    setHasStoredAttempt(Boolean(getMockAttemptCookie(quizSet.id)));
  }, [quizSet.id, quizSet.isFreeMock]);

  async function verifyAndStart(
    code: string,
    name: string,
    { silent = false, forceNew = false } = {},
  ) {
    const resumeAttemptId =
      !forceNew && quizSet.isFreeMock
        ? getMockAttemptCookie(quizSet.id)
        : undefined;

    const parsed = startAttemptSchema.safeParse({
      quizSetId: quizSet.id,
      code,
      participantName: name,
      resumeAttemptId: resumeAttemptId ?? undefined,
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setCodeError(fieldErrors.code?.[0] ?? parsed.error.issues[0]?.message);
      setNameError(fieldErrors.participantName?.[0]);
      setIsVerifying(false);
      return;
    }

    // New free-mock start needs a name; resume from cookie does not.
    if (
      quizSet.isFreeMock &&
      !resumeAttemptId &&
      !parsed.data.participantName?.trim()
    ) {
      setNameError("Enter your name to start this free mock.");
      setIsVerifying(false);
      return;
    }

    setCodeError(undefined);
    setNameError(undefined);
    setIsVerifying(true);

    try {
      const response = await startAttempt(parsed.data);

      if (!response.success) {
        if (resumeAttemptId) {
          clearMockAttemptCookie(quizSet.id);
          setHasStoredAttempt(false);
        }
        setCodeError(response.errors?.code ?? response.message);
        setNameError(response.errors?.participantName);
        if (!silent) {
          toast.error(response.message);
        }
        return;
      }

      const nameForResult =
        parsed.data.participantName?.trim() || participantName.trim();

      if (response.data.completed) {
        clearMockAttemptCookie(quizSet.id);
        setHasStoredAttempt(false);
        toast.success(response.message ?? "Viewing your results.");
        router.replace(
          resultHref(quizSet, {
            code: parsed.data.code,
            attemptId: response.data.attemptId,
          }),
        );
        return;
      }

      if (response.data.deadlineExpired) {
        setAccessCode(parsed.data.code);
        if (nameForResult) {
          setParticipantName(nameForResult);
        }
        if (quizSet.isFreeMock) {
          setMockAttemptCookie(quizSet.id, response.data.attemptId, {
            durationMinutes:
              response.data.durationMinutes ?? quizSet.durationMinutes,
            deadlineAt: response.data.deadlineAt,
          });
        }
        toast.message(
          response.message ?? "Time is up. Submitting your answers…",
        );
        await finalizeSubmit({
          attemptId: response.data.attemptId,
          code: parsed.data.code,
          timedOut: true,
          answers: {},
        });
        return;
      }

      if (!response.data.sections?.length) {
        setCodeError("This quiz set has no questions yet.");
        toast.error("This quiz set has no questions yet.");
        return;
      }

      setAttemptId(response.data.attemptId);
      setAccessCode(parsed.data.code);
      if (nameForResult) {
        setParticipantName(nameForResult);
      }
      setDeadlineAt(response.data.deadlineAt);
      setSections(response.data.sections);
      setAnswers({});
      setStep("taking");
      warned20Ref.current = false;
      warned5Ref.current = false;
      autoSubmitRef.current = false;

      if (quizSet.isFreeMock) {
        setMockAttemptCookie(quizSet.id, response.data.attemptId, {
          durationMinutes:
            response.data.durationMinutes ?? quizSet.durationMinutes,
          deadlineAt: response.data.deadlineAt,
        });
        setHasStoredAttempt(true);
      }

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
    if (autoStartedRef.current) {
      return;
    }

    if (quizSet.isFreeMock) {
      const cookieId = getMockAttemptCookie(quizSet.id);
      // Resume with code + cookie (name optional). First start still needs name.
      if (initialCode && (initialName?.trim() || cookieId)) {
        autoStartedRef.current = true;
        void verifyAndStart(initialCode, initialName ?? "", { silent: true });
      }
      return;
    }

    if (!initialCode) {
      return;
    }

    autoStartedRef.current = true;
    void verifyAndStart(initialCode, "", { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode, initialName, quizSet.isFreeMock]);

  async function finalizeSubmit({
    attemptId: submitAttemptId,
    code,
    timedOut,
    answers: submitAnswers,
  }: {
    attemptId: string;
    code: string;
    timedOut: boolean;
    answers: Record<string, string>;
  }) {
    const parsed = submitAttemptSchema.safeParse({
      attemptId: submitAttemptId,
      answers: submitAnswers,
      timedOut,
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

      toast.success(
        timedOut
          ? "Time is up — your answers were submitted."
          : "Quiz submitted.",
      );
      clearMockAttemptCookie(quizSet.id);
      setHasStoredAttempt(false);
      router.push(
        resultHref(quizSet, {
          code: code.trim().toUpperCase() || undefined,
          attemptId: submitAttemptId,
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const submitQuiz = useEffectEvent(async (timedOut: boolean) => {
    if (isSubmitting || !attemptId) {
      return;
    }

    if (!timedOut && !quizSet.isFreeMock) {
      const unanswered = totalQuestions - answeredCount;
      if (unanswered > 0) {
        toast.error(
          `Answer all questions before submitting (${unanswered} left).`,
        );
        return;
      }
    }

    await finalizeSubmit({
      attemptId,
      code: accessCode,
      timedOut,
      answers,
    });
  });

  useEffect(() => {
    if (step !== "taking" || !deadlineAt) {
      return;
    }

    const deadline = deadlineAt;

    function tick() {
      const remaining = new Date(deadline).getTime() - Date.now();
      const clamped = Math.max(0, remaining);

      setRemainingMs((previous) => {
        // Avoid re-renders when the displayed second has not changed.
        if (
          previous !== undefined &&
          Math.ceil(previous / 1000) === Math.ceil(clamped / 1000)
        ) {
          return previous;
        }
        return clamped;
      });

      if (remaining <= WARN_20_MS && remaining > WARN_5_MS && !warned20Ref.current) {
        warned20Ref.current = true;
        toast.warning("20 minutes left on this mock.");
      }

      if (remaining <= WARN_5_MS && remaining > 0 && !warned5Ref.current) {
        warned5Ref.current = true;
        toast.warning("5 minutes left — wrap up soon.");
      }

      if (remaining <= 0 && !autoSubmitRef.current) {
        autoSubmitRef.current = true;
        void submitQuiz(true);
      }
    }

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
    // submitQuiz is an Effect Event — omit from deps (not reactive).
  }, [step, deadlineAt]);

  async function handleVerifyCode(event: FormEvent) {
    event.preventDefault();
    await verifyAndStart(accessCode, participantName);
  }

  function selectOption(questionId: string, optionId: string) {
    if (isSubmitting) return;

    setAnswers((current) => ({
      ...current,
      [questionId]: optionId,
    }));
  }

  return (
    <PublicPageShell
      backHref={`/faculty/${quizSet.faculty.slug}`}
      backLabel={`Back to ${quizSet.faculty.name}`}
    >
      <div className="mb-10 space-y-5 border-b pb-8">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          {quizSet.faculty.name}
          {quizSet.isFreeMock ? " · Free mock" : ""}
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

        {quizSet.isFreeMock ? (
          <p className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href={leaderboardHref} className="underline underline-offset-4">
              View leaderboard
            </Link>
            <Link href="/mocks" className="underline underline-offset-4">
              All free mocks
            </Link>
          </p>
        ) : null}
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
                : quizSet.isFreeMock
                  ? "Enter free mock details"
                  : "Enter your one-time code"}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {isVerifying && initialCode
                ? "Validating your access code and opening the quiz set."
                : quizSet.isFreeMock
                  ? "Use the shared mock code and your name. The timer starts when you begin. Refreshing mid-mock keeps the timer but does not restore prior answers."
                  : "One code unlocks the full faculty set — all subject sections on this page."}
            </p>
          </div>

          {quizSet.isFreeMock && hasStoredAttempt && !isVerifying ? (
            <div className="mb-5 space-y-2 border bg-muted/40 px-4 py-3 text-sm">
              <p>
                This browser has an in-progress attempt. Enter the shared code
                to continue the timer (answers from before refresh are not
                restored).
              </p>
              <button
                type="button"
                className="underline underline-offset-4"
                onClick={() => {
                  clearMockAttemptCookie(quizSet.id);
                  setHasStoredAttempt(false);
                  toast.message("Cleared saved attempt. Start fresh with your name.");
                }}
              >
                Start a new attempt instead
              </button>
            </div>
          ) : null}

          {isVerifying && initialCode ? (
            <div className="space-y-3">
              <div className="h-11 w-full animate-pulse bg-muted" />
              <div className="h-10 w-40 animate-pulse bg-muted" />
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleVerifyCode}>
              {quizSet.isFreeMock ? (
                <Field>
                  <FieldLabel htmlFor="participant-name">Your name</FieldLabel>
                  <Input
                    id="participant-name"
                    value={participantName}
                    onChange={(event) => {
                      setNameError(undefined);
                      setParticipantName(event.target.value);
                    }}
                    placeholder="As it should appear on the leaderboard"
                    className="h-11"
                    aria-invalid={Boolean(nameError)}
                    autoComplete="name"
                    disabled={isVerifying}
                  />
                  <FieldError>{nameError}</FieldError>
                </Field>
              ) : null}

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
                {isVerifying
                  ? "Verifying..."
                  : quizSet.isFreeMock && hasStoredAttempt
                    ? "Continue attempt"
                    : "Start quiz set"}
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
                <div className="flex items-center gap-3 font-medium">
                  {remainingMs !== undefined ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 tabular-nums",
                        remainingMs <= WARN_5_MS && "text-destructive",
                      )}
                    >
                      <Clock3 className="size-4" />
                      {formatCountdown(remainingMs)}
                    </span>
                  ) : null}
                  <span>{progress}%</span>
                </div>
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
                onClick={() => void submitQuiz(false)}
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

function MetaChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 border px-3 py-1.5">
      {icon}
      {label}
    </span>
  );
}
