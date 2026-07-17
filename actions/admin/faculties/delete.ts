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
import { faculties } from "@/db/schema";
import {
  deleteFacultySchema,
  type DeleteFacultyInput,
} from "@/modules/admin/schemas/faculty";

export async function deleteFaculty(
  input: DeleteFacultyInput,
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();

  if (!admin.success) {
    return actionFailure(admin.message);
  }

  const parsed = deleteFacultySchema.safeParse(input);

  if (!parsed.success) {
    return actionFailure("Invalid faculty.", zodErrorMap(parsed.error));
  }

  try {
    const deleted = await db
      .delete(faculties)
      .where(eq(faculties.id, parsed.data.id))
      .returning({ id: faculties.id, slug: faculties.slug });

    if (deleted.length === 0) {
      return actionFailure("Faculty not found.");
    }

    revalidatePath("/admin/faculties");
    revalidatePath("/admin/subjects");
    revalidatePath("/admin");
    revalidatePath(`/faculty/${deleted[0].slug}`);

    return actionSuccess(undefined, "Faculty deleted.");
  } catch (error) {
    console.error("deleteFaculty failed:", error);

    if (isForeignKeyViolation(error)) {
      return actionFailure(
        "Cannot delete this faculty while subjects or quiz sets still reference it.",
      );
    }

    return actionFailure("Could not delete faculty. Please try again.");
  }
}
