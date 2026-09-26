import { useLocation } from "@tanstack/react-router";
import type { NavItemConfig } from "../types";

export interface UseActiveUrlOptions {
  exact?: boolean;
}

export function useActiveUrl() {
  let pathname = "";

  try {
    const location = useLocation();
    pathname = location.pathname;
  } catch {

    // Fallback to window.location if router context is absent
    if (typeof window !== "undefined") {
      pathname = window.location.pathname;
    }
  }

  /**
   * Checks if a target path matches the current active pathname.
   */
  const isActivePath = (
    targetPath?: string,
    exact: boolean = false,
  ): boolean => {
    if (!targetPath) return false;
    if (exact) return pathname === targetPath;
    if (targetPath === "/") return pathname === "/";
    return (
      pathname === targetPath ||
      pathname.startsWith(
        targetPath.endsWith("/") ? targetPath : targetPath + "/",
      )
    );
  };

  /**
   * Checks if any item or sub-item in an items array matches the active route.
   */
  const isItemActive = (items?: NavItemConfig[]): boolean => {
    if (!items || items.length === 0) return false;
    return items.some(
      (item) =>
        item.active || isActivePath(item.path) || isItemActive(item.items),
    );
  };

  /**
   * Checks if current path matches a regex pattern or string prefix.
   */
  const matchesPattern = (pattern: string | RegExp): boolean => {
    if (pattern instanceof RegExp) {
      return pattern.test(pathname);
    }
    return isActivePath(pattern);
  };

  return {
    pathname,
    isActivePath,
    isItemActive,
    matchesPattern,
  };
}

export default useActiveUrl;
