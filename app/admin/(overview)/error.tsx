"use client";

import { AdminRouteError } from "@/modules/admin/components/admin-route-error";

export default function AdminOverviewError({
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
      title="Could not load overview"
      description="The admin overview failed to load. Try again in a moment."
    />
  );
}
