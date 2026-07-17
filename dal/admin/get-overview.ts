import { and, asc, count, desc, eq, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  accessCodes,
  faculties,
  quizSections,
  quizSets,
  subjects,
  user,
} from "@/db/schema";
import { requireAdminForDal } from "@/dal/admin/require-admin";

export type AdminOverviewRecentQuizSet = {
  id: string;
  title: string;
  facultyName: string;
  isPublished: boolean;
  durationMinutes: number;
  sectionCount: number;
  questionCount: number;
  totalMarks: number;
};

export type AdminOverview = {
  stats: {
    users: number;
    faculties: number;
    subjects: number;
    quizSets: number;
    accessCodes: number;
  };
  accessCodeHealth: {
    available: number;
    used: number;
    expired: number;
  };
  recentQuizSets: AdminOverviewRecentQuizSet[];
};

export async function getAdminOverview(): Promise<AdminOverview> {
  await requireAdminForDal();

  const now = new Date();

  const [
    usersRow,
    facultiesRow,
    subjectsRow,
    quizSetsRow,
    accessCodesRow,
    usedCodesRow,
    expiredCodesRow,
    recentRows,
  ] = await Promise.all([
    db.select({ value: count() }).from(user),
    db.select({ value: count() }).from(faculties),
    db.select({ value: count() }).from(subjects),
    db.select({ value: count() }).from(quizSets),
    db.select({ value: count() }).from(accessCodes),
    db
      .select({ value: count() })
      .from(accessCodes)
      .where(eq(accessCodes.isUsed, true)),
    db
      .select({ value: count() })
      .from(accessCodes)
      .where(
        and(
          eq(accessCodes.isUsed, false),
          lt(accessCodes.expiresAt, now),
        ),
      ),
    db
      .select({
        id: quizSets.id,
        title: quizSets.title,
        facultyName: faculties.name,
        isPublished: quizSets.isPublished,
        durationMinutes: quizSets.durationMinutes,
      })
      .from(quizSets)
      .innerJoin(faculties, eq(quizSets.facultyId, faculties.id))
      .orderBy(desc(quizSets.createdAt), asc(quizSets.title))
      .limit(4),
  ]);

  const totalCodes = Number(accessCodesRow[0]?.value ?? 0);
  const used = Number(usedCodesRow[0]?.value ?? 0);
  const expired = Number(expiredCodesRow[0]?.value ?? 0);
  const available = Math.max(0, totalCodes - used - expired);

  const setIds = recentRows.map((row) => row.id);

  const sectionRows =
    setIds.length === 0
      ? []
      : await db
          .select({
            quizSetId: quizSections.quizSetId,
            fullMarks: quizSections.fullMarks,
            questionCount: sql<number>`(
              select count(*)::int from questions
              where questions.quiz_section_id = ${quizSections.id}
            )`,
          })
          .from(quizSections)
          .where(
            sql`${quizSections.quizSetId} in (${sql.join(
              setIds.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          );

  const statsBySet = new Map<
    string,
    { sectionCount: number; questionCount: number; totalMarks: number }
  >();

  for (const section of sectionRows) {
    const current = statsBySet.get(section.quizSetId) ?? {
      sectionCount: 0,
      questionCount: 0,
      totalMarks: 0,
    };

    current.sectionCount += 1;
    current.questionCount += Number(section.questionCount);
    current.totalMarks += section.fullMarks;
    statsBySet.set(section.quizSetId, current);
  }

  return {
    stats: {
      users: Number(usersRow[0]?.value ?? 0),
      faculties: Number(facultiesRow[0]?.value ?? 0),
      subjects: Number(subjectsRow[0]?.value ?? 0),
      quizSets: Number(quizSetsRow[0]?.value ?? 0),
      accessCodes: totalCodes,
    },
    accessCodeHealth: {
      available,
      used,
      expired,
    },
    recentQuizSets: recentRows.map((row) => {
      const stats = statsBySet.get(row.id);

      return {
        ...row,
        sectionCount: stats?.sectionCount ?? 0,
        questionCount: stats?.questionCount ?? 0,
        totalMarks: stats?.totalMarks ?? 0,
      };
    }),
  };
}
