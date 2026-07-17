"use client";

import { AdminRouteError } from "@/modules/admin/components/admin-route-error";

export default function AdminUsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminRouteError
      error={error}
      reset={reset}
      title="Could not load users"
      description="The users section failed to load."
    />
  );
}
