"use server";

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
  createFacultySchema,
  type CreateFacultyInput,
} from "@/modules/admin/schemas/faculty";

export async function createFaculty(
  input: CreateFacultyInput,
): Promise<ActionResult<{ id: string }>> {
  const admin = await getCurrentAdmin();

  if (!admin.success) {
    return actionFailure(admin.message);
  }

  const parsed = createFacultySchema.safeParse(input);

  if (!parsed.success) {
    return actionFailure("Please fix the highlighted fields.", zodErrorMap(parsed.error));
  }

  const id = crypto.randomUUID();

  try {
    await db.insert(faculties).values({
      id,
      name: parsed.data.name,
      slug: parsed.data.slug,
    });
  } catch (error) {
    console.error("createFaculty failed:", error);

    if (isUniqueViolation(error)) {
      return actionFailure("A faculty with this name or slug already exists.", {
        slug: "Name or slug must be unique.",
      });
    }

    return actionFailure("Could not create faculty. Please try again.");
  }

  revalidatePath("/admin/faculties");
  revalidatePath("/admin/subjects");
  revalidatePath("/admin");

  return actionSuccess({ id }, "Faculty created.");
}
