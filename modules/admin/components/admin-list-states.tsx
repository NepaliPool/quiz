"use client";

import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminListToolbar({
  query,
  onQueryChange,
  onClearFilters,
  placeholder,
  filters,
  actions,
  showClear,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onClearFilters?: () => void;
  placeholder: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  /** When set, overrides the default “clear when query is non-empty” behavior. */
  showClear?: boolean;
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
            className="pl-9"
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
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b p-4">
        <Skeleton className="h-9 w-full max-w-sm" />
      </div>
      <div className="space-y-3 p-4">
        {Array.from({ length: rows }).map((_, row) => (
          <div
            key={row}
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: columns }).map((__, column) => (
              <Skeleton key={column} className="h-5" />
            ))}
          </div>
        ))}
      </div>
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
    <div className="rounded-xl border border-dashed bg-card px-6 py-12 text-center">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
