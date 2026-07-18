import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AdminQuizNotFound() {
  return (
    <div className="flex min-h-96 items-center justify-center border border-dashed bg-card px-6 py-16 text-center">
      <div className="max-w-md space-y-4">
        <div className="space-y-2">
          <h2 className="font-display text-2xl tracking-tight">
            Quiz set not found
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            This quiz set does not exist or may have been deleted.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/quizzes">
            <ArrowLeft className="size-4" />
            Back to quiz sets
          </Link>
        </Button>
      </div>
    </div>
  );
}
