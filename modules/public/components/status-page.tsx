import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function StatusPage({
  eyebrow,
  title,
  description,
  icon,
  primary,
  secondary,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  primary: { href?: string; label: string; icon?: ReactNode; onClick?: () => void };
  secondary: { href: string; label: string; icon?: ReactNode };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md border bg-card p-8 text-center">
        <div className="mx-auto mb-6 flex size-14 items-center justify-center border">
          {icon}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
          <h1 className="font-display text-3xl tracking-tight">{title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="outline">
            <Link href={secondary.href}>
              {secondary.icon}
              {secondary.label}
            </Link>
          </Button>
          {primary.href ? (
            <Button asChild>
              <Link href={primary.href}>
                {primary.icon}
                {primary.label}
              </Link>
            </Button>
          ) : (
            <Button type="button" onClick={primary.onClick}>
              {primary.icon}
              {primary.label}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
