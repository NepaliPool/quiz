import { AdminPageHeader } from "@/modules/admin/components/admin-page-header";
import { UsersTable } from "@/modules/admin/components/users-table";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users"
        description="All registered accounts. Roles come from Better Auth admin plugin."
      />
      <UsersTable />
    </div>
  );
}
