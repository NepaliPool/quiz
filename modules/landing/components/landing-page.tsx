import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { QuizDeskBrand } from "@/components/brand/quizdesk-brand";
import { Button } from "@/components/ui/button";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import {
  LandingAuthNav,
  type LandingUser,
} from "@/modules/landing/components/landing-auth-nav";
import { LandingFaculties } from "@/modules/landing/components/landing-faculties";
import { LandingFacultiesSkeleton } from "@/modules/landing/components/landing-faculties-skeleton";
import { LandingQuickAccess } from "@/modules/landing/components/landing-quick-access";
import { landingDisplay, landingSans } from "@/modules/landing/fonts";

export function LandingPage({
  user,
  page = 1,
}: {
  user: LandingUser | null;
  page?: number;
}) {
  return (
    <div
      className={`landing flex min-h-screen flex-col bg-background ${landingSans.variable} ${landingDisplay.variable}`}
    >
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <QuizDeskBrand className="text-2xl" logoSize="md" />
          <LandingAuthNav user={user} />
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b">
          <div className="mx-auto grid w-full max-w-6xl gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="flex flex-col justify-center gap-8 px-6 py-16 md:py-24 lg:pr-12 lg:pl-6">
              <div className="space-y-5">
                <p className="landing-rise font-display text-5xl leading-none tracking-tight text-foreground md:text-6xl lg:text-7xl">
                  QuizDesk
                </p>
                <div className="landing-rule h-px w-24 bg-primary" />
                <h1 className="landing-rise landing-rise-delay-1 max-w-xl text-2xl font-medium tracking-tight text-balance md:text-3xl">
                  Choose a faculty, then take its quiz sets.
                </h1>
                <p className="landing-rise landing-rise-delay-2 max-w-md text-base leading-7 text-muted-foreground">
                  Browse faculties first. Each set bundles subjects and marks
                  behind one access code.
                </p>
              </div>

              <div className="landing-rise landing-rise-delay-3 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="rounded-none px-8">
                  <Link href="#faculties">
                    Browse faculties
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <InteractiveHoverButton href="/mocks" className="h-10 px-6">
                  Free mock tests
                </InteractiveHoverButton>
              </div>
            </div>

            <div className="border-t bg-card lg:border-t-0 lg:border-l">
              <div className="landing-rise landing-rise-delay-2 flex h-full flex-col justify-center gap-6 px-6 py-12 md:px-10 md:py-16">
                <div className="space-y-2">
                  <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                    Access code
                  </p>
                  <h2 className="font-display text-3xl tracking-tight">
                    Enter your code
                  </h2>
                  <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                    Use the one-time code from your instructor to open the quiz.
                  </p>
                </div>
                <LandingQuickAccess />
              </div>
            </div>
          </div>
        </section>

        <section id="faculties" className="border-b">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
            <div className="mb-10 flex flex-col gap-3 border-b pb-8 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                  Directory
                </p>
                <h2 className="mt-2 font-display text-4xl tracking-tight">
                  Faculties
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                Open a faculty to see every published quiz set under it.
              </p>
            </div>

            <Suspense fallback={<LandingFacultiesSkeleton />}>
              <LandingFaculties page={page} />
            </Suspense>
          </div>
        </section>

        <section className="border-b">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
            <div className="mb-10 max-w-lg">
              <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                How it works
              </p>
              <h2 className="mt-2 font-display text-4xl tracking-tight">
                Three steps to a marked result
              </h2>
            </div>

            <ol className="grid border-y md:grid-cols-3 md:divide-x">
              <li className="flex flex-col gap-3 px-0 py-8 md:px-8 md:first:pl-0 md:last:pr-0">
                <span className="font-mono text-xs tracking-widest text-primary">
                  01
                </span>
                <h3 className="text-lg font-medium">Pick a faculty</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Start from the faculty directory, then open the quiz sets
                  published for that path.
                </p>
              </li>
              <li className="flex flex-col gap-3 border-t px-0 py-8 md:border-t-0 md:px-8">
                <span className="font-mono text-xs tracking-widest text-primary">
                  02
                </span>
                <h3 className="text-lg font-medium">Unlock with a code</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Each quiz set uses a one-time access code. Subjects stay
                  together in one sitting.
                </p>
              </li>
              <li className="flex flex-col gap-3 border-t px-0 py-8 md:border-t-0 md:px-8 md:pr-0">
                <span className="font-mono text-xs tracking-widest text-primary">
                  03
                </span>
                <h3 className="text-lg font-medium">Marks by subject</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Results keep each section’s full marks clear — English,
                  Maths, and the rest.
                </p>
              </li>
            </ol>
          </div>
        </section>
      </main>

      <footer>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-3">
            <QuizDeskBrand className="text-xl" logoSize="sm" />
            <p className="text-sm leading-6 text-muted-foreground">
              Faculty-first quiz delivery with subject sections and one-time
              access codes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10">
            <FooterColumn
              title="Product"
              links={[
                { href: "#faculties", label: "Faculties" },
                { href: "/mocks", label: "Free mock tests" },
              ]}
            />
            <FooterColumn
              title="Access"
              links={[
                { href: "#faculties", label: "Browse faculties" },
                { href: "/mocks", label: "Mock leaderboards" },
              ]}
            />
          </div>
        </div>

        <div className="border-t">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} QuizDesk. All rights reserved.</p>
            <p>Built for faculty-managed assessments.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
        {title}
      </p>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-foreground/80 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
