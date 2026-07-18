"use client";

import { Badge } from "@/components/ui/badge";
import {
  AdminEmptyState,
  AdminListToolbar,
  AdminPagination,
} from "@/modules/admin/components/admin-list-states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserListResult } from "@/dal/admin/get-users";
import { useAdminListParams } from "@/modules/admin/hooks/use-admin-list-params";

export function UsersTable({ data }: { data: UserListResult }) {
  const list = useAdminListParams();
  const roleFilter = list.getParam("role");
  const showPagination = data.total > data.pageSize;
  const hasActiveFilters = Boolean(
    list.query.trim() || roleFilter !== "all" || list.searchParams.get("page"),
  );

  return (
    <div className="space-y-4">
      <AdminListToolbar
        query={list.query}
        onQueryChange={list.setQuery}
        onClearFilters={() => list.clearFilters(["role"])}
        showClear={hasActiveFilters}
        placeholder="Search by name or email"
        filters={
          <Select
            value={roleFilter}
            onValueChange={(value) => list.setParam("role", value)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="superadmin">Superadmin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {data.items.length === 0 ? (
        <AdminEmptyState
          title="No users found"
          description="Try a different search or role filter."
        />
      ) : (
        <div className="overflow-hidden border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.role}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.createdAt}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {showPagination ? (
            <AdminPagination
              page={data.page}
              pageCount={data.pageCount}
              totalItems={data.total}
              pageSize={data.pageSize}
              onPageChange={list.setPage}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
