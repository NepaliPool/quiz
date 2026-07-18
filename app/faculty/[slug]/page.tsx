import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getFacultyBySlug } from "@/dal/public/get-faculties";
import { getPublishedQuizSetsByFacultySlug } from "@/dal/public/get-quiz-sets";
import { createPageMetadata } from "@/lib/seo";
import { FacultyDetailPage } from "@/modules/faculty/components/faculty-detail-page";

type FacultyPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({
  params,
}: FacultyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const faculty = await getFacultyBySlug(slug);

  if (!faculty) {
    return createPageMetadata({
      title: "Faculty not found",
      description: "This faculty page could not be found on QuizDesk.",
      path: `/faculty/${slug}`,
      noIndex: true,
    });
  }

  return createPageMetadata({
    title: faculty.name,
    description: `Browse published quiz sets for ${faculty.name}. Unlock each set with a one-time access code and get subject-wise marks on QuizDesk.`,
    path: `/faculty/${faculty.slug}`,
  });
}

export default async function FacultyPage({
  params,
  searchParams,
}: FacultyPageProps) {
  const [{ slug }, { page: pageParam }] = await Promise.all([
    params,
    searchParams,
  ]);
  const page = Math.max(1, Number(pageParam) || 1);
  const faculty = await getFacultyBySlug(slug);

  if (!faculty) {
    notFound();
  }

  const quizSets = await getPublishedQuizSetsByFacultySlug(slug, { page });

  return <FacultyDetailPage faculty={faculty} quizSets={quizSets} />;
}
