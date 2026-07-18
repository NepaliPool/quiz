import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PublicPagination({
  page,
  pageCount,
  totalItems,
  pageSize,
  hrefForPage,
}: {
  page: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  hrefForPage: (page: number) => string;
}) {
  if (totalItems <= pageSize || pageCount <= 1) {
    return null;
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(totalItems, page * pageSize);

  return (
    <div className="flex flex-col gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing {start}-{end} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm" className="rounded-none" disabled={page <= 1}>
          <Link
            href={hrefForPage(page - 1)}
            aria-disabled={page <= 1}
            className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
            scroll={false}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Link>
        </Button>
        <span className="min-w-20 text-center">
          Page {page} of {pageCount}
        </span>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-none"
          disabled={page >= pageCount}
        >
          <Link
            href={hrefForPage(page + 1)}
            aria-disabled={page >= pageCount}
            className={
              page >= pageCount ? "pointer-events-none opacity-50" : undefined
            }
            scroll={false}
          >
            Next
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
