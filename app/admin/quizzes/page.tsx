import { getFacultyOptions } from "@/dal/admin/get-faculties";
import { getSubjectOptions } from "@/dal/admin/get-quiz-set";
import { AdminPageHeader } from "@/modules/admin/components/admin-page-header";
import { QuizzesList } from "@/modules/admin/components/quizzes-list";

export default async function AdminQuizzesPage() {
  const [faculties, subjects] = await Promise.all([
    getFacultyOptions(),
    getSubjectOptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quiz sets"
        description="Each set belongs to a faculty and bundles subject sections with their own marks."
      />

      <QuizzesList faculties={faculties} subjects={subjects} />
    </div>
  );
}
