import { getFacultyOptions } from "@/dal/admin/get-faculties";
import { AdminPageHeader } from "@/modules/admin/components/admin-page-header";
import { SubjectsManager } from "@/modules/admin/components/subjects-manager";

export default async function AdminSubjectsPage() {
  const faculties = await getFacultyOptions();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Subjects"
        description="Attach subjects to a faculty. These become sections inside quiz sets."
      />
      <SubjectsManager faculties={faculties} />
    </div>
  );
}
