import { redirect } from "next/navigation";

import { getCurrentAdmin } from "@/lib/auth/get-current-admin";

export async function requireAdminForDal() {
  const admin = await getCurrentAdmin();

  if (!admin.success) {
    redirect("/login");
  }

  return admin;
}

/** For server-action queryFns — throw instead of redirect so React Query can handle errors. */
export async function assertAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin.success) {
    throw new Error(admin.message);
  }

  return admin;
}
