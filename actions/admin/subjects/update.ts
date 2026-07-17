"use server";

import { eq } from "drizzle-orm";
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
import { faculties, subjects } from "@/db/schema";
import {
  updateSubjectSchema,
  type UpdateSubjectInput,
} from "@/modules/admin/schemas/subject";

export async function updateSubject(
  input: UpdateSubjectInput,
): Promise<ActionResult<{ id: string }>> {
  const admin = await getCurrentAdmin();

  if (!admin.success) {
    return actionFailure(admin.message);
  }

  const parsed = updateSubjectSchema.safeParse(input);

  if (!parsed.success) {
    return actionFailure("Please fix the highlighted fields.", zodErrorMap(parsed.error));
  }

  const faculty = await db.query.faculties.findFirst({
    where: eq(faculties.id, parsed.data.facultyId),
    columns: { id: true },
  });

  if (!faculty) {
    return actionFailure("Selected faculty does not exist.", {
      facultyId: "Select a valid faculty.",
    });
  }

  try {
    const updated = await db
      .update(subjects)
      .set({
        name: parsed.data.name,
        facultyId: parsed.data.facultyId,
      })
      .where(eq(subjects.id, parsed.data.id))
      .returning({ id: subjects.id });

    if (updated.length === 0) {
      return actionFailure("Subject not found.");
    }
  } catch (error) {
    console.error("updateSubject failed:", error);

    if (isUniqueViolation(error)) {
      return actionFailure(
        "A subject with this name already exists for that faculty.",
        { name: "Subject name must be unique within the faculty." },
      );
    }

    return actionFailure("Could not update subject. Please try again.");
  }

  revalidatePath("/admin/subjects");
  revalidatePath("/admin/quizzes");
  revalidatePath("/admin");

  return actionSuccess({ id: parsed.data.id }, "Subject updated.");
}
