import { AdminListPageSkeleton } from "@/modules/admin/components/admin-list-states";

export default function AdminQuizzesLoading() {
  return (
    <AdminListPageSkeleton
      title="Quiz sets"
      description="Each set belongs to a faculty and bundles subject sections with their own marks."
      columns={3}
      rows={5}
    />
  );
}
