import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  FREE_MOCK_LEADERBOARD_LIMIT,
  getFreeMockLeaderboard,
} from "@/dal/public/get-free-mock-leaderboard";
import { createPageMetadata } from "@/lib/seo";
import { PublicPageShell } from "@/modules/public/components/public-page-shell";

type LeaderboardPageProps = {
  params: Promise<{ slug: string; quizSetSlug: string }>;
};

export async function generateMetadata({
  params,
}: LeaderboardPageProps): Promise<Metadata> {
  const { slug, quizSetSlug } = await params;
  const board = await getFreeMockLeaderboard({
    facultySlug: slug,
    quizSetSlug,
  });

  if (!board) {
    return createPageMetadata({
      title: "Leaderboard not found",
      description: "This free mock leaderboard could not be found.",
      path: `/faculty/${slug}/${quizSetSlug}/leaderboard`,
      noIndex: true,
    });
  }

  return createPageMetadata({
    title: `${board.quizSetTitle} leaderboard`,
    description: `Public leaderboard for ${board.quizSetTitle} (${board.facultyName}).`,
    path: `/faculty/${board.facultySlug}/${board.quizSetSlug}/leaderboard`,
  });
}

export default async function FreeMockLeaderboardPage({
  params,
}: LeaderboardPageProps) {
  const { slug, quizSetSlug } = await params;
  const board = await getFreeMockLeaderboard({
    facultySlug: slug,
    quizSetSlug,
  });

  if (!board) {
    notFound();
  }

  const takeHref = `/faculty/${board.facultySlug}/${board.quizSetSlug}`;

  return (
    <PublicPageShell
      backHref="/mocks"
      backLabel="All free mocks"
      maxWidth="max-w-6xl"
    >
      <div className="mb-10 space-y-3 border-b pb-8">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          {board.facultyName} · Free mock
        </p>
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">
          Leaderboard
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          {board.quizSetTitle} — top {FREE_MOCK_LEADERBOARD_LIMIT} by score,
          then earlier completion.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href={takeHref} className="underline underline-offset-4">
            Take this mock
          </Link>
          <Link href="/mocks" className="underline underline-offset-4">
            Browse all free mocks
          </Link>
        </div>
      </div>

      {board.entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No completed attempts yet. Be the first on the board.
        </p>
      ) : (
        <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
          <div className="border">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-3 py-3 font-medium sm:px-4">Rank</th>
                  <th className="px-3 py-3 font-medium sm:px-4">Name</th>
                  <th className="px-3 py-3 font-medium sm:px-4">Score</th>
                  <th className="hidden px-3 py-3 font-medium sm:table-cell sm:px-4">
                    %
                  </th>
                  <th className="hidden px-3 py-3 font-medium md:table-cell md:px-4">
                    Completed
                  </th>
                </tr>
              </thead>
              <tbody>
                {board.entries.map((entry) => (
                  <tr
                    key={`${entry.rank}-${entry.participantName}-${entry.completedAt}`}
                    className="border-b last:border-0"
                  >
                    <td className="px-3 py-3 tabular-nums sm:px-4">
                      {entry.rank}
                    </td>
                    <td className="max-w-[10rem] truncate px-3 py-3 font-medium sm:max-w-none sm:px-4">
                      {entry.participantName}
                    </td>
                    <td className="px-3 py-3 tabular-nums sm:px-4">
                      {entry.score}/{entry.maxScore}
                    </td>
                    <td className="hidden px-3 py-3 tabular-nums sm:table-cell sm:px-4">
                      {entry.percentage}%
                    </td>
                    <td className="hidden px-3 py-3 text-muted-foreground md:table-cell md:px-4">
                      {new Date(entry.completedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PublicPageShell>
  );
}
