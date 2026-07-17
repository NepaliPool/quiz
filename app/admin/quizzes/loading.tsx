import { AdminPageHeader } from "@/modules/admin/components/admin-page-header";
import { AdminTableSkeleton } from "@/modules/admin/components/admin-list-states";

export default function AdminQuizzesLoading() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quiz sets"
        description="Each set belongs to a faculty and bundles subject sections with their own marks."
      />
      <AdminTableSkeleton rows={5} columns={3} />
    </div>
  );
}
