import { notFound } from "next/navigation";

import {
  getAttemptAnswerSheetByCode,
  getAttemptResultSummary,
} from "@/dal/public/get-attempt-result";
import { QuizResultPage } from "@/modules/quiz/components/quiz-result-page";

type QuizResultRouteProps = {
  params: Promise<{ slug: string; quizSetSlug: string }>;
  searchParams: Promise<{ attempt?: string; code?: string }>;
};

export default async function QuizResultRoute({
  params,
  searchParams,
}: QuizResultRouteProps) {
  const [{ slug, quizSetSlug }, { attempt, code }] = await Promise.all([
    params,
    searchParams,
  ]);

  const attemptId = typeof attempt === "string" ? attempt : undefined;
  const accessCode = typeof code === "string" ? code : undefined;

  if (accessCode) {
    const sheet = await getAttemptAnswerSheetByCode({
      facultySlug: slug,
      quizSetSlug,
      code: accessCode,
      attemptId,
    });

    if (!sheet) {
      notFound();
    }

    return <QuizResultPage summary={sheet} initialSheet={sheet} />;
  }

  if (!attemptId) {
    notFound();
  }

  const summary = await getAttemptResultSummary({
    facultySlug: slug,
    quizSetSlug,
    attemptId,
  });

  if (!summary) {
    notFound();
  }

  return <QuizResultPage summary={summary} />;
}
