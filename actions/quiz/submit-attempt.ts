"use server";

import { and, eq, inArray } from "drizzle-orm";

import {
  actionFailure,
  actionSuccess,
  isUniqueViolation,
  zodErrorMap,
  type ActionResult,
} from "@/lib/action-result";
import { db } from "@/db";
import {
  attemptAnswers,
  options,
  questions,
  quizAttempts,
  quizSections,
} from "@/db/schema";
import {
  submitAttemptSchema,
  type SubmitAttemptInput,
} from "@/modules/quiz/schemas/attempt";

export type SubmitSectionResult = {
  sectionId: string;
  subjectName: string;
  score: number;
  fullMarks: number;
};

export type SubmitAttemptResult = {
  attemptId: string;
  score: number;
  maxScore: number;
  percentage: number;
  sections: SubmitSectionResult[];
};

export async function submitAttempt(
  input: SubmitAttemptInput,
): Promise<ActionResult<SubmitAttemptResult>> {
  const parsed = submitAttemptSchema.safeParse(input);

  if (!parsed.success) {
    return actionFailure(
      "Unable to submit this attempt.",
      zodErrorMap(parsed.error),
    );
  }

  const { attemptId, answers } = parsed.data;

  const attempt = await db.query.quizAttempts.findFirst({
    where: eq(quizAttempts.id, attemptId),
    columns: {
      id: true,
      quizSetId: true,
      status: true,
      maxScore: true,
    },
  });

  if (!attempt) {
    return actionFailure("Attempt not found.");
  }

  if (attempt.status !== "in_progress") {
    return actionFailure("This attempt has already been submitted.");
  }

  const sections = await db.query.quizSections.findMany({
    where: eq(quizSections.quizSetId, attempt.quizSetId),
    orderBy: (table, { asc: orderAsc }) => [orderAsc(table.position)],
    with: {
      subject: {
        columns: {
          name: true,
        },
      },
      questions: {
        columns: {
          id: true,
        },
        with: {
          options: {
            columns: {
              id: true,
              isCorrect: true,
            },
          },
        },
      },
    },
  });

  const questionIds = sections.flatMap((section) =>
    section.questions.map((question) => question.id),
  );

  if (questionIds.length === 0) {
    return actionFailure("This quiz set has no questions.");
  }

  const unanswered = questionIds.filter((questionId) => !answers[questionId]);

  if (unanswered.length > 0) {
    return actionFailure(
      `Answer all questions before submitting (${unanswered.length} left).`,
    );
  }

  const optionIds = [...new Set(Object.values(answers))];
  const optionRows = await db
    .select({
      id: options.id,
      questionId: options.questionId,
      isCorrect: options.isCorrect,
    })
    .from(options)
    .innerJoin(questions, eq(options.questionId, questions.id))
    .innerJoin(quizSections, eq(questions.quizSectionId, quizSections.id))
    .where(
      and(
        inArray(options.id, optionIds),
        eq(quizSections.quizSetId, attempt.quizSetId),
      ),
    );

  const optionById = new Map(optionRows.map((row) => [row.id, row]));

  const answerRows: {
    id: string;
    attemptId: string;
    questionId: string;
    optionId: string;
    isCorrect: boolean;
  }[] = [];

  for (const questionId of questionIds) {
    const optionId = answers[questionId];
    const option = optionById.get(optionId);

    if (!option || option.questionId !== questionId) {
      return actionFailure("One or more answers are invalid for this quiz.");
    }

    answerRows.push({
      id: crypto.randomUUID(),
      attemptId,
      questionId,
      optionId,
      isCorrect: option.isCorrect,
    });
  }

  const sectionResults: SubmitSectionResult[] = sections.map((section) => {
    const marksPerQuestion =
      section.questions.length > 0
        ? section.fullMarks / section.questions.length
        : 0;

    let correct = 0;

    for (const question of section.questions) {
      const selected = optionById.get(answers[question.id]);
      if (selected?.isCorrect) {
        correct += 1;
      }
    }

    return {
      sectionId: section.id,
      subjectName: section.subject.name,
      score: Math.round(correct * marksPerQuestion),
      fullMarks: section.fullMarks,
    };
  });

  const score = Math.min(
    sectionResults.reduce((sum, section) => sum + section.score, 0),
    attempt.maxScore,
  );
  const completedAt = new Date();

  try {
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(quizAttempts)
        .set({
          status: "completed",
          score,
          completedAt,
        })
        .where(
          and(
            eq(quizAttempts.id, attemptId),
            eq(quizAttempts.status, "in_progress"),
          ),
        )
        .returning({ id: quizAttempts.id });

      if (updated.length === 0) {
        throw new Error("ATTEMPT_ALREADY_COMPLETED");
      }

      await tx.insert(attemptAnswers).values(answerRows);
    });
  } catch (error) {
    if (
      (error instanceof Error &&
        error.message === "ATTEMPT_ALREADY_COMPLETED") ||
      isUniqueViolation(error)
    ) {
      return actionFailure("This attempt has already been submitted.");
    }

    throw error;
  }

  return actionSuccess({
    attemptId,
    score,
    maxScore: attempt.maxScore,
    percentage: Math.round((score / attempt.maxScore) * 100),
    sections: sectionResults,
  });
}
