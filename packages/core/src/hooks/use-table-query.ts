import * as React from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { PaginationState } from "@tanstack/react-table";
import { useDebounce } from "./use-debounce";
import { sanitizeParams } from "./use-query-filters";

export interface UseTableQueryOptions<
  TFilters extends Record<string, any> = Record<string, any>,
> {
  /**
   * Data and pagination operating mode:
   * - "server": Pagination, search, and filters trigger backend API queries and sync to URL query params.
   * - "client": Whole dataset is loaded; table paginates locally, but search & filters can still be managed.
   * @default "server"
   */
  mode?: "client" | "server";
  /**
   * Default filter values (e.g. { status: "all", listId: undefined }).
   */
  defaultValues?: Partial<TFilters>;
  /**
   * Default 1-indexed page number for pagination.
   * @default 1
   */
  defaultPage?: number;
  /**
   * Default rows per page.
   * @default 10
   */
  defaultPageSize?: number;
  /**
   * Debounce delay in milliseconds for search input.
   * @default 300
   */
  debounceMs?: number;
  /**
   * Search field key inside filters/URL (e.g. 'search' or 'q').
   * @default 'search'
   */
  searchKey?: keyof TFilters & string;
  /**
   * URL parameter key for page number.
   * @default 'page'
   */
  pageKey?: string;
  /**
   * URL parameter key for page size.
   * @default 'page_size'
   */
  pageSizeKey?: string;
  /**
   * Whether to synchronize state with URL query string.
   * @default true
   */
  syncToUrl?: boolean;
  /**
   * Whether to replace the browser history entry instead of pushing a new one.
   * @default true
   */
  replace?: boolean;
}

export interface UseTableQueryReturn<
  TFilters extends Record<string, any> = Record<string, any>,
> {
  /**
   * Current operating mode ("server" | "client").
   */
  mode: "client" | "server";
  /**
   * Current filter state synchronized with URL query params.
   */
  filters: TFilters;
  /**
   * Immediate search input value for controlled input binding (prevents typing lag).
   */
  searchValue: string;
  /**
   * Handler for search input change events or direct string updates.
   */
  setSearchValue: (value: string | React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * Update a specific filter key immediately. In server mode, automatically resets page to 1.
   */
  setFilter: <TKey extends keyof TFilters>(
    key: TKey,
    value: TFilters[TKey] | undefined,
  ) => void;
  /**
   * Update multiple filter values at once. In server mode, automatically resets page to 1.
   */
  setFilters: (
    newFilters: Partial<TFilters> | ((prev: TFilters) => Partial<TFilters>),
  ) => void;
  /**
   * Reset all filters and pagination to defaults.
   */
  resetFilters: () => void;
  /**
   * Clear only the search query. In server mode, automatically resets page to 1.
   */
  clearSearch: () => void;
  /**
   * Whether any filter currently active differs from default values.
   */
  isFiltered: boolean;
  /**
   * Current 1-indexed page number (1, 2, 3...).
   */
  page: number;
  /**
   * Current page size.
   */
  pageSize: number;
  /**
   * Set 1-indexed page number directly.
   */
  setPage: (page: number) => void;
  /**
   * Set page size, automatically resetting page to 1.
   */
  setPageSize: (pageSize: number) => void;
  /**
   * TanStack Table 0-indexed pagination state: { pageIndex: page - 1, pageSize }.
   */
  pagination: PaginationState;
  /**
   * TanStack Table onPaginationChange callback handler.
   */
  onPaginationChange: (
    updater: PaginationState | ((prev: PaginationState) => PaginationState),
  ) => void;
  /**
   * Clean sanitized query parameters ready to pass directly to TanStack Query API hooks.
   * In server mode, includes { page, page_size, search, ...filters }.
   * In client mode, includes { search, ...filters } without page/page_size.
   */
  queryParams: TFilters & {
    page?: number;
    page_size?: number;
    search?: string;
  };
  /**
   * Spreadable helper taking API metadata and returning props directly consumable by `<DataTable />`.
   */
  paginationProps: (meta?: {
    total_count?: number;
    page_count?: number;
    total?: number;
    page?: number;
    page_size?: number;
  }) => {
    mode: "client" | "server";
    rowCount?: number;
    pageCount?: number;
    pagination: PaginationState;
    onPaginationChange: (
      updater: PaginationState | ((prev: PaginationState) => PaginationState),
    ) => void;
  };
}

function parseWindowSearch(): Record<string, any> {
  return typeof window === "undefined"
    ? {}
    : Object.fromEntries(new URLSearchParams(window.location.search));
}

export function useTableQuery<
  TFilters extends Record<string, any> = Record<string, any>,
>({
  mode = "server",
  defaultValues = {},
  defaultPage = 1,
  defaultPageSize = 10,
  debounceMs = 300,
  searchKey = "search",
  pageKey = "page",
  pageSizeKey = "page_size",
  syncToUrl = true,
  replace = true,
}: UseTableQueryOptions<TFilters> = {}): UseTableQueryReturn<TFilters> {
  let routerSearch: Record<string, any> | undefined;
  let routerNavigate: any = null;

  try {
    routerSearch = useSearch({ strict: false });
    routerNavigate = useNavigate();
  } catch {
    // Graceful fallback for non-router environments (tests, standalone modals)
  }

  const [fallbackSearch, setFallbackSearch] = React.useState(parseWindowSearch);
  const activeParams: Record<string, any> = !syncToUrl
    ? fallbackSearch
    : (routerSearch ?? fallbackSearch);

  // Directly derive pagination values without useMemo overhead
  const rawPage = Number(activeParams[pageKey]);
  const page =
    mode === "server" && rawPage >= 1 ? Math.floor(rawPage) : defaultPage;

  const rawSize = Number(activeParams[pageSizeKey]);
  const pageSize =
    mode === "server" && rawSize >= 1 ? Math.floor(rawSize) : defaultPageSize;

  // Memoize filters object to maintain referential stability for queries
  const filters: TFilters = React.useMemo(() => {
    const merged: Record<string, any> = { ...defaultValues };
    for (const [key, value] of Object.entries(activeParams)) {
      if (
        key !== pageKey &&
        key !== pageSizeKey &&
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        merged[key] = value;
      }
    }
    return merged as TFilters;
  }, [defaultValues, activeParams, pageKey, pageSizeKey]);

  // Synchronize search input without unnecessary effects
  const urlSearch =
    (activeParams[searchKey] as string | undefined) ??
    (defaultValues[searchKey]) ??
    "";
  const [searchValue, setSearchValueState] = React.useState<string>(urlSearch);
  const [prevUrlSearch, setPrevUrlSearch] = React.useState<string>(urlSearch);

  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearchValueState(urlSearch);
  }

  // Helper to commit param changes to router or window URL
  const applyParams = (
    updates: Record<string, any>,
    resetPage = false,
    replaceAll = false,
  ) => {
    const base = replaceAll ? {} : activeParams;
    const next = {
      ...base,
      ...(mode === "server" && resetPage
        ? { [pageKey]: 1, [pageSizeKey]: pageSize }
        : {}),
      ...updates,
    };
    const sanitized = sanitizeParams(next, defaultValues);

    if (mode === "server") {
      if (next[pageKey] !== undefined) sanitized[pageKey] = next[pageKey];
      if (next[pageSizeKey] !== undefined)
        sanitized[pageSizeKey] = next[pageSizeKey];
    }

    if (!syncToUrl) {
      setFallbackSearch(sanitized);
      return;
    }

    if (routerNavigate) {
      routerNavigate({ search: () => sanitized, replace });
    } else if (typeof window !== "undefined") {
      setFallbackSearch(sanitized);
      const query = new URLSearchParams(
        Object.entries(sanitized).filter(
          ([, v]) => v !== undefined && v !== null && v !== "",
        ) as [string, string][],
      ).toString();
      const newUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
      window.history[replace ? "replaceState" : "pushState"](null, "", newUrl);
    } else {
      setFallbackSearch(sanitized);
    }
  };

  // Re-use shared useDebounce hook with single effect for URL sync
  const debouncedSearch = useDebounce(searchValue, debounceMs);
  React.useEffect(() => {
    const trimmed = debouncedSearch.trim();
    const current = (
      (activeParams[searchKey] as string | undefined) ?? ""
    ).trim();
    if (trimmed !== current) {
      applyParams({ [searchKey]: trimmed || undefined }, true);
    }
  }, [debouncedSearch]);

  const setSearchValue = (
    value: string | React.ChangeEvent<HTMLInputElement>,
  ) => {
    setSearchValueState(typeof value === "string" ? value : value.target.value);
  };

  const setFilter = <TKey extends keyof TFilters>(
    key: TKey,
    value: TFilters[TKey] | undefined,
  ) => {
    if (String(key) === searchKey) {
      setSearchValueState(typeof value === "string" ? value : "");
    }
    applyParams({ [key]: value }, true);
  };

  const setFilters = (
    updater: Partial<TFilters> | ((prev: TFilters) => Partial<TFilters>),
  ) => {
    const updates = typeof updater === "function" ? updater(filters) : updater;
    if (searchKey in updates) {
      setSearchValueState(
        typeof updates[searchKey] === "string" ? updates[searchKey] : "",
      );
    }
    applyParams(updates, true);
  };

  const clearSearch = () => {
    setSearchValueState("");
    applyParams({ [searchKey]: undefined }, true);
  };

  const resetFilters = () => {
    const defaultSearch =
      (defaultValues[searchKey] as string | undefined) ?? "";
    setSearchValueState(defaultSearch);
    applyParams(
      {
        ...defaultValues,
        ...(mode === "server"
          ? { [pageKey]: defaultPage, [pageSizeKey]: defaultPageSize }
          : {}),
      },
      false,
      true,
    );
  };

  const setPage = (newPage: number) => {
    if (mode === "server") applyParams({ [pageKey]: Math.max(1, newPage) });
  };

  const setPageSize = (newPageSize: number) => {
    if (mode === "server")
      applyParams({ [pageSizeKey]: Math.max(1, newPageSize) }, true);
  };

  // TanStack Table 0-indexed pagination state
  const pagination: PaginationState = React.useMemo(
    () => ({
      pageIndex: Math.max(0, page - 1),
      pageSize,
    }),
    [page, pageSize],
  );

  const onPaginationChange = (
    updater: PaginationState | ((prev: PaginationState) => PaginationState),
  ) => {
    const next = typeof updater === "function" ? updater(pagination) : updater;
    if (next.pageSize !== pageSize) {
      setPageSize(next.pageSize);
    } else if (next.pageIndex + 1 !== page) {
      setPage(next.pageIndex + 1);
    }
  };

  // Direct boolean check without useMemo overhead
  const isFiltered = Object.entries(filters).some(([key, value]) => {
    const def = defaultValues[key as keyof TFilters];
    return (
      value !== def && value !== "" && value !== undefined && value !== null
    );
  });

  // Query parameters ready for TanStack Query API hooks
  const queryParams = React.useMemo(() => {
    const result: Record<string, any> = { ...filters };
    if (mode === "server") {
      result[pageKey] = page;
      result[pageSizeKey] = pageSize;
    }
    const currentSearch = (
      activeParams[searchKey] as string | undefined
    )?.trim();
    if (currentSearch) {
      result[searchKey] = currentSearch;
    } else {
      delete result[searchKey];
    }
    return result as TFilters & {
      page?: number;
      page_size?: number;
      search?: string;
    };
  }, [
    filters,
    mode,
    pageKey,
    page,
    pageSizeKey,
    pageSize,
    searchKey,
    activeParams,
  ]);

  // Factory function returning DataTable pagination props without useCallback overhead
  const paginationProps = (meta?: {
    total_count?: number;
    page_count?: number;
    total?: number;
    page?: number;
    page_size?: number;
  }) => {
    if (mode === "client") {
      return { mode: "client" as const, pagination, onPaginationChange };
    }
    const rowCount = meta?.total_count ?? meta?.total;
    const computedPageCount =
      meta?.page_count ??
      (rowCount !== undefined && pageSize > 0
        ? Math.max(1, Math.ceil(rowCount / pageSize))
        : undefined);

    return {
      mode: "server" as const,
      rowCount,
      pageCount: computedPageCount,
      pagination,
      onPaginationChange,
    };
  };

  return {
    mode,
    filters,
    searchValue,
    setSearchValue,
    setFilter,
    setFilters,
    resetFilters,
    clearSearch,
    isFiltered,
    page,
    pageSize,
    setPage,
    setPageSize,
    pagination,
    onPaginationChange,
    queryParams,
    paginationProps,
  };
}

export default useTableQuery;
