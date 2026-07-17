import { and, asc, count, eq, ilike, or, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { faculties } from "@/db/schema";
import { requireAdminForDal } from "@/dal/admin/require-admin";
import { ADMIN_PAGE_SIZE } from "@/modules/admin/constants";

export type FacultyListItem = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
};

export type FacultyListResult = {
  items: FacultyListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type FacultyOption = {
  id: string;
  name: string;
};

export async function getFaculties({
  q = "",
  page = 1,
  pageSize = ADMIN_PAGE_SIZE,
}: {
  q?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<FacultyListResult> {
  await requireAdminForDal();

  const safePageSize = Math.min(Math.max(1, pageSize), 100);
  const safePage = Math.max(1, page);
  const query = q.trim();

  const filters: SQL[] = [];

  if (query) {
    const pattern = `%${query}%`;
    filters.push(
      or(ilike(faculties.name, pattern), ilike(faculties.slug, pattern))!,
    );
  }

  const where = filters.length > 0 ? and(...filters) : undefined;

  const [items, totalRow] = await Promise.all([
    db
      .select({
        id: faculties.id,
        name: faculties.name,
        slug: faculties.slug,
        createdAt: faculties.createdAt,
      })
      .from(faculties)
      .where(where)
      .orderBy(asc(faculties.name))
      .limit(safePageSize)
      .offset((safePage - 1) * safePageSize),
    db.select({ value: count() }).from(faculties).where(where),
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

export async function getFacultyOptions(): Promise<FacultyOption[]> {
  await requireAdminForDal();

  return db
    .select({
      id: faculties.id,
      name: faculties.name,
    })
    .from(faculties)
    .orderBy(asc(faculties.name));
}

export async function getFacultyById(id: string) {
  await requireAdminForDal();

  return db.query.faculties.findFirst({
    where: eq(faculties.id, id),
  });
}
