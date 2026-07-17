import { redirect } from "next/navigation";

import { getCurrentAdmin } from "@/lib/auth/get-current-admin";

export async function requireAdminForDal() {
  const admin = await getCurrentAdmin();

  if (!admin.success) {
    redirect("/login");
  }

  return admin;
}
