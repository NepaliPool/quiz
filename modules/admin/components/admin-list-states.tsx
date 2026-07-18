"use client";

import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageHeader } from "@/modules/admin/components/admin-page-header";

export function AdminListToolbar({
  query,
  onQueryChange,
  onClearFilters,
  placeholder,
  filters,
  actions,
  showClear,
  isPending = false,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onClearFilters?: () => void;
  placeholder: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  /** When set, overrides the default “clear when query is non-empty” behavior. */
  showClear?: boolean;
  isPending?: boolean;
}) {
  const shouldShowClear =
    showClear ?? Boolean(query.trim() && onClearFilters);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
            className="rounded-none pl-9"
            aria-busy={isPending}
          />
        </div>
        {filters}
        {shouldShowClear && onClearFilters ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="shrink-0"
          >
            <X className="size-4" />
            Clear
          </Button>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminListResults({
  isPending = false,
  children,
}: {
  isPending?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative" aria-busy={isPending}>
      {isPending ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-muted"
          aria-hidden
        >
          <div className="h-full w-1/3 animate-pulse bg-foreground/40" />
        </div>
      ) : null}
      <div
        inert={isPending ? true : undefined}
        className={
          isPending
            ? "pointer-events-none opacity-50 transition-opacity duration-150"
            : "opacity-100 transition-opacity duration-150"
        }
      >
        {children}
      </div>
    </div>
  );
}

export function AdminPagination({
  page,
  pageCount,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(totalItems, page * pageSize);

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing {start}-{end} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <span className="min-w-20 text-center">
          Page {page} of {pageCount}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function AdminTableSkeleton({
  rows = 6,
  columns = 4,
  showToolbar = false,
}: {
  rows?: number;
  columns?: number;
  /** Include a fake search row — use in route `loading.tsx`, not under a live toolbar. */
  showToolbar?: boolean;
}) {
  return (
    <div className="space-y-4">
      {showToolbar ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-full max-w-xs rounded-none bg-muted" />
          <Skeleton className="h-9 w-full rounded-none bg-muted sm:w-40" />
        </div>
      ) : null}
      <div className="overflow-hidden border bg-card">
        <div className="space-y-0 divide-y">
          {Array.from({ length: rows }).map((_, row) => (
            <div
              key={row}
              className="grid gap-3 px-4 py-3.5"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: columns }).map((__, column) => (
                <Skeleton
                  key={column}
                  className="h-5 rounded-none bg-muted"
                  style={{
                    width: column === 0 ? "70%" : "85%",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminListPageSkeleton({
  title,
  description,
  columns = 4,
  rows = 6,
}: {
  title: string;
  description?: string;
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="space-y-6">
      <AdminPageHeader title={title} description={description} />
      <AdminTableSkeleton columns={columns} rows={rows} showToolbar />
    </div>
  );
}

export function AdminEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border border-dashed bg-card px-6 py-12 text-center">
      <h3 className="font-display text-xl tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
