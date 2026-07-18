"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { listFaculties } from "@/actions/admin/lists";
import type { FacultyListResult } from "@/dal/admin/get-faculties";
import {
  adminKeys,
  type FacultiesListFilters,
} from "@/modules/admin/hooks/queries/keys";

export function useFacultiesQuery(
  filters: FacultiesListFilters,
  options?: { initialData?: FacultyListResult },
) {
  return useQuery({
    queryKey: adminKeys.faculties(filters),
    queryFn: () =>
      listFaculties({
        q: filters.q,
        page: filters.page,
      }),
    placeholderData: keepPreviousData,
    initialData: options?.initialData,
  });
}
