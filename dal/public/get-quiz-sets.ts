import { and, asc, count, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { faculties, quizSections, quizSets, subjects } from "@/db/schema";
import { PUBLIC_PAGE_SIZE } from "@/lib/public-pagination";

export type PublicQuizSetCard = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  durationMinutes: number;
  faculty: {
    id: string;
    name: string;
    slug: string;
  };
  questionCount: number;
  totalMarks: number;
  sections: {
    id: string;
    subjectName: string;
    fullMarks: number;
  }[];
};

export type PublicQuizSetListResult = {
  items: PublicQuizSetCard[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export async function getPublishedQuizSetsByFacultySlug(
  facultySlug: string,
  {
    page = 1,
    pageSize = PUBLIC_PAGE_SIZE,
  }: {
    page?: number;
    pageSize?: number;
  } = {},
): Promise<PublicQuizSetListResult> {
  const safePageSize = Math.min(Math.max(1, pageSize), 50);
  const where = and(
    eq(faculties.slug, facultySlug),
    eq(quizSets.isPublished, true),
  );

  const totals = await db
    .select({ value: count() })
    .from(quizSets)
    .innerJoin(faculties, eq(quizSets.facultyId, faculties.id))
    .where(where);

  const total = Number(totals[0]?.value ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);

  const rows = await db
    .select({
      id: quizSets.id,
      title: quizSets.title,
      slug: quizSets.slug,
      description: quizSets.description,
      durationMinutes: quizSets.durationMinutes,
      facultyId: faculties.id,
      facultyName: faculties.name,
      facultySlug: faculties.slug,
    })
    .from(quizSets)
    .innerJoin(faculties, eq(quizSets.facultyId, faculties.id))
    .where(where)
    .orderBy(asc(quizSets.title))
    .limit(safePageSize)
    .offset((safePage - 1) * safePageSize);

  if (rows.length === 0) {
    return {
      items: [],
      total,
      page: safePage,
      pageSize: safePageSize,
      pageCount,
    };
  }

  const setIds = rows.map((row) => row.id);

  const sectionRows = await db
    .select({
      id: quizSections.id,
      quizSetId: quizSections.quizSetId,
      fullMarks: quizSections.fullMarks,
      subjectName: subjects.name,
      questionCount: sql<number>`(
        select count(*)::int from questions
        where questions.quiz_section_id = ${quizSections.id}
      )`,
    })
    .from(quizSections)
    .innerJoin(subjects, eq(quizSections.subjectId, subjects.id))
    .where(
      sql`${quizSections.quizSetId} in (${sql.join(
        setIds.map((id) => sql`${id}`),
        sql`, `,
      )})`,
    )
    .orderBy(asc(quizSections.position));

  const sectionsBySet = new Map<
    string,
    {
      sections: PublicQuizSetCard["sections"];
      questionCount: number;
      totalMarks: number;
    }
  >();

  for (const section of sectionRows) {
    const current = sectionsBySet.get(section.quizSetId) ?? {
      sections: [],
      questionCount: 0,
      totalMarks: 0,
    };

    current.sections.push({
      id: section.id,
      subjectName: section.subjectName,
      fullMarks: section.fullMarks,
    });
    current.questionCount += Number(section.questionCount);
    current.totalMarks += section.fullMarks;
    sectionsBySet.set(section.quizSetId, current);
  }

  return {
    items: rows.map((row) => {
      const sectionData = sectionsBySet.get(row.id);

      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        durationMinutes: row.durationMinutes,
        faculty: {
          id: row.facultyId,
          name: row.facultyName,
          slug: row.facultySlug,
        },
        questionCount: sectionData?.questionCount ?? 0,
        totalMarks: sectionData?.totalMarks ?? 0,
        sections: sectionData?.sections ?? [],
      };
    }),
    total,
    page: safePage,
    pageSize: safePageSize,
    pageCount,
  };
}
