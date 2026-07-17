import { ArrowLeft, FileQuestion } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border bg-card">
          <FileQuestion className="size-6" />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">404</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Page not found
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            The page or quiz you are looking for does not exist, or the link may
            be outdated.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Back home
            </Link>
          </Button>
          <Button asChild>
            <Link href="/#available-quizzes">Browse quizzes</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
