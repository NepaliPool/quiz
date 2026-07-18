import { getAccessCodes } from "@/dal/admin/get-access-codes";
import { getQuizSetOptions } from "@/dal/admin/get-quiz-sets";
import { AdminPageHeader } from "@/modules/admin/components/admin-page-header";
import { CodesManager } from "@/modules/admin/components/codes-manager";

export default async function AdminCodesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    status?: string;
    quiz?: string;
  }>;
}) {
  const params = await searchParams;
  const status =
    params.status === "available" ||
    params.status === "issued" ||
    params.status === "used" ||
    params.status === "expired"
      ? params.status
      : "all";

  const [data, quizOptions, publishedQuizOptions] = await Promise.all([
    getAccessCodes({
      q: params.q ?? "",
      status,
      quizSetId: params.quiz,
      page: Number(params.page) || 1,
    }),
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
        data={data}
        quizOptions={quizOptions}
        publishedQuizOptions={publishedQuizOptions}
      />
    </div>
  );
}
