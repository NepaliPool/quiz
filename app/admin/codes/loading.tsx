import { AdminPageHeader } from "@/modules/admin/components/admin-page-header";
import { AdminTableSkeleton } from "@/modules/admin/components/admin-list-states";

export default function AdminCodesLoading() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Access codes"
        description="Issue one-time codes for quiz sets and track whether they were used."
      />
      <AdminTableSkeleton columns={6} />
    </div>
  );
}
