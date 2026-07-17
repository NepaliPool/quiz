import { and, asc, count, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { faculties, quizSets } from "@/db/schema";
import { PUBLIC_PAGE_SIZE } from "@/lib/public-pagination";

export type PublicFacultyCard = {
  id: string;
  name: string;
  slug: string;
  setCount: number;
  totalQuestions: number;
};

export type PublicFaculty = {
  id: string;
  name: string;
  slug: string;
};

export type PublicFacultyListResult = {
  items: PublicFacultyCard[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export async function getFacultiesWithPublishedSets({
  page = 1,
  pageSize = PUBLIC_PAGE_SIZE,
}: {
  page?: number;
  pageSize?: number;
} = {}): Promise<PublicFacultyListResult> {
  const safePageSize = Math.min(Math.max(1, pageSize), 50);

  const totals = await db
    .select({
      value: sql<number>`count(distinct ${faculties.id})::int`,
    })
    .from(faculties)
    .innerJoin(
      quizSets,
      and(eq(quizSets.facultyId, faculties.id), eq(quizSets.isPublished, true)),
    );

  const total = Number(totals[0]?.value ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);

  const rows = await db
    .select({
      id: faculties.id,
      name: faculties.name,
      slug: faculties.slug,
      setCount: count(quizSets.id),
      totalQuestions: sql<number>`coalesce((
        select count(*)::int
        from quiz_sections
        inner join questions on questions.quiz_section_id = quiz_sections.id
        inner join quiz_sets qs on qs.id = quiz_sections.quiz_set_id
        where qs.faculty_id = ${faculties.id}
          and qs.is_published = true
      ), 0)`,
    })
    .from(faculties)
    .innerJoin(
      quizSets,
      and(eq(quizSets.facultyId, faculties.id), eq(quizSets.isPublished, true)),
    )
    .groupBy(faculties.id, faculties.name, faculties.slug)
    .having(sql`count(${quizSets.id}) > 0`)
    .orderBy(asc(faculties.name))
    .limit(safePageSize)
    .offset((safePage - 1) * safePageSize);

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      setCount: Number(row.setCount),
      totalQuestions: Number(row.totalQuestions),
    })),
    total,
    page: safePage,
    pageSize: safePageSize,
    pageCount,
  };
}

export async function getFacultyBySlug(
  slug: string,
): Promise<PublicFaculty | null> {
  const faculty = await db.query.faculties.findFirst({
    where: eq(faculties.slug, slug),
    columns: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return faculty ?? null;
}
