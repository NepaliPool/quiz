import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAttemptAnswerSheetByCode } from "@/dal/public/get-attempt-result";
import { createPageMetadata } from "@/lib/seo";
import { QuizResultPage } from "@/modules/quiz/components/quiz-result-page";

type QuizResultRouteProps = {
  params: Promise<{ slug: string; quizSetSlug: string }>;
  searchParams: Promise<{ code?: string }>;
};

export async function generateMetadata({
  params,
}: QuizResultRouteProps): Promise<Metadata> {
  const { slug, quizSetSlug } = await params;

  return createPageMetadata({
    title: "Quiz results",
    description: "Private quiz results for your access code on QuizDesk.",
    path: `/faculty/${slug}/${quizSetSlug}/result`,
    noIndex: true,
  });
}

export default async function QuizResultRoute({
  params,
  searchParams,
}: QuizResultRouteProps) {
  const [{ slug, quizSetSlug }, { code }] = await Promise.all([
    params,
    searchParams,
  ]);

  const accessCode = typeof code === "string" ? code : undefined;

  if (!accessCode) {
    notFound();
  }

  const sheet = await getAttemptAnswerSheetByCode({
    facultySlug: slug,
    quizSetSlug,
    code: accessCode,
  });

  if (!sheet) {
    notFound();
  }

  return <QuizResultPage summary={sheet} initialSheet={sheet} />;
}
