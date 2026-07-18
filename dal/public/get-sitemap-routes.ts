import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { faculties, quizSets } from "@/db/schema";

export type SitemapFacultyRoute = {
  slug: string;
  updatedAt: Date | null;
};

export type SitemapQuizSetRoute = {
  facultySlug: string;
  quizSetSlug: string;
  updatedAt: Date | null;
};

/** All faculties that have at least one published quiz set. */
export async function getSitemapFacultyRoutes(): Promise<SitemapFacultyRoute[]> {
  const rows = await db
    .selectDistinct({
      slug: faculties.slug,
      updatedAt: faculties.updatedAt,
    })
    .from(faculties)
    .innerJoin(
      quizSets,
      and(eq(quizSets.facultyId, faculties.id), eq(quizSets.isPublished, true)),
    )
    .orderBy(asc(faculties.slug));

  return rows;
}

/** All published quiz sets with their faculty slug. */
export async function getSitemapQuizSetRoutes(): Promise<SitemapQuizSetRoute[]> {
  const rows = await db
    .select({
      facultySlug: faculties.slug,
      quizSetSlug: quizSets.slug,
      updatedAt: quizSets.updatedAt,
    })
    .from(quizSets)
    .innerJoin(faculties, eq(quizSets.facultyId, faculties.id))
    .where(eq(quizSets.isPublished, true))
    .orderBy(asc(faculties.slug), asc(quizSets.slug));

  return rows;
}
