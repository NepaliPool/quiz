"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { listSubjects } from "@/actions/admin/lists";
import type { SubjectListResult } from "@/dal/admin/get-subjects";
import {
  adminKeys,
  type SubjectsListFilters,
} from "@/modules/admin/hooks/queries/keys";

export function useSubjectsQuery(
  filters: SubjectsListFilters,
  options?: { initialData?: SubjectListResult },
) {
  return useQuery({
    queryKey: adminKeys.subjects(filters),
    queryFn: () =>
      listSubjects({
        q: filters.q,
        facultyId:
          filters.facultyId === "all" ? undefined : filters.facultyId,
        page: filters.page,
      }),
    placeholderData: keepPreviousData,
    initialData: options?.initialData,
  });
}
