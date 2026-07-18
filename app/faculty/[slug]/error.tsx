"use client";

import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { StatusPage } from "@/modules/public/components/status-page";

export default function FacultyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      eyebrow="Faculty"
      title="Something went wrong"
      description="We could not load this faculty page. Try again or go back to all faculties."
      icon={<AlertTriangle className="size-6" />}
      secondary={{
        href: "/#faculties",
        label: "All faculties",
        icon: <ArrowLeft className="size-4" />,
      }}
      primary={{
        label: "Try again",
        icon: <RotateCcw className="size-4" />,
        onClick: reset,
      }}
    />
  );
}
