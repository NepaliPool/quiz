import {
  ArrowRight,
  GraduationCap,
  KeyRound,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  LandingAuthNav,
  type LandingUser,
} from "@/modules/landing/components/landing-auth-nav";
import { LandingFaculties } from "@/modules/landing/components/landing-faculties";
import { LandingFacultiesSkeleton } from "@/modules/landing/components/landing-faculties-skeleton";
import { LandingQuickAccess } from "@/modules/landing/components/landing-quick-access";

export function LandingPage({
  user,
  page = 1,
}: {
  user: LandingUser | null;
  page?: number;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-7xl flex-col px-6">
          <header className="flex items-center justify-between gap-4 py-6 md:py-8">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex size-9 items-center justify-center rounded-xl border bg-card">
                <GraduationCap className="size-5" />
              </span>
              QuizDesk
            </Link>

            <LandingAuthNav user={user} />
          </header>

          <section className="grid items-center gap-16 py-16 md:py-24 lg:grid-cols-2 lg:gap-24">
            <div className="flex flex-col gap-10">
              <div className="space-y-6">
                <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance md:text-5xl lg:text-6xl">
                  Choose a faculty, then take its quiz sets.
                </h1>
                <p className="max-w-lg text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
                  Browse faculties first. Each faculty page lists available
                  tests — with subjects and marks bundled into one set.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="#faculties">
                    Browse faculties
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8 md:p-10">
              <div className="mb-8 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <KeyRound className="size-4" />
                  <p className="text-sm">Quick access</p>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Enter your quiz code
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Use the one-time code provided by your instructor.
                </p>
              </div>

              <LandingQuickAccess />
            </div>
          </section>

          <section id="faculties" className="space-y-8 py-16 md:py-20">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Browse by faculty
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                  Faculties
                </h2>
              </div>
            </div>

            <Suspense fallback={<LandingFacultiesSkeleton />}>
              <LandingFaculties page={page} />
            </Suspense>
          </section>

          <section className="grid gap-4 pb-20 md:grid-cols-3 md:pb-24">
            <InfoCard
              icon={<GraduationCap className="size-5" />}
              title="Start with faculty"
              description="Pick a faculty first, then see every quiz set published under it."
            />
            <InfoCard
              icon={<KeyRound className="size-5" />}
              title="One code per set"
              description="Each quiz set unlocks with a one-time code and shows all subject sections together."
            />
            <InfoCard
              icon={<Trophy className="size-5" />}
              title="Marks per subject"
              description="English 50, Maths 40, and so on — each section keeps its own full marks."
            />
          </section>
        </div>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-3">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex size-8 items-center justify-center rounded-lg border bg-card">
                <GraduationCap className="size-4" />
              </span>
              QuizDesk
            </Link>
            <p className="text-sm leading-6 text-muted-foreground">
              Faculty-first quiz delivery with subject sections and one-time
              access codes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <FooterColumn
              title="Product"
              links={[
                { href: "#faculties", label: "Faculties" },
                { href: "/sign-up", label: "Create account" },
              ]}
            />
            <FooterColumn
              title="Access"
              links={[
                { href: "#faculties", label: "Browse faculties" },
                { href: "/login", label: "Retrieve results" },
              ]}
            />
            <FooterColumn
              title="Account"
              links={[
                { href: "/login", label: "Login" },
                { href: "/sign-up", label: "Sign up" },
              ]}
            />
          </div>
        </div>

        <div className="border-t">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-6 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} QuizDesk. All rights reserved.</p>
            <p>Built for faculty-managed assessments.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-4 flex size-10 items-center justify-center rounded-xl border bg-background">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
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
      <p className="text-sm font-medium">{title}</p>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
