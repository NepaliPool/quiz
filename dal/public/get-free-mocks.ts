import { and, asc, count, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { faculties, quizAttempts, quizSets } from "@/db/schema";

export type PublishedFreeMock = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  durationMinutes: number;
  facultyName: string;
  facultySlug: string;
  attemptCount: number;
  takeHref: string;
  leaderboardHref: string;
};

export async function getPublishedFreeMocks(): Promise<PublishedFreeMock[]> {
  const rows = await db
    .select({
      id: quizSets.id,
      title: quizSets.title,
      slug: quizSets.slug,
      description: quizSets.description,
      durationMinutes: quizSets.durationMinutes,
      facultyName: faculties.name,
      facultySlug: faculties.slug,
    })
    .from(quizSets)
    .innerJoin(faculties, eq(quizSets.facultyId, faculties.id))
    .where(
      and(eq(quizSets.isPublished, true), eq(quizSets.isFreeMock, true)),
    )
    .orderBy(asc(faculties.name), asc(quizSets.title));

  if (rows.length === 0) {
    return [];
  }

  const setIds = rows.map((row) => row.id);
  const countRows = await db
    .select({
      quizSetId: quizAttempts.quizSetId,
      value: count(),
    })
    .from(quizAttempts)
    .where(
      and(
        inArray(quizAttempts.quizSetId, setIds),
        eq(quizAttempts.status, "completed"),
      ),
    )
    .groupBy(quizAttempts.quizSetId);

  const counts = new Map(
    countRows.map((row) => [row.quizSetId, Number(row.value)]),
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    durationMinutes: row.durationMinutes,
    facultyName: row.facultyName,
    facultySlug: row.facultySlug,
    attemptCount: counts.get(row.id) ?? 0,
    takeHref: `/faculty/${row.facultySlug}/${row.slug}`,
    leaderboardHref: `/faculty/${row.facultySlug}/${row.slug}/leaderboard`,
  }));
}
