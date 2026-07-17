import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";

export type CurrentAdmin =
  | {
      success: true;
      adminId: string;
      role: string;
      user: {
        id: string;
        name: string;
        email: string;
        image: string | null | undefined;
        role: string;
      };
    }
  | { success: false; message: string };

const ADMIN_ROLES = new Set(["admin", "superadmin"]);

export async function getCurrentAdmin(): Promise<CurrentAdmin> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session?.user) {
    return { success: false, message: "No active session found." };
  }

  if (!ADMIN_ROLES.has(session.user.role ?? "")) {
    return {
      success: false,
      message: "User does not have admin privileges.",
    };
  }

  return {
    success: true,
    adminId: session.user.id,
    role: session.user.role ?? "admin",
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      role: session.user.role ?? "admin",
    },
  };
}
