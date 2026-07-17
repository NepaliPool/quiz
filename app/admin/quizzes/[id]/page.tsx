import { notFound } from "next/navigation";

import { getSubjectOptions, getQuizSetById } from "@/dal/admin/get-quiz-set";
import { QuizDetailEditor } from "@/modules/admin/components/quiz-detail-editor";

type AdminQuizDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminQuizDetailPage({
  params,
}: AdminQuizDetailPageProps) {
  const { id } = await params;
  const [quizSet, subjects] = await Promise.all([
    getQuizSetById(id),
    getSubjectOptions(),
  ]);

  if (!quizSet) {
    notFound();
  }

  const facultySubjects = subjects.filter(
    (subject) => subject.facultyId === quizSet.facultyId,
  );

  return (
    <QuizDetailEditor
      initialQuizSet={quizSet}
      facultySubjects={facultySubjects}
    />
  );
}
