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
import {
  buildAccessCodePrefix,
  generateUniqueAccessCodes,
  parseExpiresAtEndOfDay,
} from "@/lib/access-codes/generate-code";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";
import { db } from "@/db";
import { accessCodes, quizSets } from "@/db/schema";
import {
  generateAccessCodesSchema,
  type GenerateAccessCodesInput,
} from "@/modules/admin/schemas/access-code";

const MAX_GENERATION_ATTEMPTS = 8;

export async function generateAccessCodes(
  input: GenerateAccessCodesInput,
): Promise<ActionResult<{ createdCount: number }>> {
  const admin = await getCurrentAdmin();

  if (!admin.success) {
    return actionFailure(admin.message);
  }

  const parsed = generateAccessCodesSchema.safeParse(input);

  if (!parsed.success) {
    return actionFailure(
      "Please fix the highlighted fields.",
      zodErrorMap(parsed.error),
    );
  }

  const quizSet = await db.query.quizSets.findFirst({
    where: eq(quizSets.id, parsed.data.quizSetId),
    columns: {
      id: true,
      slug: true,
      isPublished: true,
      title: true,
    },
  });

  if (!quizSet) {
    return actionFailure("Selected quiz set does not exist.", {
      quizSetId: "Select a valid quiz set.",
    });
  }

  if (!quizSet.isPublished) {
    return actionFailure("Only published quiz sets can receive access codes.", {
      quizSetId: "Publish the quiz set first.",
    });
  }

  const expiresAt = parseExpiresAtEndOfDay(parsed.data.expiresAt);
  const prefix = buildAccessCodePrefix(quizSet.slug);
  const quantity = parsed.data.quantity;

  try {
    const createdCount = await db.transaction(async (tx) => {
      let remaining = quantity;
      let inserted = 0;

      for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
        const candidates = generateUniqueAccessCodes(prefix, remaining);
        const rows = candidates.map((code) => ({
          id: crypto.randomUUID(),
          quizSetId: quizSet.id,
          code,
          isIssued: false,
          issuedAt: null,
          isUsed: false,
          usedAt: null,
          expiresAt,
        }));

        const returned = await tx
          .insert(accessCodes)
          .values(rows)
          .onConflictDoNothing({ target: accessCodes.code })
          .returning({ id: accessCodes.id });

        inserted += returned.length;
        remaining = quantity - inserted;

        if (remaining <= 0) {
          return inserted;
        }
      }

      throw new Error("CODE_GENERATION_RETRY_EXHAUSTED");
    });

    revalidatePath("/admin/codes");
    revalidatePath("/admin");

    return actionSuccess(
      { createdCount },
      `Generated ${createdCount} code${createdCount === 1 ? "" : "s"} for ${quizSet.title}.`,
    );
  } catch (error) {
    console.error("generateAccessCodes failed:", error);

    if (
      error instanceof Error &&
      error.message === "CODE_GENERATION_RETRY_EXHAUSTED"
    ) {
      return actionFailure(
        "Could not generate enough unique codes. Please try again.",
      );
    }

    if (isUniqueViolation(error)) {
      return actionFailure(
        "Code collision occurred while generating. Please try again.",
      );
    }

    return actionFailure("Could not generate access codes. Please try again.");
  }
}
