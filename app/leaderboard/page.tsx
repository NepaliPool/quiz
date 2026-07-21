import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/seo";
import { MockLeaderboardTable } from "@/modules/leaderboard/components/mock-leaderboard-table";
import { MOCK_LEADERBOARD_BOARDS } from "@/modules/leaderboard/mock-leaderboard-data";
import { PublicPageShell } from "@/modules/public/components/public-page-shell";

export const metadata: Metadata = createPageMetadata({
  title: "Leaderboard",
  description:
    "Practice entrance leaderboards for Management and Engineering streams on QuizDesk.",
  path: "/leaderboard",
});

export default function LeaderboardPage() {
  return (
    <PublicPageShell backHref="/" backLabel="Back to home" maxWidth="max-w-6xl">
      <div className="mb-10 space-y-3 border-b pb-8">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Results
        </p>
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">
          Leaderboard
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          Top scores by stream. Access codes are partially masked for privacy.
        </p>
      </div>

      <div className="grid gap-14 lg:grid-cols-2 lg:gap-10">
        {MOCK_LEADERBOARD_BOARDS.map((board) => (
          <MockLeaderboardTable key={board.id} board={board} />
        ))}
      </div>
    </PublicPageShell>
  );
}
