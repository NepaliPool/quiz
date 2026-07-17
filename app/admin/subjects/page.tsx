import { getFacultyOptions } from "@/dal/admin/get-faculties";
import { getSubjects } from "@/dal/admin/get-subjects";
import { AdminPageHeader } from "@/modules/admin/components/admin-page-header";
import { SubjectsManager } from "@/modules/admin/components/subjects-manager";

export default async function AdminSubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; faculty?: string }>;
}) {
  const params = await searchParams;
  const [data, faculties] = await Promise.all([
    getSubjects({
      q: params.q ?? "",
      facultyId: params.faculty,
      page: Number(params.page) || 1,
    }),
    getFacultyOptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Subjects"
        description="Attach subjects to a faculty. These become sections inside quiz sets."
      />
      <SubjectsManager data={data} faculties={faculties} />
    </div>
  );
}
