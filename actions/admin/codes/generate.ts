"use server";

import { and, eq } from "drizzle-orm";
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
      isFreeMock: true,
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
  const isShared = quizSet.isFreeMock;

  if (isShared && !expiresAt) {
    return actionFailure("Free mock codes require an expiry date.", {
      expiresAt: "Set an expiry date for the shared free-mock code.",
    });
  }

  if (isShared && parsed.data.quantity !== 1) {
    return actionFailure("Free mock tests only allow one shared code.", {
      quantity: "Free mock tests only allow generating 1 shared code.",
    });
  }

  // Free mocks always generate exactly one shared code, regardless of client input.
  const quantity = isShared ? 1 : parsed.data.quantity;
  const prefix = buildAccessCodePrefix(quizSet.slug);

  try {
    const createdCount = await db.transaction(async (tx) => {
      if (isShared) {
        const existingShared = await tx.query.accessCodes.findFirst({
          where: and(
            eq(accessCodes.quizSetId, quizSet.id),
            eq(accessCodes.isShared, true),
            eq(accessCodes.isRevoked, false),
          ),
          columns: { id: true, code: true },
        });

        if (existingShared) {
          throw new Error(`SHARED_CODE_EXISTS:${existingShared.code}`);
        }
      }

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
          isRevoked: false,
          revokedAt: null,
          isShared,
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
      isShared
        ? `Generated shared free-mock code for ${quizSet.title}.`
        : `Generated ${createdCount} code${createdCount === 1 ? "" : "s"} for ${quizSet.title}.`,
    );
  } catch (error) {
    console.error("generateAccessCodes failed:", error);

    if (
      error instanceof Error &&
      error.message.startsWith("SHARED_CODE_EXISTS:")
    ) {
      const existingCode = error.message.slice("SHARED_CODE_EXISTS:".length);
      return actionFailure(
        `This free mock already has an active shared code (${existingCode}). Revoke it before generating another.`,
        {
          quizSetId:
            "Revoke the existing shared code before generating a new one.",
        },
      );
    }

    if (
      error instanceof Error &&
      error.message === "CODE_GENERATION_RETRY_EXHAUSTED"
    ) {
      return actionFailure(
        "Could not generate enough unique codes. Please try again.",
      );
    }

    if (isUniqueViolation(error)) {
      if (isShared) {
        return actionFailure(
          "This free mock already has an active shared code. Revoke it before generating another.",
          {
            quizSetId:
              "Revoke the existing shared code before generating a new one.",
          },
        );
      }

      return actionFailure(
        "Code collision occurred while generating. Please try again.",
      );
    }

    return actionFailure("Could not generate access codes. Please try again.");
  }
}
