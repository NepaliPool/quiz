import { AdminPageHeader } from "@/modules/admin/components/admin-page-header";
import { AdminTableSkeleton } from "@/modules/admin/components/admin-list-states";

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users"
        description="All registered accounts. Roles come from Better Auth admin plugin."
      />
      <AdminTableSkeleton columns={4} />
    </div>
  );
}
