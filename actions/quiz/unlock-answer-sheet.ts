"use server";

import {
  actionFailure,
  actionSuccess,
  zodErrorMap,
  type ActionResult,
} from "@/lib/action-result";
import {
  getAttemptAnswerSheetByCode,
  type AttemptAnswerSheet,
} from "@/dal/public/get-attempt-result";
import {
  unlockAnswerSheetSchema,
  type UnlockAnswerSheetInput,
} from "@/modules/quiz/schemas/attempt";

export async function unlockAnswerSheet(
  input: UnlockAnswerSheetInput,
): Promise<ActionResult<AttemptAnswerSheet>> {
  const parsed = unlockAnswerSheetSchema.safeParse(input);

  if (!parsed.success) {
    return actionFailure(
      "Please enter a valid access code.",
      zodErrorMap(parsed.error),
    );
  }

  const sheet = await getAttemptAnswerSheetByCode(parsed.data);

  if (!sheet) {
    return actionFailure(
      "No completed attempt found for this access code.",
      {
        code: "No completed attempt found for this access code.",
      },
    );
  }

  return actionSuccess(sheet, "Answer sheet unlocked.");
}
