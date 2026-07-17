"use client";

import { AdminRouteError } from "@/modules/admin/components/admin-route-error";

export default function AdminQuizzesError({
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
      title="Could not load quiz sets"
      description="The quiz sets section failed to load."
    />
  );
}
