import type { LinkProps, RegisteredRouter } from "@tanstack/react-router";
import type React from "react";

type RoutePath =
  RegisteredRouter["routeTree"]["types"]["fileRouteTypes"] extends {
    to: infer TPath extends string;
  }
    ? TPath | (string & {})
    : string;

// eslint-disable-next-line @typescript-eslint/naming-convention
export type ApiResult<T, E = Error> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: E };

export interface NavItemConfig {
  id: string;
  label: React.ReactNode;
  path?: RoutePath;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  active?: boolean;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  items?: NavItemConfig[];
}

export interface NavGroupConfig {
  id?: string;
  title?: string;
  items: NavItemConfig[];
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
}

export interface UserMenuItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  href?: RoutePath;
  onClick?: () => void;
  variant?: "default" | "destructive";
}

export interface SideBarProps {
  title?: string;
  logo?: React.ReactNode;
  navGroups?: NavGroupConfig[];
  navItems?: NavItemConfig[];
  footerNavItems?: NavItemConfig[];
  user?: UserProfile;
  userMenuItems?: UserMenuItem[];
  onSignOut?: () => void;
  sidebarFooter?: React.ReactNode;
  children?: React.ReactNode;
}

export interface AdminLayoutProps {
  title?: string;
  logo?: React.ReactNode;
  navGroups?: NavGroupConfig[];
  navItems?: NavItemConfig[];
  footerNavItems?: NavItemConfig[];
  user?: UserProfile;
  userMenuItems?: UserMenuItem[];
  onSignOut?: () => void;
  headerActions?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  sidebar?: React.ReactNode;
  commandGroups?: CommandGroup[];
  commandItems?: CommandItem[];
  enableTabs?: boolean;
  children: React.ReactNode;
}

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  category?: string;
  icon?: React.ReactNode;
  path?: RoutePath;
  onSelect?: () => void;
  keywords?: string[];
  shortcut?: string[];
  badge?: React.ReactNode;
}

export interface CommandGroup {
  id: string;
  title?: string;
  items: CommandItem[];
}

export interface CommandSearchProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  groups?: CommandGroup[];
  items?: CommandItem[];
  navGroups?: NavGroupConfig[];
  navItems?: NavItemConfig[];
  onSignOut?: () => void;
  placeholder?: string;
  emptyText?: string;
}

export interface CommandSearchContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  registeredCommands: CommandItem[];
  registerCommands: (commands: CommandItem[]) => () => void;
  unregisterCommands: (ids: string[]) => void;
}
