import * as React from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

export interface UseQueryFiltersOptions<TFilters extends Record<string, any>> {
  /**
   * Default values for filters when not present in the URL query string.
   */
  defaultValues?: Partial<TFilters>;
  /**
   * Debounce delay in milliseconds for search input.
   * @default 300
   */
  debounceMs?: number;
  /**
   * The search field key inside TFilters (e.g. 'search' or 'q').
   * @default 'search'
   */
  searchKey?: keyof TFilters & string;
  /**
   * Whether to replace the browser history entry instead of pushing a new one.
   * @default true
   */
  replace?: boolean;
}

export interface UseQueryFiltersReturn<TFilters extends Record<string, any>> {
  /**
   * Current filter state synchronized with URL query params, ready to pass to data queries.
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
   * Update a specific filter key immediately (e.g. setFilter("role", "admin")).
   */
  setFilter: <TKey extends keyof TFilters>(key: TKey, value: TFilters[TKey] | undefined) => void;
  /**
   * Update multiple filter values at once.
   */
  setFilters: (newFilters: Partial<TFilters> | ((prev: TFilters) => Partial<TFilters>)) => void;
  /**
   * Reset all filters to their default values and clean URL params.
   */
  resetFilters: () => void;
  /**
   * Clear only the search query.
   */
  clearSearch: () => void;
  /**
   * Whether any filter currently active differs from default values.
   */
  isFiltered: boolean;
}

function parseWindowSearch(): Record<string, any> {
  if (typeof window === "undefined") return {};
  const searchParams = new URLSearchParams(window.location.search);
  const result: Record<string, any> = {};
  searchParams.forEach((val, key) => {
    result[key] = val;
  });
  return result;
}

/**
 * Filter out undefined, null, empty strings, and default values to keep URL clean.
 */
export function sanitizeParams(
  params: Record<string, any>,
  defaults: Record<string, any> = {},
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (defaults[key] !== undefined && value === defaults[key]) continue;
    result[key] = value;
  }
  return result;
}

export function useQueryFilters<TFilters extends Record<string, any> = Record<string, any>>({
  defaultValues = {},
  debounceMs = 300,
  searchKey = "search",
  replace = true,
}: UseQueryFiltersOptions<TFilters> = {}): UseQueryFiltersReturn<TFilters> {
  // Gracefully attempt to use TanStack Router hooks
  let routerSearch: Record<string, any> | undefined;
  let routerNavigate: any = null;

  try {
    routerSearch = useSearch({ strict: false });
    routerNavigate = useNavigate();
  } catch {
    // Non-router context or fallback
    routerSearch = undefined;
    routerNavigate = null;
  }

  // Active query params from router or window.location
  const [localFallbackSearch, setLocalFallbackSearch] = React.useState<Record<string, any>>(() =>
    parseWindowSearch(),
  );

  const activeUrlParams: Record<string, any> = React.useMemo(() => {
    return routerSearch ?? localFallbackSearch;
  }, [routerSearch, localFallbackSearch]);

  // Merge default values with active URL params to form current filters
  const filters: TFilters = React.useMemo(() => {
    const merged: Record<string, any> = { ...defaultValues };
    for (const [key, value] of Object.entries(activeUrlParams)) {
      if (value !== undefined && value !== null && value !== "") {
        merged[key] = value;
      }
    }
    return merged as TFilters;
  }, [defaultValues, activeUrlParams]);

  // Immediate search value for responsive typing
  const initialSearch = (activeUrlParams[searchKey] as string | undefined) ?? defaultValues[searchKey] ?? "";
  const [searchValue, setSearchValueState] = React.useState<string>(initialSearch);

  // Track the last search value written to the URL to prevent overwriting typing during re-renders
  const lastWrittenSearchRef = React.useRef<string>(initialSearch);

  // Sync search input if URL changed externally (e.g. browser back/forward or programmatic navigate)
  const currentUrlSearch = (activeUrlParams[searchKey] as string | undefined) ?? defaultValues[searchKey] ?? "";
  React.useEffect(() => {
    if (currentUrlSearch !== lastWrittenSearchRef.current) {
      setSearchValueState(currentUrlSearch);
      lastWrittenSearchRef.current = currentUrlSearch;
    }
  }, [currentUrlSearch]);

  // Internal function to update URL/state
  const applyParams = React.useCallback(
    (newParams: Record<string, any>) => {
      const sanitized = sanitizeParams(newParams, defaultValues);

      if (routerNavigate) {
        routerNavigate({
          search: () => sanitized,
          replace,
        });
      } else if (typeof window !== "undefined") {
        setLocalFallbackSearch(sanitized);
        const searchParams = new URLSearchParams();
        Object.entries(sanitized).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") {
            searchParams.set(k, String(v));
          }
        });
        const query = searchParams.toString();
        const newUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
        if (replace) {
          window.history.replaceState(null, "", newUrl);
        } else {
          window.history.pushState(null, "", newUrl);
        }
      } else {
        setLocalFallbackSearch(sanitized);
      }
    },
    [routerNavigate, replace, defaultValues],
  );

  // Debounced effect for search input writing to URL
  React.useEffect(() => {
    if (searchValue === lastWrittenSearchRef.current) return;

    const timer = setTimeout(() => {
      lastWrittenSearchRef.current = searchValue;
      const next = {
        ...activeUrlParams,
        [searchKey]: searchValue || undefined,
      };
      applyParams(next);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchValue, debounceMs, searchKey, activeUrlParams, applyParams]);

  // Handler for search input
  const setSearchValue = React.useCallback(
    (value: string | React.ChangeEvent<HTMLInputElement>) => {
      const text = typeof value === "string" ? value : value.target.value;
      setSearchValueState(text);
    },
    [],
  );

  // Update a single filter immediately
  const setFilter = React.useCallback(
    <TKey extends keyof TFilters>(key: TKey, value: TFilters[TKey] | undefined) => {
      const keyStr = String(key);
      const next = {
        ...activeUrlParams,
        [keyStr]: value,
      };
      if (keyStr === searchKey) {
        const text = typeof value === "string" ? value : "";
        setSearchValueState(text);
        lastWrittenSearchRef.current = text;
      }
      applyParams(next);
    },
    [activeUrlParams, searchKey, applyParams],
  );

  // Update multiple filters
  const setFilters = React.useCallback(
    (updater: Partial<TFilters> | ((prev: TFilters) => Partial<TFilters>)) => {
      const updates = typeof updater === "function" ? updater(filters) : updater;
      const next = {
        ...activeUrlParams,
        ...updates,
      };
      if (searchKey in updates) {
        const text = typeof updates[searchKey] === "string" ? (updates[searchKey] as string) : "";
        setSearchValueState(text);
        lastWrittenSearchRef.current = text;
      }
      applyParams(next);
    },
    [filters, activeUrlParams, searchKey, applyParams],
  );

  // Reset all filters to default
  const resetFilters = React.useCallback(() => {
    const defaultSearch = defaultValues[searchKey] ?? "";
    setSearchValueState(defaultSearch);
    lastWrittenSearchRef.current = defaultSearch;
    applyParams({ ...defaultValues });
  }, [defaultValues, searchKey, applyParams]);

  // Clear only the search query
  const clearSearch = React.useCallback(() => {
    const defaultSearch = defaultValues[searchKey] ?? "";
    setSearchValueState(defaultSearch);
    lastWrittenSearchRef.current = defaultSearch;
    const next = {
      ...activeUrlParams,
      [searchKey]: undefined,
    };
    applyParams(next);
  }, [defaultValues, searchKey, activeUrlParams, applyParams]);

  // Check if any filter differs from defaultValues
  const isFiltered = React.useMemo(() => {
    for (const [key, value] of Object.entries(filters)) {
      const defVal = defaultValues[key as keyof TFilters];
      if (value !== defVal && value !== "" && value !== undefined && value !== null) {
        return true;
      }
    }
    return false;
  }, [filters, defaultValues]);

  return {
    filters,
    searchValue,
    setSearchValue,
    setFilter,
    setFilters,
    resetFilters,
    clearSearch,
    isFiltered,
  };
}

export const useTableFilters = useQueryFilters;
export default useQueryFilters;
