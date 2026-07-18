"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { listQuizSets } from "@/actions/admin/lists";
import type { QuizSetListResult } from "@/dal/admin/get-quiz-sets";
import {
  adminKeys,
  type QuizSetsListFilters,
} from "@/modules/admin/hooks/queries/keys";

export function useQuizSetsQuery(
  filters: QuizSetsListFilters,
  options?: { initialData?: QuizSetListResult },
) {
  return useQuery({
    queryKey: adminKeys.quizSets(filters),
    queryFn: () =>
      listQuizSets({
        q: filters.q,
        facultyId:
          filters.facultyId === "all" ? undefined : filters.facultyId,
        subjectId:
          filters.subjectId === "all" ? undefined : filters.subjectId,
        page: filters.page,
      }),
    placeholderData: keepPreviousData,
    initialData: options?.initialData,
  });
}
