import { notFound } from "next/navigation";

import { getPublishedQuizSetByFacultyAndSlug } from "@/dal/public/get-quiz-set";
import { QuizDetailPage } from "@/modules/quiz/components/quiz-detail-page";

type QuizSetPageProps = {
  params: Promise<{ slug: string; quizSetSlug: string }>;
  searchParams: Promise<{ code?: string }>;
};

export default async function QuizSetPage({
  params,
  searchParams,
}: QuizSetPageProps) {
  const [{ slug, quizSetSlug }, { code }] = await Promise.all([
    params,
    searchParams,
  ]);
  const quizSet = await getPublishedQuizSetByFacultyAndSlug(slug, quizSetSlug);

  if (!quizSet) {
    notFound();
  }

  return (
    <QuizDetailPage
      quizSet={quizSet}
      initialCode={typeof code === "string" ? code : undefined}
    />
  );
}
