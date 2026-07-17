import { GraduationCap } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-6 py-10">
      <section className="w-full max-w-md">
        <Link
          href="/"
          className="mx-auto mb-8 flex w-fit items-center gap-2 font-semibold"
        >
          <span className="flex size-9 items-center justify-center rounded-xl border bg-background">
            <GraduationCap className="size-5" />
          </span>
          QuizDesk
        </Link>

        <div className="rounded-2xl border bg-background p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>

          {children}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        </div>
      </section>
    </main>
  );
}
