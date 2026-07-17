"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { useDebounce } from "@/hooks/use-debounce";

/**
 * Syncs search `q` / `page` / filters to the URL for server-driven list pages.
 * Filtering and pagination happen in the DAL, not on the client.
 */
export function useAdminListParams() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const pageFromUrl = Number(searchParams.get("page") ?? "1");
  const [query, setQuery] = useState(urlQuery);
  const debouncedQuery = useDebounce(query, 350);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentQ = searchParams.get("q") ?? "";
    const nextQ = debouncedQuery.trim();

    if (currentQ === nextQ) {
      return;
    }

    if (nextQ) {
      params.set("q", nextQ);
    } else {
      params.delete("q");
    }

    params.delete("page");

    const next = params.toString();
    startTransition(() => {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, pathname, router]);

  const page = Number.isFinite(pageFromUrl) ? Math.max(1, pageFromUrl) : 1;

  function setPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    const safePage = Math.max(1, nextPage);

    if (safePage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(safePage));
    }

    const next = params.toString();
    startTransition(() => {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    });
  }

  function clearFilters(keysToClear: string[] = []) {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("page");

    for (const key of keysToClear) {
      params.delete(key);
    }

    const next = params.toString();
    startTransition(() => {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    });
  }

  function setParam(key: string, value: string, allValue = "all") {
    setParams({ [key]: value }, allValue);
  }

  function setParams(
    updates: Record<string, string>,
    allValue = "all",
  ) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === allValue) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    params.delete("page");
    const next = params.toString();
    startTransition(() => {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    });
  }

  return {
    query,
    setQuery,
    page,
    setPage,
    clearFilters,
    setParam,
    setParams,
    searchParams,
    isPending,
    getParam: (key: string, fallback = "all") =>
      searchParams.get(key) ?? fallback,
  };
}
