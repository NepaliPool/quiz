import { getFaculties } from "@/dal/admin/get-faculties";
import { AdminPageHeader } from "@/modules/admin/components/admin-page-header";
import { FacultiesManager } from "@/modules/admin/components/faculties-manager";

export default async function AdminFacultiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const data = await getFaculties({
    q: params.q ?? "",
    page: Number(params.page) || 1,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Faculties"
        description="Create and manage faculties shown on the public landing page."
      />
      <FacultiesManager data={data} />
    </div>
  );
}
