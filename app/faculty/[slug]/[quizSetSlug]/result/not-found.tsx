import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function QuizResultNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Results</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Results not found
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Use your access code on the quiz page, or open the result link from
            after you submitted.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/#faculties">
            <ArrowLeft className="size-4" />
            Browse faculties
          </Link>
        </Button>
      </div>
    </main>
  );
}
