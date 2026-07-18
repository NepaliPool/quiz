"use client";

import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { StatusPage } from "@/modules/public/components/status-page";

export default function Error({
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
      eyebrow="Error"
      title="Something went wrong"
      description="An unexpected error occurred while loading this page. You can try again or go back home."
      icon={<AlertTriangle className="size-6" />}
      secondary={{
        href: "/",
        label: "Back home",
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
