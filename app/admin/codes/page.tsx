import { getQuizSetOptions } from "@/dal/admin/get-quiz-sets";
import { AdminPageHeader } from "@/modules/admin/components/admin-page-header";
import { CodesManager } from "@/modules/admin/components/codes-manager";

export default async function AdminCodesPage() {
  const [quizOptions, publishedQuizOptions] = await Promise.all([
    getQuizSetOptions(),
    getQuizSetOptions({ publishedOnly: true }),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Access codes"
        description="Generate one-time codes, mark them issued when you hand them out, and track use."
      />
      <CodesManager
        quizOptions={quizOptions}
        publishedQuizOptions={publishedQuizOptions}
      />
    </div>
  );
}
