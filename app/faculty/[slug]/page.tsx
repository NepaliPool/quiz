import { notFound } from "next/navigation";

import { getFacultyBySlug } from "@/dal/public/get-faculties";
import { getPublishedQuizSetsByFacultySlug } from "@/dal/public/get-quiz-sets";
import { FacultyDetailPage } from "@/modules/faculty/components/faculty-detail-page";

type FacultyPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

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
