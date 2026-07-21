import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { faculties, quizAttempts, quizSets } from "@/db/schema";

export type LeaderboardEntry = {
  rank: number;
  participantName: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: string;
};

export type FreeMockLeaderboard = {
  quizSetId: string;
  quizSetTitle: string;
  quizSetSlug: string;
  facultyName: string;
  facultySlug: string;
  entries: LeaderboardEntry[];
};

export const FREE_MOCK_LEADERBOARD_LIMIT = 30;

export async function getFreeMockLeaderboard({
  facultySlug,
  quizSetSlug,
}: {
  facultySlug: string;
  quizSetSlug: string;
}): Promise<FreeMockLeaderboard | null> {
  const faculty = await db.query.faculties.findFirst({
    where: eq(faculties.slug, facultySlug),
    columns: { id: true, name: true, slug: true },
  });

  if (!faculty) {
    return null;
  }

  const quizSet = await db.query.quizSets.findFirst({
    where: and(
      eq(quizSets.facultyId, faculty.id),
      eq(quizSets.slug, quizSetSlug),
      eq(quizSets.isPublished, true),
      eq(quizSets.isFreeMock, true),
    ),
    columns: {
      id: true,
      title: true,
      slug: true,
    },
  });

  if (!quizSet) {
    return null;
  }

  const rows = await db
    .select({
      participantName: quizAttempts.participantName,
      score: quizAttempts.score,
      maxScore: quizAttempts.maxScore,
      completedAt: quizAttempts.completedAt,
    })
    .from(quizAttempts)
    .where(
      and(
        eq(quizAttempts.quizSetId, quizSet.id),
        eq(quizAttempts.status, "completed"),
      ),
    )
    .orderBy(desc(quizAttempts.score), asc(quizAttempts.completedAt))
    .limit(FREE_MOCK_LEADERBOARD_LIMIT);

  const entries: LeaderboardEntry[] = rows
    .filter((row) => row.participantName && row.completedAt)
    .map((row, index) => ({
      rank: index + 1,
      participantName: row.participantName!,
      score: row.score,
      maxScore: row.maxScore,
      percentage: Math.round((row.score / row.maxScore) * 100),
      completedAt: row.completedAt!.toISOString(),
    }));

  return {
    quizSetId: quizSet.id,
    quizSetTitle: quizSet.title,
    quizSetSlug: quizSet.slug,
    facultyName: faculty.name,
    facultySlug: faculty.slug,
    entries,
  };
}
