import type { ReactNode } from "react";

import { QuizDeskBrand } from "@/components/brand/quizdesk-brand";
import { landingDisplay, landingSans } from "@/modules/landing/fonts";

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
    <main
      className={`auth flex min-h-screen items-center justify-center bg-background px-6 py-10 ${landingSans.variable} ${landingDisplay.variable}`}
    >
      <section className="w-full max-w-md">
        <QuizDeskBrand
          className="mx-auto mb-10 w-fit text-2xl"
          logoSize="md"
        />

        <div className="border bg-card p-6 md:p-8">
          <div className="mb-8 space-y-2 border-b pb-6">
            <h1 className="font-display text-3xl tracking-tight">{title}</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>

          {children}

          <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        </div>
      </section>
    </main>
  );
}
