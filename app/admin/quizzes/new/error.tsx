"use client";

import { AdminRouteError } from "@/modules/admin/components/admin-route-error";

export default function AdminNewQuizError({
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
      title="Could not open create form"
      description="Faculties and subjects failed to load for the new quiz set form."
    />
  );
}
