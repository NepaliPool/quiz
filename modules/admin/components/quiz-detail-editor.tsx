"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteQuizSet } from "@/actions/admin/quizzes/delete";
import {
  updateQuizSet,
  updateQuizSetMeta,
} from "@/actions/admin/quizzes/update";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  AdminQuizSetDetail,
  SubjectOption,
} from "@/dal/admin/get-quiz-set";
import { cn } from "@/lib/utils";
import { getZodFieldErrors } from "@/lib/action-result";
import { slugify } from "@/lib/slugify";
import {
  updateQuizSetMetaSchema,
  updateQuizSetSchema,
  type UpdateQuizSetInput,
  type UpdateQuizSetMetaInput,
} from "@/modules/admin/schemas/quiz-set";

type OptionDraft = {
  id: string;
  label: string;
  isCorrect: boolean;
};

type QuestionDraft = {
  id: string;
  prompt: string;
  options: OptionDraft[];
};

type SectionDraft = {
  id: string;
  subjectId: string;
  subjectName: string;
  questions: QuestionDraft[];
};

type EditorState = {
  id: string;
  title: string;
  slug: string;
  description: string;
  durationMinutes: string;
  isPublished: boolean;
  facultyId: string;
  facultyName: string;
  facultySlug: string;
  hasAttempts: boolean;
  sections: SectionDraft[];
};

function createEmptyOptions(): OptionDraft[] {
  return [1, 2, 3, 4].map((position) => ({
    id: `opt-${position}-${Math.random().toString(36).slice(2, 7)}`,
    label: "",
    isCorrect: position === 1,
  }));
}

function createEmptyQuestion(): QuestionDraft {
  return {
    id: `q-${Math.random().toString(36).slice(2, 9)}`,
    prompt: "",
    options: createEmptyOptions(),
  };
}

function toEditorState(quizSet: AdminQuizSetDetail): EditorState {
  return {
    id: quizSet.id,
    title: quizSet.title,
    slug: quizSet.slug,
    description: quizSet.description ?? "",
    durationMinutes: String(quizSet.durationMinutes),
    isPublished: quizSet.isPublished,
    facultyId: quizSet.facultyId,
    facultyName: quizSet.facultyName,
    facultySlug: quizSet.facultySlug,
    hasAttempts: quizSet.hasAttempts,
    sections: quizSet.sections.map((section) => ({
      id: section.id,
      subjectId: section.subjectId,
      subjectName: section.subjectName,
      questions: section.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        options: question.options.map((option) => ({
          id: option.id,
          label: option.label,
          isCorrect: option.isCorrect,
        })),
      })),
    })),
  };
}

export function QuizDetailEditor({
  initialQuizSet,
}: {
  initialQuizSet: AdminQuizSetDetail;
  facultySubjects?: SubjectOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quizSet, setQuizSet] = useState(() => toEditorState(initialQuizSet));
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<string, string>>
  >({});
  const locked = quizSet.hasAttempts;

  function updateSection(
    sectionId: string,
    updater: (section: SectionDraft) => SectionDraft,
  ) {
    if (locked) return;

    setQuizSet((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId ? updater(section) : section,
      ),
    }));
  }

  function updateQuestion(
    sectionId: string,
    questionId: string,
    patch: Partial<QuestionDraft>,
  ) {
    updateSection(sectionId, (section) => ({
      ...section,
      questions: section.questions.map((question) =>
        question.id === questionId ? { ...question, ...patch } : question,
      ),
    }));
  }

  function updateOption(
    sectionId: string,
    questionId: string,
    optionId: string,
    patch: Partial<OptionDraft>,
  ) {
    updateSection(sectionId, (section) => ({
      ...section,
      questions: section.questions.map((question) => {
        if (question.id !== questionId) return question;

        const options = question.options.map((option) => {
          if (patch.isCorrect === true) {
            return {
              ...option,
              isCorrect: option.id === optionId,
              ...(option.id === optionId ? patch : {}),
            };
          }

          return option.id === optionId ? { ...option, ...patch } : option;
        });

        return { ...question, options };
      }),
    }));
  }

  function addQuestion(sectionId: string) {
    updateSection(sectionId, (section) => ({
      ...section,
      questions: [createEmptyQuestion(), ...section.questions],
    }));
  }

  function removeQuestion(sectionId: string, questionId: string) {
    updateSection(sectionId, (section) => ({
      ...section,
      questions: section.questions.filter(
        (question) => question.id !== questionId,
      ),
    }));
  }

  function handleSave() {
    startTransition(async () => {
      if (locked) {
        const parsed = updateQuizSetMetaSchema.safeParse({
          id: quizSet.id,
          title: quizSet.title,
          slug: quizSet.slug,
          description: quizSet.description,
          durationMinutes: quizSet.durationMinutes,
          isPublished: quizSet.isPublished,
        });

        if (!parsed.success) {
          setFieldErrors(getZodFieldErrors<UpdateQuizSetMetaInput>(parsed.error));
          toast.error(parsed.error.issues[0]?.message ?? "Fix the form errors.");
          return;
        }

        setFieldErrors({});
        const result = await updateQuizSetMeta(parsed.data);

        if (!result.success) {
          if (result.errors) {
            setFieldErrors(result.errors);
          }
          toast.error(result.message);
          return;
        }

        toast.success(result.message ?? "Saved.");
        router.refresh();
        return;
      }

      const parsed = updateQuizSetSchema.safeParse({
        id: quizSet.id,
        title: quizSet.title,
        slug: quizSet.slug,
        description: quizSet.description,
        durationMinutes: quizSet.durationMinutes,
        facultyId: quizSet.facultyId,
        isPublished: quizSet.isPublished,
        sections: quizSet.sections.map((section) => ({
          id: section.id,
          subjectId: section.subjectId,
          fullMarks: section.questions.length,
          questions: section.questions.map((question) => ({
            id: question.id.startsWith("q-") ? undefined : question.id,
            prompt: question.prompt,
            marks: 1,
            options: question.options.map((option) => ({
              label: option.label,
              isCorrect: option.isCorrect,
            })),
          })),
        })),
      });

      if (!parsed.success) {
        setFieldErrors(getZodFieldErrors<UpdateQuizSetInput>(parsed.error));
        toast.error(parsed.error.issues[0]?.message ?? "Fix the form errors.");
        return;
      }

      setFieldErrors({});
      const result = await updateQuizSet(parsed.data);

      if (!result.success) {
        if (result.errors) {
          setFieldErrors(result.errors);
        }
        toast.error(result.message);
        return;
      }

      toast.success(result.message ?? "Saved.");
      router.refresh();
    });
  }

  function handleDelete() {
    if (locked) {
      toast.error(
        "Cannot delete a quiz set that already has participant attempts.",
      );
      return;
    }

    startTransition(async () => {
      const result = await deleteQuizSet({ id: quizSet.id });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message ?? "Deleted.");
      router.push("/admin/quizzes");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/admin/quizzes">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/faculty/${quizSet.facultySlug}/${quizSet.slug}`}
                target="_blank"
              >
                Public page
                <ExternalLink className="size-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending || locked}
              onClick={handleDelete}
            >
              Delete
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isPending}
            >
              Save changes
            </Button>
          </div>
        </div>

        {locked ? (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
            This quiz set already has attempts. You can update details and
            publish state, but questions and structure are locked.
          </p>
        ) : null}

        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b bg-muted/40 px-5 py-4">
            <h2 className="font-semibold tracking-tight">Quiz details</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {quizSet.facultyName}
            </p>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={quizSet.title}
                aria-invalid={Boolean(fieldErrors.title)}
                onChange={(event) =>
                  setQuizSet((current) => ({
                    ...current,
                    title: event.target.value,
                    slug: locked
                      ? current.slug
                      : slugify(event.target.value),
                  }))
                }
              />
              {fieldErrors.title ? (
                <p className="text-sm text-destructive">{fieldErrors.title}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={quizSet.slug}
                aria-invalid={Boolean(fieldErrors.slug)}
                onChange={(event) =>
                  setQuizSet((current) => ({
                    ...current,
                    slug: slugify(event.target.value),
                  }))
                }
              />
              {fieldErrors.slug ? (
                <p className="text-sm text-destructive">{fieldErrors.slug}</p>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={quizSet.description}
                onChange={(event) =>
                  setQuizSet((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-duration">Duration (minutes)</Label>
              <Input
                id="edit-duration"
                type="number"
                min={1}
                value={quizSet.durationMinutes}
                aria-invalid={Boolean(fieldErrors.durationMinutes)}
                onChange={(event) =>
                  setQuizSet((current) => ({
                    ...current,
                    durationMinutes: event.target.value,
                  }))
                }
              />
              {fieldErrors.durationMinutes ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.durationMinutes}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-published"
                checked={quizSet.isPublished}
                onCheckedChange={(checked) =>
                  setQuizSet((current) => ({
                    ...current,
                    isPublished: checked === true,
                  }))
                }
              />
              <Label htmlFor="edit-published">Published</Label>
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-8">
        {quizSet.sections.map((section) => (
          <section
            key={section.id}
            className="overflow-hidden rounded-2xl border bg-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl border bg-background text-sm font-semibold">
                  {section.subjectName.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <h2 className="font-semibold tracking-tight">
                    {section.subjectName}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {section.questions.length} marks · 1 per question
                  </p>
                </div>
              </div>
              {!locked ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addQuestion(section.id)}
                >
                  <Plus className="size-4" />
                  Add question
                </Button>
              ) : null}
            </div>

            <div
              className={cn(
                "grid gap-4 p-5 lg:grid-cols-2",
                section.questions.length > 6 && "max-h-216 overflow-y-auto",
              )}
            >
              {section.questions.map((question, questionIndex) => (
                <div
                  key={question.id}
                  className="group flex flex-col gap-4 rounded-xl border bg-background p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-2.5 shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      Q{questionIndex + 1}
                    </span>
                    <Textarea
                      value={question.prompt}
                      disabled={locked}
                      onChange={(event) =>
                        updateQuestion(section.id, question.id, {
                          prompt: event.target.value,
                        })
                      }
                      rows={2}
                      className="min-h-18 flex-1 resize-none"
                      placeholder="Question prompt"
                    />
                    {!locked && section.questions.length > 1 ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() =>
                          removeQuestion(section.id, question.id)
                        }
                        aria-label={`Delete question ${questionIndex + 1}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    {question.options.map((option, optionIndex) => (
                      <button
                        key={option.id}
                        type="button"
                        disabled={locked}
                        onClick={() =>
                          updateOption(section.id, question.id, option.id, {
                            isCorrect: true,
                          })
                        }
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors disabled:opacity-70",
                          option.isCorrect
                            ? "border-foreground/30 bg-muted"
                            : "border-transparent hover:bg-muted/50",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-md border text-xs font-medium",
                            option.isCorrect &&
                              "border-foreground bg-foreground text-background",
                          )}
                        >
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                        <Input
                          value={option.label}
                          disabled={locked}
                          onChange={(event) =>
                            updateOption(
                              section.id,
                              question.id,
                              option.id,
                              { label: event.target.value },
                            )
                          }
                          onClick={(event) => event.stopPropagation()}
                          placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                          className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                        />
                        {option.isCorrect ? (
                          <span className="shrink-0 text-xs font-medium text-muted-foreground">
                            Correct
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
