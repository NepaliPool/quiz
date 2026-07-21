"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { listAccessCodes } from "@/actions/admin/lists";
import type {
  AccessCodeListResult,
  AccessCodeStatus,
} from "@/dal/admin/get-access-codes";
import {
  adminKeys,
  type AccessCodesListFilters,
} from "@/modules/admin/hooks/queries/keys";

const ACCESS_CODE_STATUSES = new Set<AccessCodeStatus>([
  "available",
  "issued",
  "used",
  "expired",
  "revoked",
]);

function parseAccessCodeStatus(
  status: string,
): "all" | AccessCodeStatus {
  if (status === "all") {
    return "all";
  }

  if (ACCESS_CODE_STATUSES.has(status as AccessCodeStatus)) {
    return status as AccessCodeStatus;
  }

  return "all";
}

export function useAccessCodesQuery(
  filters: AccessCodesListFilters,
  options?: { initialData?: AccessCodeListResult },
) {
  const status = parseAccessCodeStatus(filters.status);

  return useQuery({
    queryKey: adminKeys.accessCodes({ ...filters, status }),
    queryFn: () =>
      listAccessCodes({
        q: filters.q,
        status,
        quizSetId: filters.quizSetId === "all" ? undefined : filters.quizSetId,
        page: filters.page,
      }),
    placeholderData: keepPreviousData,
    initialData: options?.initialData,
  });
}
