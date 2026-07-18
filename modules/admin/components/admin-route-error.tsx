"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export function AdminRouteError({
  error,
  reset,
  title = "Something went wrong",
  description = "This admin section could not be loaded.",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-96 items-center justify-center border border-dashed bg-card px-6 py-16 text-center">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex size-12 items-center justify-center border">
          <AlertTriangle className="size-5" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl tracking-tight">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <Button type="button" variant="outline" className="rounded-none" onClick={reset}>
          <RotateCcw className="size-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
