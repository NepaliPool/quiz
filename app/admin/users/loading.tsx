import { AdminListPageSkeleton } from "@/modules/admin/components/admin-list-states";

export default function AdminUsersLoading() {
  return (
    <AdminListPageSkeleton
      title="Users"
      description="All registered accounts. Roles come from Better Auth admin plugin."
      columns={4}
    />
  );
}
