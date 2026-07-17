"use server";

import { and, eq, inArray, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  actionFailure,
  actionSuccess,
  isUniqueViolation,
  zodErrorMap,
  type ActionResult,
} from "@/lib/action-result";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";
import { db } from "@/db";
import {
  options,
  questions,
  quizSections,
  quizSets,
  subjects,
} from "@/db/schema";
import { quizSetHasAttempts } from "@/dal/admin/get-quiz-set";
import {
  updateQuizSetMetaSchema,
  updateQuizSetSchema,
  type UpdateQuizSetInput,
  type UpdateQuizSetMetaInput,
} from "@/modules/admin/schemas/quiz-set";

async function revalidateQuizPaths(quizSetId: string, facultySlug?: string) {
  revalidatePath("/admin/quizzes");
  revalidatePath(`/admin/quizzes/${quizSetId}`);
  revalidatePath("/admin/codes");
  revalidatePath("/admin");

  if (facultySlug) {
    revalidatePath(`/faculty/${facultySlug}`);
  }
}

export async function updateQuizSetMeta(
  input: UpdateQuizSetMetaInput,
): Promise<ActionResult<{ id: string }>> {
  const admin = await getCurrentAdmin();

  if (!admin.success) {
    return actionFailure(admin.message);
  }

  const parsed = updateQuizSetMetaSchema.safeParse(input);

  if (!parsed.success) {
    return actionFailure(
      "Please fix the highlighted fields.",
      zodErrorMap(parsed.error),
    );
  }

  const existing = await db.query.quizSets.findFirst({
    where: eq(quizSets.id, parsed.data.id),
    with: {
      faculty: {
        columns: { slug: true },
      },
    },
  });

  if (!existing) {
    return actionFailure("Quiz set not found.");
  }

  try {
    await db
      .update(quizSets)
      .set({
        title: parsed.data.title,
        slug: parsed.data.slug,
        description: parsed.data.description || null,
        durationMinutes: parsed.data.durationMinutes,
        isPublished: parsed.data.isPublished,
      })
      .where(eq(quizSets.id, parsed.data.id));
  } catch (error) {
    console.error("updateQuizSetMeta failed:", error);

    if (isUniqueViolation(error)) {
      return actionFailure(
        "A quiz set with this slug already exists for the faculty.",
        { slug: "Slug must be unique within the faculty." },
      );
    }

    return actionFailure("Could not update quiz set. Please try again.");
  }

  await revalidateQuizPaths(parsed.data.id, existing.faculty.slug);
  return actionSuccess({ id: parsed.data.id }, "Quiz set updated.");
}

export async function updateQuizSet(
  input: UpdateQuizSetInput,
): Promise<ActionResult<{ id: string }>> {
  const admin = await getCurrentAdmin();

  if (!admin.success) {
    return actionFailure(admin.message);
  }

  const parsed = updateQuizSetSchema.safeParse(input);

  if (!parsed.success) {
    return actionFailure(
      "Please fix the highlighted fields.",
      zodErrorMap(parsed.error),
    );
  }

  const data = parsed.data;

  const existing = await db.query.quizSets.findFirst({
    where: eq(quizSets.id, data.id),
    with: {
      faculty: {
        columns: { id: true, slug: true },
      },
    },
  });

  if (!existing) {
    return actionFailure("Quiz set not found.");
  }

  if (data.facultyId !== existing.facultyId) {
    return actionFailure("Faculty cannot be changed after creation.", {
      facultyId: "Faculty is locked for this quiz set.",
    });
  }

  const hasAttempts = await quizSetHasAttempts(data.id);

  if (hasAttempts) {
    return updateQuizSetMeta({
      id: data.id,
      title: data.title,
      slug: data.slug,
      description: data.description,
      durationMinutes: data.durationMinutes,
      isPublished: data.isPublished,
    });
  }

  const subjectIds = data.sections.map((section) => section.subjectId);
  const facultySubjects = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(
      and(
        eq(subjects.facultyId, data.facultyId),
        inArray(subjects.id, subjectIds),
      ),
    );

  if (facultySubjects.length !== new Set(subjectIds).size) {
    return actionFailure(
      "Every section subject must belong to the selected faculty.",
      { sections: "Invalid subject selection." },
    );
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(quizSets)
        .set({
          title: data.title,
          slug: data.slug,
          description: data.description || null,
          durationMinutes: data.durationMinutes,
          isPublished: data.isPublished,
        })
        .where(eq(quizSets.id, data.id));

      const keptSectionIds = data.sections
        .map((section) => section.id)
        .filter((id): id is string => Boolean(id));

      if (keptSectionIds.length > 0) {
        await tx
          .delete(quizSections)
          .where(
            and(
              eq(quizSections.quizSetId, data.id),
              notInArray(quizSections.id, keptSectionIds),
            ),
          );
      } else {
        await tx
          .delete(quizSections)
          .where(eq(quizSections.quizSetId, data.id));
      }

      // Park existing rows at high positive positions so we can reassign
      // 1..n without violating UNIQUE (quiz_set_id, position) or CHECK (> 0).
      const POSITION_PARK = 1_000_000;

      const existingSections = await tx
        .select({ id: quizSections.id })
        .from(quizSections)
        .where(eq(quizSections.quizSetId, data.id));

      for (const [index, section] of existingSections.entries()) {
        await tx
          .update(quizSections)
          .set({ position: POSITION_PARK + index + 1 })
          .where(eq(quizSections.id, section.id));
      }

      for (const [sectionIndex, section] of data.sections.entries()) {
        const sectionId = section.id ?? crypto.randomUUID();

        if (section.id) {
          await tx
            .update(quizSections)
            .set({
              subjectId: section.subjectId,
              fullMarks: section.fullMarks,
              position: sectionIndex + 1,
            })
            .where(
              and(
                eq(quizSections.id, sectionId),
                eq(quizSections.quizSetId, data.id),
              ),
            );
        } else {
          await tx.insert(quizSections).values({
            id: sectionId,
            quizSetId: data.id,
            subjectId: section.subjectId,
            fullMarks: section.fullMarks,
            position: sectionIndex + 1,
          });
        }

        const keptQuestionIds = section.questions
          .map((question) => question.id)
          .filter((id): id is string => Boolean(id));

        if (keptQuestionIds.length > 0) {
          await tx
            .delete(questions)
            .where(
              and(
                eq(questions.quizSectionId, sectionId),
                notInArray(questions.id, keptQuestionIds),
              ),
            );
        } else {
          await tx
            .delete(questions)
            .where(eq(questions.quizSectionId, sectionId));
        }

        const existingQuestions = await tx
          .select({ id: questions.id })
          .from(questions)
          .where(eq(questions.quizSectionId, sectionId));

        for (const [index, question] of existingQuestions.entries()) {
          await tx
            .update(questions)
            .set({ position: POSITION_PARK + index + 1 })
            .where(eq(questions.id, question.id));
        }

        for (const [questionIndex, question] of section.questions.entries()) {
          const questionId = question.id ?? crypto.randomUUID();

          if (question.id) {
            await tx
              .update(questions)
              .set({
                prompt: question.prompt,
                position: questionIndex + 1,
              })
              .where(
                and(
                  eq(questions.id, questionId),
                  eq(questions.quizSectionId, sectionId),
                ),
              );

            await tx.delete(options).where(eq(options.questionId, questionId));
          } else {
            await tx.insert(questions).values({
              id: questionId,
              quizSectionId: sectionId,
              prompt: question.prompt,
              position: questionIndex + 1,
            });
          }

          await tx.insert(options).values(
            question.options.map((option, optionIndex) => ({
              id: crypto.randomUUID(),
              questionId,
              label: option.label,
              position: (optionIndex + 1) as 1 | 2 | 3 | 4,
              isCorrect: option.isCorrect,
            })),
          );
        }
      }
    });
  } catch (error) {
    console.error("updateQuizSet failed:", error);

    if (isUniqueViolation(error)) {
      return actionFailure(
        "Could not save quiz structure due to a uniqueness conflict.",
      );
    }

    return actionFailure("Could not update quiz set. Please try again.");
  }

  await revalidateQuizPaths(data.id, existing.faculty.slug);
  return actionSuccess({ id: data.id }, "Quiz set updated.");
}
