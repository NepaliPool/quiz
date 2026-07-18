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

export function useAccessCodesQuery(
  filters: AccessCodesListFilters,
  options?: { initialData?: AccessCodeListResult },
) {
  return useQuery({
    queryKey: adminKeys.accessCodes(filters),
    queryFn: () =>
      listAccessCodes({
        q: filters.q,
        status:
          filters.status === "all"
            ? "all"
            : (filters.status as AccessCodeStatus),
        quizSetId: filters.quizSetId === "all" ? undefined : filters.quizSetId,
        page: filters.page,
      }),
    placeholderData: keepPreviousData,
    initialData: options?.initialData,
  });
}
