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
  createSubjectSchema,
  type CreateSubjectInput,
} from "@/modules/admin/schemas/subject";

export async function createSubject(
  input: CreateSubjectInput,
): Promise<ActionResult<{ id: string }>> {
  const admin = await getCurrentAdmin();

  if (!admin.success) {
    return actionFailure(admin.message);
  }

  const parsed = createSubjectSchema.safeParse(input);

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

  const id = crypto.randomUUID();

  try {
    await db.insert(subjects).values({
      id,
      name: parsed.data.name,
      facultyId: parsed.data.facultyId,
    });
  } catch (error) {
    console.error("createSubject failed:", error);

    if (isUniqueViolation(error)) {
      return actionFailure(
        "A subject with this name already exists for that faculty.",
        { name: "Subject name must be unique within the faculty." },
      );
    }

    return actionFailure("Could not create subject. Please try again.");
  }

  revalidatePath("/admin/subjects");
  revalidatePath("/admin/quizzes");
  revalidatePath("/admin");

  return actionSuccess({ id }, "Subject created.");
}
