"use client";

import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { StatusPage } from "@/modules/public/components/status-page";

export default function QuizResultError({
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
      eyebrow="Results"
      title="Could not load results"
      description="This result may not exist yet, or the link may be invalid."
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
