import { and, asc, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import {
  faculties,
  quizSections,
  quizSets,
  subjects,
} from "@/db/schema";
import { requireAdminForDal } from "@/dal/admin/require-admin";
import { ADMIN_PAGE_SIZE } from "@/modules/admin/constants";

export type QuizSetListItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  durationMinutes: number;
  isPublished: boolean;
  facultyId: string;
  facultyName: string;
  facultySlug: string;
  questionCount: number;
  totalMarks: number;
  sectionLabels: { id: string; name: string; fullMarks: number }[];
  createdAt: Date;
};

export type QuizSetListResult = {
  items: QuizSetListItem[];
  total: number;
  published: number;
  draft: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type QuizSetOption = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
};

export async function getQuizSets({
  q = "",
  facultyId,
  subjectId,
  page = 1,
  pageSize = ADMIN_PAGE_SIZE,
}: {
  q?: string;
  facultyId?: string;
  subjectId?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<QuizSetListResult> {
  await requireAdminForDal();

  const safePageSize = Math.min(Math.max(1, pageSize), 100);
  const query = q.trim();
  const filters: SQL[] = [];

  if (query) {
    const pattern = `%${query}%`;
    filters.push(
      or(
        ilike(quizSets.title, pattern),
        ilike(quizSets.slug, pattern),
        ilike(quizSets.description, pattern),
      )!,
    );
  }

  if (facultyId && facultyId !== "all") {
    filters.push(eq(quizSets.facultyId, facultyId));
  }

  if (subjectId && subjectId !== "all") {
    filters.push(
      sql`exists (
        select 1 from ${quizSections}
        where ${quizSections.quizSetId} = ${quizSets.id}
          and ${quizSections.subjectId} = ${subjectId}
      )`,
    );
  }

  const where = filters.length > 0 ? and(...filters) : undefined;

  const [totals, publishedRow] = await Promise.all([
    db.select({ value: count() }).from(quizSets).where(where),
    db
      .select({ value: count() })
      .from(quizSets)
      .where(and(where, eq(quizSets.isPublished, true))),
  ]);

  const total = Number(totals[0]?.value ?? 0);
  const published = Number(publishedRow[0]?.value ?? 0);
  const draft = total - published;
  const pageCount = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);

  const rows = await db
    .select({
      id: quizSets.id,
      title: quizSets.title,
      slug: quizSets.slug,
      description: quizSets.description,
      durationMinutes: quizSets.durationMinutes,
      isPublished: quizSets.isPublished,
      facultyId: quizSets.facultyId,
      facultyName: faculties.name,
      facultySlug: faculties.slug,
      createdAt: quizSets.createdAt,
    })
    .from(quizSets)
    .innerJoin(faculties, eq(quizSets.facultyId, faculties.id))
    .where(where)
    .orderBy(desc(quizSets.createdAt), asc(quizSets.title))
    .limit(safePageSize)
    .offset((safePage - 1) * safePageSize);

  const setIds = rows.map((row) => row.id);

  const sectionRows =
    setIds.length === 0
      ? []
      : await db
          .select({
            id: quizSections.id,
            quizSetId: quizSections.quizSetId,
            fullMarks: quizSections.fullMarks,
            subjectId: subjects.id,
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
      labels: { id: string; name: string; fullMarks: number }[];
      questionCount: number;
      totalMarks: number;
    }
  >();

  for (const section of sectionRows) {
    const current = sectionsBySet.get(section.quizSetId) ?? {
      labels: [],
      questionCount: 0,
      totalMarks: 0,
    };

    current.labels.push({
      id: section.subjectId,
      name: section.subjectName,
      fullMarks: section.fullMarks,
    });
    current.questionCount += Number(section.questionCount);
    current.totalMarks += section.fullMarks;
    sectionsBySet.set(section.quizSetId, current);
  }

  const items: QuizSetListItem[] = rows.map((row) => {
    const sectionData = sectionsBySet.get(row.id);

    return {
      ...row,
      questionCount: sectionData?.questionCount ?? 0,
      totalMarks: sectionData?.totalMarks ?? 0,
      sectionLabels: sectionData?.labels ?? [],
    };
  });

  return {
    items,
    total,
    published,
    draft,
    page: safePage,
    pageSize: safePageSize,
    pageCount,
  };
}

export async function getQuizSetOptions({
  publishedOnly = false,
}: {
  publishedOnly?: boolean;
} = {}): Promise<QuizSetOption[]> {
  await requireAdminForDal();

  return db
    .select({
      id: quizSets.id,
      title: quizSets.title,
      slug: quizSets.slug,
      isPublished: quizSets.isPublished,
    })
    .from(quizSets)
    .where(publishedOnly ? eq(quizSets.isPublished, true) : undefined)
    .orderBy(asc(quizSets.title));
}
