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
import { subjects } from "@/db/schema";
import {
  deleteSubjectSchema,
  type DeleteSubjectInput,
} from "@/modules/admin/schemas/subject";

export async function deleteSubject(
  input: DeleteSubjectInput,
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();

  if (!admin.success) {
    return actionFailure(admin.message);
  }

  const parsed = deleteSubjectSchema.safeParse(input);

  if (!parsed.success) {
    return actionFailure("Invalid subject.", zodErrorMap(parsed.error));
  }

  try {
    const deleted = await db
      .delete(subjects)
      .where(eq(subjects.id, parsed.data.id))
      .returning({ id: subjects.id });

    if (deleted.length === 0) {
      return actionFailure("Subject not found.");
    }
  } catch (error) {
    console.error("deleteSubject failed:", error);

    if (isForeignKeyViolation(error)) {
      return actionFailure(
        "Cannot delete this subject while quiz sections still reference it.",
      );
    }

    return actionFailure("Could not delete subject. Please try again.");
  }

  revalidatePath("/admin/subjects");
  revalidatePath("/admin/quizzes");
  revalidatePath("/admin");

  return actionSuccess(undefined, "Subject deleted.");
}
