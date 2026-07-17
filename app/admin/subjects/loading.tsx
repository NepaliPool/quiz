import { AdminPageHeader } from "@/modules/admin/components/admin-page-header";
import { AdminTableSkeleton } from "@/modules/admin/components/admin-list-states";

export default function AdminSubjectsLoading() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Subjects"
        description="Attach subjects to a faculty. These become sections inside quiz sets."
      />
      <AdminTableSkeleton columns={3} />
    </div>
  );
}
