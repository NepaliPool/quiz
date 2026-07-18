import { AdminListPageSkeleton } from "@/modules/admin/components/admin-list-states";

export default function AdminFacultiesLoading() {
  return (
    <AdminListPageSkeleton
      title="Faculties"
      description="Create and manage faculties shown on the public landing page."
      columns={3}
    />
  );
}
