"use client";

import { AdminRouteError } from "@/modules/admin/components/admin-route-error";

export default function AdminCodesError({
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
      title="Could not load access codes"
      description="The access codes section failed to load."
    />
  );
}
