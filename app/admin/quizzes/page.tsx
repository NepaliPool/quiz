import { getFacultyOptions } from "@/dal/admin/get-faculties";
import { getSubjectOptions } from "@/dal/admin/get-quiz-set";
import { getQuizSets } from "@/dal/admin/get-quiz-sets";
import { AdminPageHeader } from "@/modules/admin/components/admin-page-header";
import { QuizzesList } from "@/modules/admin/components/quizzes-list";

export default async function AdminQuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    faculty?: string;
    subject?: string;
  }>;
}) {
  const params = await searchParams;
  const [data, faculties, subjects] = await Promise.all([
    getQuizSets({
      q: params.q ?? "",
      facultyId: params.faculty,
      subjectId: params.subject,
      page: Number(params.page) || 1,
    }),
    getFacultyOptions(),
    getSubjectOptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quiz sets"
        description="Each set belongs to a faculty and bundles subject sections with their own marks."
      />

      <QuizzesList data={data} faculties={faculties} subjects={subjects} />
    </div>
  );
}
