"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  actionFailure,
  actionSuccess,
  isForeignKeyViolation,
  zodErrorMap,
  type ActionResult,
} from "@/lib/action-result";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";
import { db } from "@/db";
import { quizSets } from "@/db/schema";
import { quizSetHasAttempts } from "@/dal/admin/get-quiz-set";
import {
  deleteQuizSetSchema,
  type DeleteQuizSetInput,
} from "@/modules/admin/schemas/quiz-set";

export async function deleteQuizSet(
  input: DeleteQuizSetInput,
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();

  if (!admin.success) {
    return actionFailure(admin.message);
  }

  const parsed = deleteQuizSetSchema.safeParse(input);

  if (!parsed.success) {
    return actionFailure("Invalid quiz set.", zodErrorMap(parsed.error));
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

  if (await quizSetHasAttempts(parsed.data.id)) {
    return actionFailure(
      "Cannot delete a quiz set that already has participant attempts.",
    );
  }

  try {
    await db.delete(quizSets).where(eq(quizSets.id, parsed.data.id));
  } catch (error) {
    console.error("deleteQuizSet failed:", error);

    if (isForeignKeyViolation(error)) {
      return actionFailure(
        "Cannot delete this quiz set while related records still reference it.",
      );
    }

    return actionFailure("Could not delete quiz set. Please try again.");
  }

  revalidatePath("/admin/quizzes");
  revalidatePath("/admin/codes");
  revalidatePath("/admin");
  revalidatePath(`/faculty/${existing.faculty.slug}`);

  return actionSuccess(undefined, "Quiz set deleted.");
}
