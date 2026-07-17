import { AdminPageHeader } from "@/modules/admin/components/admin-page-header";
import { AdminTableSkeleton } from "@/modules/admin/components/admin-list-states";

export default function AdminFacultiesLoading() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Faculties"
        description="Create and manage faculties shown on the public landing page."
      />
      <AdminTableSkeleton columns={4} />
    </div>
  );
}
