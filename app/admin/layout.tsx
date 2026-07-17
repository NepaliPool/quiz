import { redirect } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";
import { AdminSidebar } from "@/modules/admin/components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();

  if (!admin.success) {
    // Logged-in non-admins go home; unauthenticated users go to login.
    if (admin.message.includes("admin privileges")) {
      redirect("/");
    }

    redirect("/login");
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AdminSidebar user={admin.user} />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <p className="text-sm text-muted-foreground">Admin</p>
          </header>
          <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
