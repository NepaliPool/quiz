import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  isNull,
  lt,
  or,
  type SQL,
} from "drizzle-orm";

import { db } from "@/db";
import { accessCodes, quizAttempts, quizSets } from "@/db/schema";
import { requireAdminForDal } from "@/dal/admin/require-admin";
import { ADMIN_PAGE_SIZE } from "@/modules/admin/constants";

export type AccessCodeStatus = "available" | "issued" | "used" | "expired";

export type AccessCodeListItem = {
  id: string;
  code: string;
  quizSetId: string;
  quizSetTitle: string;
  status: AccessCodeStatus;
  isIssued: boolean;
  isUsed: boolean;
  hasAttempt: boolean;
  issuedAt: string | null;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type AccessCodeListResult = {
  items: AccessCodeListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function resolveStatus(
  isUsed: boolean,
  isIssued: boolean,
  expiresAt: Date | null,
  now: Date,
): AccessCodeStatus {
  if (isUsed) {
    return "used";
  }

  if (expiresAt && expiresAt < now) {
    return "expired";
  }

  if (isIssued) {
    return "issued";
  }

  return "available";
}

function toDateString(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function notExpiredFilter(now: Date): SQL {
  return or(
    isNull(accessCodes.expiresAt),
    gte(accessCodes.expiresAt, now),
  )!;
}

export async function getAccessCodes({
  q = "",
  status = "all",
  quizSetId,
  page = 1,
  pageSize = ADMIN_PAGE_SIZE,
}: {
  q?: string;
  status?: "all" | AccessCodeStatus;
  quizSetId?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<AccessCodeListResult> {
  await requireAdminForDal();

  const safePageSize = Math.min(Math.max(1, pageSize), 100);
  const query = q.trim();
  const now = new Date();
  const filters: SQL[] = [];

  if (query) {
    filters.push(ilike(accessCodes.code, `%${query}%`));
  }

  if (quizSetId && quizSetId !== "all") {
    filters.push(eq(accessCodes.quizSetId, quizSetId));
  }

  if (status === "used") {
    filters.push(eq(accessCodes.isUsed, true));
  } else if (status === "available") {
    filters.push(
      and(
        eq(accessCodes.isUsed, false),
        eq(accessCodes.isIssued, false),
        notExpiredFilter(now),
      )!,
    );
  } else if (status === "issued") {
    filters.push(
      and(
        eq(accessCodes.isUsed, false),
        eq(accessCodes.isIssued, true),
        notExpiredFilter(now),
      )!,
    );
  } else if (status === "expired") {
    filters.push(
      and(
        eq(accessCodes.isUsed, false),
        isNotNull(accessCodes.expiresAt),
        lt(accessCodes.expiresAt, now),
      )!,
    );
  }

  const where = filters.length > 0 ? and(...filters) : undefined;

  const totalRow = await db
    .select({ value: count() })
    .from(accessCodes)
    .where(where);

  const total = Number(totalRow[0]?.value ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);

  const rows = await db
    .select({
      id: accessCodes.id,
      code: accessCodes.code,
      quizSetId: accessCodes.quizSetId,
      quizSetTitle: quizSets.title,
      isIssued: accessCodes.isIssued,
      isUsed: accessCodes.isUsed,
      issuedAt: accessCodes.issuedAt,
      usedAt: accessCodes.usedAt,
      expiresAt: accessCodes.expiresAt,
      createdAt: accessCodes.createdAt,
      attemptId: quizAttempts.id,
    })
    .from(accessCodes)
    .innerJoin(quizSets, eq(accessCodes.quizSetId, quizSets.id))
    .leftJoin(quizAttempts, eq(quizAttempts.accessCodeId, accessCodes.id))
    .where(where)
    .orderBy(desc(accessCodes.createdAt), desc(accessCodes.id))
    .limit(safePageSize)
    .offset((safePage - 1) * safePageSize);

  return {
    items: rows.map((row) => ({
      id: row.id,
      code: row.code,
      quizSetId: row.quizSetId,
      quizSetTitle: row.quizSetTitle,
      status: resolveStatus(row.isUsed, row.isIssued, row.expiresAt, now),
      isIssued: row.isIssued,
      isUsed: row.isUsed,
      hasAttempt: Boolean(row.attemptId),
      issuedAt: toDateString(row.issuedAt),
      usedAt: toDateString(row.usedAt),
      expiresAt: toDateString(row.expiresAt),
      createdAt: toDateString(row.createdAt) ?? "",
    })),
    total,
    page: safePage,
    pageSize: safePageSize,
    pageCount,
  };
}
