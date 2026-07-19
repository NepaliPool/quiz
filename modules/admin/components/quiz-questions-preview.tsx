"use client";

import { Eye } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { MathText } from "@/components/math-text";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

export type PreviewOption = {
  id: string;
  label: string;
  isCorrect: boolean;
};

export type PreviewQuestion = {
  id: string;
  prompt: string;
  marks: number;
  options: PreviewOption[];
};

export type PreviewSection = {
  id: string;
  subjectName: string;
  questions: PreviewQuestion[];
};

function sectionMarks(questions: PreviewQuestion[]) {
  return questions.reduce((sum, question) => sum + question.marks, 0);
}

export function QuizQuestionsPreviewTrigger({
  sections,
  quizTitle,
  label = "Preview",
  disabled = false,
  className,
}: {
  sections: PreviewSection[];
  quizTitle?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const questionCount = useMemo(
    () => sections.reduce((sum, section) => sum + section.questions.length, 0),
    [sections],
  );

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled || questionCount === 0}
        className={className}
        onClick={() => setOpen(true)}
      >
        <Eye className="size-4" />
        {label}
      </Button>
      <QuizQuestionsPreviewSheet
        open={open}
        onOpenChange={setOpen}
        sections={sections}
        quizTitle={quizTitle}
      />
    </>
  );
}

export function QuizQuestionsPreviewSheet({
  open,
  onOpenChange,
  sections,
  quizTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: PreviewSection[];
  quizTitle?: string;
}) {
  const [showAnswers, setShowAnswers] = useState(true);
  const totalQuestions = sections.reduce(
    (sum, section) => sum + section.questions.length,
    0,
  );
  const totalMarks = sections.reduce(
    (sum, section) => sum + sectionMarks(section.questions),
    0,
  );
  const isMultiSection = sections.length > 1;
  const heading =
    quizTitle?.trim() ||
    (sections.length === 1 ? sections[0]?.subjectName : "Quiz preview");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-2xl"
        showCloseButton
      >
        <SheetHeader className="border-b px-5 py-4 pr-12 text-left">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                Student preview
              </p>
              <SheetTitle className="font-display text-2xl tracking-tight">
                {heading}
              </SheetTitle>
              <SheetDescription>
                {totalQuestions} question{totalQuestions === 1 ? "" : "s"} ·{" "}
                {totalMarks} mark{totalMarks === 1 ? "" : "s"}
                {isMultiSection
                  ? ` · ${sections.length} subjects`
                  : null}
              </SheetDescription>
            </div>
            <Button
              type="button"
              size="sm"
              variant={showAnswers ? "default" : "outline"}
              className="shrink-0"
              onClick={() => setShowAnswers((current) => !current)}
            >
              {showAnswers ? "Hide answers" : "Show answers"}
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {totalQuestions === 0 ? (
            <div className="border border-dashed px-6 py-16 text-center">
              <p className="font-medium">No questions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add or paste questions, then preview how students will see them.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {sections.map((section) => (
                <PreviewSectionBlock
                  key={section.id}
                  section={section}
                  showSubjectHeader={isMultiSection}
                  showAnswers={showAnswers}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function PreviewSectionBlock({
  section,
  showSubjectHeader,
  showAnswers,
}: {
  section: PreviewSection;
  showSubjectHeader: boolean;
  showAnswers: boolean;
}) {
  const marks = sectionMarks(section.questions);

  return (
    <div className="space-y-5">
      {showSubjectHeader ? (
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
            {marks} marks · {section.questions.length} questions
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {section.questions.map((question, index) => (
          <PreviewQuestionCard
            key={question.id}
            question={question}
            position={index + 1}
            showAnswers={showAnswers}
          />
        ))}
      </div>
    </div>
  );
}

function PreviewQuestionCard({
  question,
  position,
  showAnswers,
}: {
  question: PreviewQuestion;
  position: number;
  showAnswers: boolean;
}) {
  const prompt = question.prompt.trim();
  const correctCount = question.options.filter((option) => option.isCorrect)
    .length;

  return (
    <article className="border bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Q{position}
        </p>
        {showAnswers && correctCount !== 1 ? (
          <span className="text-xs font-medium text-destructive">
            {correctCount === 0
              ? "No correct option marked"
              : "Multiple correct options"}
          </span>
        ) : null}
      </div>

      <MathText
        as="h4"
        text={prompt || "Untitled question"}
        className={cn(
          "mt-2 text-base font-medium leading-7 md:text-lg",
          !prompt && "text-muted-foreground italic",
        )}
      />

      <div className="mt-5 space-y-2.5">
        {question.options.map((option, index) => {
          const label = option.label.trim();
          const highlight = showAnswers && option.isCorrect;

          return (
            <div
              key={option.id}
              className={cn(
                "flex w-full items-start gap-3 border px-4 py-3.5 text-left",
                highlight
                  ? "border-foreground bg-muted"
                  : "bg-background",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center border text-xs font-medium",
                  highlight &&
                    "border-foreground bg-foreground text-background",
                )}
              >
                {OPTION_LETTERS[index] ?? String(index + 1)}
              </span>
              <MathText
                text={label || "Empty option"}
                className={cn(
                  "min-w-0 flex-1 text-sm leading-6",
                  !label && "text-muted-foreground italic",
                )}
              />
              {highlight ? (
                <span className="mt-0.5 shrink-0 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Correct
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </article>
  );
}
