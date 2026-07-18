"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { useDebounce } from "@/hooks/use-debounce";

const SEARCH_DEBOUNCE_MS = 400;

/**
 * Syncs search `q` / `page` / filters to the URL for server-driven list pages.
 * Filtering and pagination happen in the DAL, not on the client.
 */
export function useAdminListParams() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);
  const [isPending, startTransition] = useTransition();

  const queryRef = useRef(query);
  queryRef.current = query;

  /** Last `q` value we wrote to the URL (skip echoing it back into the input). */
  const pushedQueryRef = useRef<string | null>(null);
  /** Optimistic query string so rapid filter + search updates don't clobber each other. */
  const optimisticParamsRef = useRef<string | null>(null);

  useEffect(() => {
    if (optimisticParamsRef.current === null) {
      return;
    }

    if (optimisticParamsRef.current === searchParamsKey) {
      optimisticParamsRef.current = null;
      return;
    }

    if (!isPending) {
      optimisticParamsRef.current = null;
    }
  }, [searchParamsKey, isPending]);

  // Sync URL → input only when the URL `q` changes (back/forward, shared links).
  // Never sync when debounce settles — that was restoring cleared text from a stale `q`.
  useEffect(() => {
    if (
      pushedQueryRef.current !== null &&
      urlQuery === pushedQueryRef.current
    ) {
      pushedQueryRef.current = null;
      return;
    }

    // Still typing / clearing ahead of the URL — keep local input.
    if (queryRef.current !== debouncedQuery) {
      return;
    }

    // A push we initiated hasn't landed yet; ignore intermediate/stale URL values.
    if (
      pushedQueryRef.current !== null &&
      urlQuery !== pushedQueryRef.current
    ) {
      return;
    }

    if (urlQuery !== queryRef.current) {
      setQuery(urlQuery);
    }
    // Intentionally only URL-driven. debouncedQuery is read via ref for the dirty check
    // but must not re-trigger this effect when debounce catches up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  function getWorkingParams() {
    if (optimisticParamsRef.current !== null) {
      return new URLSearchParams(optimisticParamsRef.current);
    }

    return new URLSearchParams(searchParamsKey);
  }

  function commitParams(mutate: (params: URLSearchParams) => void) {
    const params = getWorkingParams();
    mutate(params);
    const next = params.toString();
    optimisticParamsRef.current = next;

    startTransition(() => {
      router.replace(next ? `${pathname}?${next}` : pathname, {
        scroll: false,
      });
    });
  }

  useEffect(() => {
    const nextQ = debouncedQuery.trim();
    const currentQ = getWorkingParams().get("q") ?? "";

    if (currentQ === nextQ) {
      return;
    }

    pushedQueryRef.current = nextQ;
    commitParams((params) => {
      if (nextQ) {
        params.set("q", nextQ);
      } else {
        params.delete("q");
      }
      params.delete("page");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, pathname]);

  const pageFromUrl = Number(
    (optimisticParamsRef.current !== null
      ? new URLSearchParams(optimisticParamsRef.current).get("page")
      : searchParams.get("page")) ?? "1",
  );
  const page = Number.isFinite(pageFromUrl) ? Math.max(1, pageFromUrl) : 1;

  function setPage(nextPage: number) {
    const safePage = Math.max(1, nextPage);

    commitParams((params) => {
      if (safePage <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(safePage));
      }
    });
  }

  function clearFilters(keysToClear: string[] = []) {
    setQuery("");
    pushedQueryRef.current = "";

    commitParams((params) => {
      params.delete("q");
      params.delete("page");

      for (const key of keysToClear) {
        params.delete(key);
      }
    });
  }

  function setParam(key: string, value: string, allValue = "all") {
    setParams({ [key]: value }, allValue);
  }

  function setParams(updates: Record<string, string>, allValue = "all") {
    commitParams((params) => {
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === allValue) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      params.delete("page");
    });
  }

  function readParam(key: string, fallback = "all") {
    const params =
      optimisticParamsRef.current !== null
        ? new URLSearchParams(optimisticParamsRef.current)
        : searchParams;

    return params.get(key) ?? fallback;
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
    getParam: readParam,
  };
}
