"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LandingFacultiesError({
  message = "Could not load faculties right now.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 border border-dashed bg-card px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center border">
        <AlertTriangle className="size-5" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Failed to load faculties</h3>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          {message}
        </p>
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          className="rounded-none"
          onClick={onRetry}
        >
          <RotateCcw className="size-4" />
          Try again
        </Button>
      )}
    </div>
  );
}
