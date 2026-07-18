"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  actionFailure,
  actionSuccess,
  zodErrorMap,
  type ActionResult,
} from "@/lib/action-result";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";
import { db } from "@/db";
import { accessCodes } from "@/db/schema";
import {
  accessCodeIdSchema,
  type AccessCodeIdInput,
} from "@/modules/admin/schemas/access-code";

export async function markAccessCodeIssued(
  input: AccessCodeIdInput,
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();

  if (!admin.success) {
    return actionFailure(admin.message);
  }

  const parsed = accessCodeIdSchema.safeParse(input);

  if (!parsed.success) {
    return actionFailure("Invalid access code.", zodErrorMap(parsed.error));
  }

  const existing = await db.query.accessCodes.findFirst({
    where: eq(accessCodes.id, parsed.data.id),
    columns: {
      id: true,
      code: true,
      isUsed: true,
      isIssued: true,
      expiresAt: true,
    },
  });

  if (!existing) {
    return actionFailure("Access code not found.");
  }

  if (existing.isUsed) {
    return actionFailure("Used codes cannot be marked as issued.");
  }

  if (existing.isIssued) {
    return actionFailure("This code is already marked as issued.");
  }

  if (existing.expiresAt && existing.expiresAt < new Date()) {
    return actionFailure("Expired codes cannot be marked as issued.");
  }

  const updated = await db
    .update(accessCodes)
    .set({
      isIssued: true,
      issuedAt: new Date(),
    })
    .where(
      and(
        eq(accessCodes.id, existing.id),
        eq(accessCodes.isUsed, false),
        eq(accessCodes.isIssued, false),
      ),
    )
    .returning({ id: accessCodes.id });

  if (updated.length === 0) {
    return actionFailure("Could not mark this code as issued. Please try again.");
  }

  revalidatePath("/admin/codes");
  revalidatePath("/admin");

  return actionSuccess(undefined, `Marked ${existing.code} as issued.`);
}

export async function releaseAccessCode(
  input: AccessCodeIdInput,
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();

  if (!admin.success) {
    return actionFailure(admin.message);
  }

  const parsed = accessCodeIdSchema.safeParse(input);

  if (!parsed.success) {
    return actionFailure("Invalid access code.", zodErrorMap(parsed.error));
  }

  const existing = await db.query.accessCodes.findFirst({
    where: eq(accessCodes.id, parsed.data.id),
    columns: {
      id: true,
      code: true,
      isUsed: true,
      isIssued: true,
    },
  });

  if (!existing) {
    return actionFailure("Access code not found.");
  }

  if (existing.isUsed) {
    return actionFailure("Used codes cannot be released.");
  }

  if (!existing.isIssued) {
    return actionFailure("This code is not marked as issued.");
  }

  const updated = await db
    .update(accessCodes)
    .set({
      isIssued: false,
      issuedAt: null,
    })
    .where(
      and(
        eq(accessCodes.id, existing.id),
        eq(accessCodes.isUsed, false),
        eq(accessCodes.isIssued, true),
      ),
    )
    .returning({ id: accessCodes.id });

  if (updated.length === 0) {
    return actionFailure("Could not release this code. Please try again.");
  }

  revalidatePath("/admin/codes");
  revalidatePath("/admin");

  return actionSuccess(undefined, `Released ${existing.code} back to available.`);
}
