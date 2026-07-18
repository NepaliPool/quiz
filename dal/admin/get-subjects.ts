import { and, asc, count, eq, ilike, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { faculties, subjects } from "@/db/schema";
import { requireAdminForDal } from "@/dal/admin/require-admin";
import { ADMIN_PAGE_SIZE } from "@/modules/admin/constants";

export type SubjectListItem = {
  id: string;
  name: string;
  facultyId: string;
  facultyName: string;
  createdAt: Date;
};

export type SubjectListResult = {
  items: SubjectListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export async function getSubjects({
  q = "",
  facultyId,
  page = 1,
  pageSize = ADMIN_PAGE_SIZE,
}: {
  q?: string;
  facultyId?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<SubjectListResult> {
  await requireAdminForDal();

  const safePageSize = Math.min(Math.max(1, pageSize), 100);
  const safePage = Math.max(1, page);
  const query = q.trim();

  const filters: SQL[] = [];

  if (query) {
    filters.push(ilike(subjects.name, `%${query}%`));
  }

  if (facultyId && facultyId !== "all") {
    filters.push(eq(subjects.facultyId, facultyId));
  }

  const where = filters.length > 0 ? and(...filters) : undefined;

  const [items, totalRow] = await Promise.all([
    db
      .select({
        id: subjects.id,
        name: subjects.name,
        facultyId: subjects.facultyId,
        facultyName: faculties.name,
        createdAt: subjects.createdAt,
      })
      .from(subjects)
      .innerJoin(faculties, eq(subjects.facultyId, faculties.id))
      .where(where)
      .orderBy(asc(faculties.name), asc(subjects.name))
      .limit(safePageSize)
      .offset((safePage - 1) * safePageSize),
    db
      .select({ value: count() })
      .from(subjects)
      .innerJoin(faculties, eq(subjects.facultyId, faculties.id))
      .where(where),
  ]);

  const total = Number(totalRow[0]?.value ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / safePageSize));

  return {
    items,
    total,
    page: Math.min(safePage, pageCount),
    pageSize: safePageSize,
    pageCount,
  };
}
