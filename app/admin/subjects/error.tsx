"use client";

import { AdminRouteError } from "@/modules/admin/components/admin-route-error";

export default function AdminSubjectsError({
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
      title="Could not load subjects"
      description="The subjects section failed to load."
    />
  );
}
