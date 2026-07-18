import { AdminListPageSkeleton } from "@/modules/admin/components/admin-list-states";

export default function AdminCodesLoading() {
  return (
    <AdminListPageSkeleton
      title="Access codes"
      description="Generate one-time codes, mark them issued when you hand them out, and track use."
      columns={7}
    />
  );
}
