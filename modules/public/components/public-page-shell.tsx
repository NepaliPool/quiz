import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { QuizDeskBrand } from "@/components/brand/quizdesk-brand";
import { cn } from "@/lib/utils";

export function PublicPageShell({
  backHref,
  backLabel,
  children,
  maxWidth = "max-w-4xl",
}: {
  backHref: string;
  backLabel: string;
  children: ReactNode;
  maxWidth?: "max-w-4xl" | "max-w-6xl";
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div
          className={cn(
            "mx-auto flex w-full items-center justify-between gap-4 px-6 py-4",
            maxWidth,
          )}
        >
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
          <QuizDeskBrand className="text-xl" logoSize="sm" />
        </div>
      </header>
      <main
        className={cn(
          "mx-auto flex w-full flex-1 flex-col px-6 py-10 md:py-14",
          maxWidth,
        )}
      >
        {children}
      </main>
    </div>
  );
}
