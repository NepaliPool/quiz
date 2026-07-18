const ADMIN_ROLES = new Set(["admin", "superadmin"]);

export function isAdminRole(role?: string | null) {
  return ADMIN_ROLES.has(role ?? "");
}

export function postAuthPath(role?: string | null) {
  return isAdminRole(role) ? "/admin" : "/";
}

export function roleFromUnknown(user: unknown): string | undefined {
  if (!user || typeof user !== "object" || !("role" in user)) {
    return undefined;
  }

  const role = (user as { role?: unknown }).role;
  return typeof role === "string" ? role : undefined;
}
