"use client";

import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

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
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border bg-card">
          <AlertTriangle className="size-6" />
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Faculty</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            We could not load this faculty page. Try again or go back to all
            faculties.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="outline">
            <Link href="/#faculties">
              <ArrowLeft className="size-4" />
              All faculties
            </Link>
          </Button>
          <Button onClick={reset}>
            <RotateCcw className="size-4" />
            Try again
          </Button>
        </div>
      </div>
    </main>
  );
}
