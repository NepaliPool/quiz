"use client";

import { AdminRouteError } from "@/modules/admin/components/admin-route-error";

export default function AdminFacultiesError({
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
      title="Could not load faculties"
      description="The faculties section failed to load."
    />
  );
}
