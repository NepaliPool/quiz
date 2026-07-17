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
import { faculties } from "@/db/schema";
import {
  updateFacultySchema,
  type UpdateFacultyInput,
} from "@/modules/admin/schemas/faculty";

export async function updateFaculty(
  input: UpdateFacultyInput,
): Promise<ActionResult<{ id: string }>> {
  const admin = await getCurrentAdmin();

  if (!admin.success) {
    return actionFailure(admin.message);
  }

  const parsed = updateFacultySchema.safeParse(input);

  if (!parsed.success) {
    return actionFailure("Please fix the highlighted fields.", zodErrorMap(parsed.error));
  }

  try {
    const existing = await db.query.faculties.findFirst({
      where: eq(faculties.id, parsed.data.id),
      columns: { id: true, slug: true },
    });

    if (!existing) {
      return actionFailure("Faculty not found.");
    }

    await db
      .update(faculties)
      .set({
        name: parsed.data.name,
        slug: parsed.data.slug,
      })
      .where(eq(faculties.id, parsed.data.id));

    revalidatePath("/admin/faculties");
    revalidatePath("/admin/subjects");
    revalidatePath("/admin");
    revalidatePath(`/faculty/${existing.slug}`);
    revalidatePath(`/faculty/${parsed.data.slug}`);

    return actionSuccess({ id: parsed.data.id }, "Faculty updated.");
  } catch (error) {
    console.error("updateFaculty failed:", error);

    if (isUniqueViolation(error)) {
      return actionFailure("A faculty with this name or slug already exists.", {
        slug: "Name or slug must be unique.",
      });
    }

    return actionFailure("Could not update faculty. Please try again.");
  }
}
