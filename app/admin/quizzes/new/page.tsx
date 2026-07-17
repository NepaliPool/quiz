import { getFacultyOptions } from "@/dal/admin/get-faculties";
import { getSubjectOptions } from "@/dal/admin/get-quiz-set";
import { QuizCreateForm } from "@/modules/admin/components/quiz-create-form";

export default async function AdminNewQuizPage() {
  const [faculties, subjects] = await Promise.all([
    getFacultyOptions(),
    getSubjectOptions(),
  ]);

  return <QuizCreateForm faculties={faculties} subjects={subjects} />;
}
