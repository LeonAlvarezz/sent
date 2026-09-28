import type { NavGroupConfig, NavItemConfig } from "../types";

/**
 * Recursively filters an individual NavItemConfig and its sub-items based on user role.
 * If the item defines `roles`, it will only be included if `role` is in `item.roles`.
 * If all sub-items of a container item (without its own path) are removed, the container is removed.
 */
export function filterNavItemByRole(
  item: NavItemConfig,
  role?: string,
): NavItemConfig | null {
  if (item.roles && item.roles.length > 0) {
    if (!role || !item.roles.includes(role)) {
      return null;
    }
  }

  if (item.items && item.items.length > 0) {
    const filteredSubItems = item.items
      .map((sub) => filterNavItemByRole(sub, role))
      .filter((sub): sub is NavItemConfig => sub !== null);

    if (filteredSubItems.length === 0 && !item.path) {
      return null;
    }

    return {
      ...item,
      items: filteredSubItems,
    };
  }

  return item;
}

/**
 * Filters a list of NavItemConfig items based on user role.
 */
export function filterNavItemsByRole(
  items: NavItemConfig[],
  role?: string,
): NavItemConfig[] {
  return items
    .map((item) => filterNavItemByRole(item, role))
    .filter((item): item is NavItemConfig => item !== null);
}

/**
 * Filters a list of NavGroupConfig groups based on user role.
 * Drops groups that specify `roles` not matching `role`, or whose items are all filtered out.
 */
export function filterNavByRole(
  groups: NavGroupConfig[],
  role?: string,
): NavGroupConfig[] {
  return groups
    .map((group) => {
      if (group.roles && group.roles.length > 0) {
        if (!role || !group.roles.includes(role)) {
          return null;
        }
      }

      const filteredItems = filterNavItemsByRole(group.items || [], role);
      if (filteredItems.length === 0) {
        return null;
      }

      return {
        ...group,
        items: filteredItems,
      };
    })
    .filter((group): group is NavGroupConfig => group !== null);
}

/**
 * Helper to determine if a user role satisfies an array of allowed roles.
 * Returns true if allowedRoles is empty or undefined.
 */
export function hasRequiredRole(
  role?: string,
  allowedRoles?: string[],
): boolean {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }
  return Boolean(role && allowedRoles.includes(role));
}
