import { AdminListPageSkeleton } from "@/modules/admin/components/admin-list-states";

export default function AdminSubjectsLoading() {
  return (
    <AdminListPageSkeleton
      title="Subjects"
      description="Attach subjects to a faculty. These become sections inside quiz sets."
      columns={3}
    />
  );
}
