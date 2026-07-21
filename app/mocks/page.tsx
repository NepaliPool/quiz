import type { Metadata } from "next";
import Link from "next/link";

import { createPageMetadata } from "@/lib/seo";
import { getPublishedFreeMocks } from "@/dal/public/get-free-mocks";
import { FreeMocksList } from "@/modules/quiz/components/free-mocks-list";
import { PublicPageShell } from "@/modules/public/components/public-page-shell";

export const metadata: Metadata = createPageMetadata({
  title: "Free mock tests",
  description:
    "Browse published free mock tests on QuizDesk and open their public leaderboards.",
  path: "/mocks",
});

export default async function FreeMocksPage() {
  const mocks = await getPublishedFreeMocks();

  return (
    <PublicPageShell backHref="/" backLabel="Back to home" maxWidth="max-w-6xl">
      <div className="mb-10 space-y-4 border-b pb-8">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Free mocks
        </p>
        <div className="space-y-3">
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">
            Free mock tests
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Timed practice sets with a shared access code and a public
            leaderboard. Open a mock to take it, or jump straight to the board.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {mocks.length}{" "}
          {mocks.length === 1 ? "published free mock" : "published free mocks"}
        </p>
      </div>

      <FreeMocksList mocks={mocks} />

      <p className="mt-10 text-sm text-muted-foreground">
        Looking for a faculty quiz instead?{" "}
        <Link href="/#faculties" className="underline underline-offset-4">
          Browse faculties
        </Link>
      </p>
    </PublicPageShell>
  );
}
