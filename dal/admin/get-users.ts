import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";
import { requireAdminForDal } from "@/dal/admin/require-admin";
import { ADMIN_PAGE_SIZE } from "@/modules/admin/constants";

export type UserRole = "admin" | "superadmin" | "user";

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  createdAt: string;
};

export type UserListResult = {
  items: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export async function getUsers({
  q = "",
  role,
  page = 1,
  pageSize = ADMIN_PAGE_SIZE,
}: {
  q?: string;
  role?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<UserListResult> {
  await requireAdminForDal();

  const safePageSize = Math.min(Math.max(1, pageSize), 100);
  const query = q.trim();
  const filters: SQL[] = [];

  if (query) {
    const pattern = `%${query}%`;
    filters.push(or(ilike(user.name, pattern), ilike(user.email, pattern))!);
  }

  if (role && role !== "all") {
    filters.push(eq(user.role, role));
  }

  const where = filters.length > 0 ? and(...filters) : undefined;

  const totalRow = await db.select({ value: count() }).from(user).where(where);
  const total = Number(totalRow[0]?.value ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(where)
    .orderBy(desc(user.createdAt), asc(user.name))
    .limit(safePageSize)
    .offset((safePage - 1) * safePageSize);

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      banned: row.banned ?? false,
      createdAt: row.createdAt.toISOString().slice(0, 10),
    })),
    total,
    page: safePage,
    pageSize: safePageSize,
    pageCount,
  };
}
