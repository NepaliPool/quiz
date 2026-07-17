"use client";

import { AdminRouteError } from "@/modules/admin/components/admin-route-error";

export default function AdminQuizDetailError({
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
      title="Could not load quiz set"
      description="This quiz set editor failed to load."
    />
  );
}
