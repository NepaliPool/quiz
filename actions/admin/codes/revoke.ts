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

export async function revokeAccessCode(
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

  try {
    const existing = await db.query.accessCodes.findFirst({
      where: eq(accessCodes.id, parsed.data.id),
      columns: { id: true, code: true, isRevoked: true },
    });

    if (!existing) {
      return actionFailure("Access code not found.");
    }

    if (existing.isRevoked) {
      return actionFailure("This code is already revoked.");
    }

    const updated = await db
      .update(accessCodes)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
      })
      .where(
        and(eq(accessCodes.id, existing.id), eq(accessCodes.isRevoked, false)),
      )
      .returning({ id: accessCodes.id });

    if (updated.length === 0) {
      return actionFailure("Could not revoke this code. Please try again.");
    }

    revalidatePath("/admin/codes");
    revalidatePath("/admin");

    return actionSuccess(undefined, `Revoked ${existing.code}.`);
  } catch (error) {
    console.error("revokeAccessCode failed:", error);
    return actionFailure("Could not revoke this code. Please try again.");
  }
}

export async function unrevokeAccessCode(
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

  try {
    const existing = await db.query.accessCodes.findFirst({
      where: eq(accessCodes.id, parsed.data.id),
      columns: { id: true, code: true, isRevoked: true },
    });

    if (!existing) {
      return actionFailure("Access code not found.");
    }

    if (!existing.isRevoked) {
      return actionFailure("This code is not revoked.");
    }

    const updated = await db
      .update(accessCodes)
      .set({
        isRevoked: false,
        revokedAt: null,
      })
      .where(
        and(eq(accessCodes.id, existing.id), eq(accessCodes.isRevoked, true)),
      )
      .returning({ id: accessCodes.id });

    if (updated.length === 0) {
      return actionFailure("Could not restore this code. Please try again.");
    }

    revalidatePath("/admin/codes");
    revalidatePath("/admin");

    return actionSuccess(undefined, `Restored ${existing.code}.`);
  } catch (error) {
    console.error("unrevokeAccessCode failed:", error);
    return actionFailure("Could not restore this code. Please try again.");
  }
}
