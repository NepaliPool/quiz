import Link from "next/link";

import { QuizDeskLogo } from "@/components/brand/quizdesk-logo";
import { cn } from "@/lib/utils";

export function QuizDeskBrand({
  href = "/",
  className,
  logoSize = "md",
  showWordmark = true,
}: {
  href?: string;
  className?: string;
  logoSize?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 text-foreground transition-opacity hover:opacity-80",
        className,
      )}
    >
      <QuizDeskLogo size={logoSize} />
      {showWordmark ? (
        <span className="font-display tracking-tight">QuizDesk</span>
      ) : (
        <span className="sr-only">QuizDesk</span>
      )}
    </Link>
  );
}
