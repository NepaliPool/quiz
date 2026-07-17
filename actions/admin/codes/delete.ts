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
import { accessCodes, quizAttempts } from "@/db/schema";
import {
  deleteAccessCodeSchema,
  type DeleteAccessCodeInput,
} from "@/modules/admin/schemas/access-code";

export async function deleteAccessCode(
  input: DeleteAccessCodeInput,
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();

  if (!admin.success) {
    return actionFailure(admin.message);
  }

  const parsed = deleteAccessCodeSchema.safeParse(input);

  if (!parsed.success) {
    return actionFailure("Invalid access code.", zodErrorMap(parsed.error));
  }

  const existing = await db.query.accessCodes.findFirst({
    where: eq(accessCodes.id, parsed.data.id),
    columns: { id: true, code: true },
  });

  if (!existing) {
    return actionFailure("Access code not found.");
  }

  const attempt = await db.query.quizAttempts.findFirst({
    where: eq(quizAttempts.accessCodeId, parsed.data.id),
    columns: { id: true },
  });

  if (attempt) {
    return actionFailure(
      "This code has an attempt and cannot be deleted.",
    );
  }

  try {
    await db.delete(accessCodes).where(eq(accessCodes.id, parsed.data.id));
  } catch (error) {
    console.error("deleteAccessCode failed:", error);

    if (isForeignKeyViolation(error)) {
      return actionFailure(
        "This code has an attempt and cannot be deleted.",
      );
    }

    return actionFailure("Could not delete access code. Please try again.");
  }

  revalidatePath("/admin/codes");
  revalidatePath("/admin");

  return actionSuccess(undefined, `Deleted ${existing.code}.`);
}
