"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { listUsers } from "@/actions/admin/lists";
import type { UserListResult } from "@/dal/admin/get-users";
import {
  adminKeys,
  type UsersListFilters,
} from "@/modules/admin/hooks/queries/keys";

export function useUsersQuery(
  filters: UsersListFilters,
  options?: { initialData?: UserListResult },
) {
  return useQuery({
    queryKey: adminKeys.users(filters),
    queryFn: () =>
      listUsers({
        q: filters.q,
        role: filters.role === "all" ? undefined : filters.role,
        page: filters.page,
      }),
    placeholderData: keepPreviousData,
    initialData: options?.initialData,
  });
}
