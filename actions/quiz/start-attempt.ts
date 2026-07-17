"use server";

import { and, eq } from "drizzle-orm";

import {
  actionFailure,
  actionSuccess,
  isUniqueViolation,
  zodErrorMap,
  type ActionResult,
} from "@/lib/action-result";
import { db } from "@/db";
import {
  accessCodes,
  quizAttempts,
  quizSections,
  quizSets,
} from "@/db/schema";
import {
  startAttemptSchema,
  type StartAttemptInput,
} from "@/modules/quiz/schemas/attempt";

export type StartAttemptResult = {
  attemptId: string;
  resumed: boolean;
  completed?: boolean;
};

export async function startAttempt(
  input: StartAttemptInput,
): Promise<ActionResult<StartAttemptResult>> {
  const parsed = startAttemptSchema.safeParse(input);

  if (!parsed.success) {
    return actionFailure(
      "Please enter a valid access code.",
      zodErrorMap(parsed.error),
    );
  }

  const { quizSetId, code } = parsed.data;
  const now = new Date();

  const quizSet = await db.query.quizSets.findFirst({
    where: and(eq(quizSets.id, quizSetId), eq(quizSets.isPublished, true)),
    columns: {
      id: true,
    },
  });

  if (!quizSet) {
    return actionFailure("This quiz set is not available.");
  }

  const accessCode = await db.query.accessCodes.findFirst({
    where: and(
      eq(accessCodes.code, code),
      eq(accessCodes.quizSetId, quizSetId),
    ),
    with: {
      attempt: {
        columns: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!accessCode) {
    return actionFailure("Invalid access code for this quiz set.", {
      code: "Invalid access code for this quiz set.",
    });
  }

  if (
    accessCode.expiresAt &&
    accessCode.expiresAt.getTime() < now.getTime() &&
    !accessCode.isUsed
  ) {
    return actionFailure("This access code has expired.", {
      code: "This access code has expired.",
    });
  }

  if (accessCode.attempt) {
    if (accessCode.attempt.status === "completed") {
      return actionSuccess(
        {
          attemptId: accessCode.attempt.id,
          resumed: false,
          completed: true,
        },
        "This code was already used. View your results.",
      );
    }

    return actionSuccess(
      {
        attemptId: accessCode.attempt.id,
        resumed: true,
      },
      "Resuming your in-progress attempt.",
    );
  }

  if (accessCode.isUsed) {
    return actionFailure("This access code has already been used.", {
      code: "This access code has already been used.",
    });
  }

  const sectionMarks = await db
    .select({
      fullMarks: quizSections.fullMarks,
    })
    .from(quizSections)
    .where(eq(quizSections.quizSetId, quizSetId));

  const maxScore = sectionMarks.reduce(
    (sum, section) => sum + section.fullMarks,
    0,
  );

  if (maxScore <= 0) {
    return actionFailure("This quiz set has no scorable sections yet.");
  }

  const attemptId = crypto.randomUUID();

  try {
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(accessCodes)
        .set({
          isUsed: true,
          usedAt: now,
        })
        .where(
          and(eq(accessCodes.id, accessCode.id), eq(accessCodes.isUsed, false)),
        )
        .returning({ id: accessCodes.id });

      if (updated.length === 0) {
        throw new Error("CODE_ALREADY_USED");
      }

      await tx.insert(quizAttempts).values({
        id: attemptId,
        quizSetId,
        accessCodeId: accessCode.id,
        status: "in_progress",
        score: 0,
        maxScore,
        startedAt: now,
        completedAt: null,
      });
    });
  } catch (error) {
    if (
      (error instanceof Error && error.message === "CODE_ALREADY_USED") ||
      isUniqueViolation(error)
    ) {
      return actionFailure("This access code has already been used.", {
        code: "This access code has already been used.",
      });
    }

    throw error;
  }

  return actionSuccess(
    {
      attemptId,
      resumed: false,
    },
    "Code accepted. Good luck.",
  );
}
