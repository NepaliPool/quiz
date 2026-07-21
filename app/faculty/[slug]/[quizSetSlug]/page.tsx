import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublishedQuizSetByFacultyAndSlug } from "@/dal/public/get-quiz-set";
import { createPageMetadata } from "@/lib/seo";
import { QuizDetailPage } from "@/modules/quiz/components/quiz-detail-page";

type QuizSetPageProps = {
  params: Promise<{ slug: string; quizSetSlug: string }>;
  searchParams: Promise<{ code?: string; name?: string }>;
};

export async function generateMetadata({
  params,
}: QuizSetPageProps): Promise<Metadata> {
  const { slug, quizSetSlug } = await params;
  const quizSet = await getPublishedQuizSetByFacultyAndSlug(slug, quizSetSlug);

  if (!quizSet) {
    return createPageMetadata({
      title: "Quiz set not found",
      description: "This quiz set could not be found on QuizDesk.",
      path: `/faculty/${slug}/${quizSetSlug}`,
      noIndex: true,
    });
  }

  const description =
    quizSet.description?.trim() ||
    `${quizSet.title} for ${quizSet.faculty.name}: ${quizSet.questionCount} questions, ${quizSet.totalMarks} marks, ${quizSet.durationMinutes} minutes. Unlock with a one-time access code on QuizDesk.`;

  return createPageMetadata({
    title: quizSet.title,
    description,
    path: `/faculty/${quizSet.faculty.slug}/${quizSet.slug}`,
  });
}

export default async function QuizSetPage({
  params,
  searchParams,
}: QuizSetPageProps) {
  const [{ slug, quizSetSlug }, { code, name }] = await Promise.all([
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
      initialName={typeof name === "string" ? name : undefined}
    />
  );
}
