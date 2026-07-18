import { AdminPageHeader } from "@/modules/admin/components/admin-page-header";
import { FacultiesManager } from "@/modules/admin/components/faculties-manager";

export default function AdminFacultiesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Faculties"
        description="Create and manage faculties shown on the public landing page."
      />
      <FacultiesManager />
    </div>
  );
}
