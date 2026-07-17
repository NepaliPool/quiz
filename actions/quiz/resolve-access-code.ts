"use server";

import {
  actionFailure,
  actionSuccess,
  zodErrorMap,
  type ActionResult,
} from "@/lib/action-result";
import { getPublishedQuizSetRouteByAccessCode } from "@/dal/public/get-quiz-set";
import {
  resolveAccessCodeSchema,
  type ResolveAccessCodeInput,
} from "@/modules/quiz/schemas/attempt";

export type ResolveAccessCodeResult = {
  href: string;
  code: string;
};

export async function resolveAccessCode(
  input: ResolveAccessCodeInput,
): Promise<ActionResult<ResolveAccessCodeResult>> {
  const parsed = resolveAccessCodeSchema.safeParse(input);

  if (!parsed.success) {
    return actionFailure(
      "Please enter a valid access code.",
      zodErrorMap(parsed.error),
    );
  }

  const route = await getPublishedQuizSetRouteByAccessCode(parsed.data.code);

  if (!route) {
    return actionFailure("No published quiz found for that access code.", {
      code: "No published quiz found for that access code.",
    });
  }

  const basePath = `/faculty/${route.facultySlug}/${route.quizSetSlug}`;
  const href =
    route.attemptStatus === "completed"
      ? `${basePath}/result?code=${encodeURIComponent(route.code)}`
      : `${basePath}?code=${encodeURIComponent(route.code)}`;

  return actionSuccess({
    href,
    code: route.code,
  });
}
