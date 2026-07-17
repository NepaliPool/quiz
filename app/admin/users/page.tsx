import { getUsers } from "@/dal/admin/get-users";
import { AdminPageHeader } from "@/modules/admin/components/admin-page-header";
import { UsersTable } from "@/modules/admin/components/users-table";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; role?: string }>;
}) {
  const params = await searchParams;
  const data = await getUsers({
    q: params.q ?? "",
    role: params.role,
    page: Number(params.page) || 1,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users"
        description="All registered accounts. Roles come from Better Auth admin plugin."
      />
      <UsersTable data={data} />
    </div>
  );
}
