import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Button from "./ui/button";
import Input from "./ui/input";
import Keyboard from "./ui/keyboard";
import NavItem from "./ui/nav-item";
import Avatar from "./ui/avatar";
import { cn } from "../libs/cn";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

import {
  SearchIcon,
  DashboardIcon,
  ShopIcon,
  SidebarCollapseIcon as CuidaSideBarCollapse,
  SidebarExpandIcon as CuidaSideBarExpand,
  SettingsAltIcon as GearIcon,
  TimeIcon,
  MoonIcon,
  LogoutIcon,
  ChevronUpIcon,
} from "./ui/icons";

import type {
  NavGroupConfig,
  NavItemConfig,
  SideBarProps,
  UserMenuItem,
  UserProfile,
} from "../types";
import ThemeSwitch from "./theme-switch";
import { useCommandSearch } from "./ui/command-search";
import Drawer from "./ui/drawer";
import MobileNav from "./mobile-nav";

interface SidebarContextValue {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(
  undefined,
);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  return context;
}

function SideBarHeader({
  title = "ZeroUI",
  logo,
  children,
  className,
}: {
  title?: ReactNode;
  logo?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const context = useSidebarContext();
  const commandSearch = useCommandSearch();
  const isCollapsed = context?.isCollapsed ?? false;
  const setIsCollapsed = context?.setIsCollapsed ?? (() => {});

  return (
    <header className={cn("px-4 flex flex-col gap-4 shrink-0", className)}>
      <div className="flex justify-between group-data-[collapsed=true]:justify-center">
        {logo ? (
          logo
        ) : (
          <p className="text-foreground font-semibold text-lg whitespace-nowrap overflow-hidden transition-opacity duration-150 group-data-[collapsed=true]:w-0 group-data-[collapsed=true]:opacity-0 group-data-[collapsed=true]:pointer-events-none">
            {title}
          </p>
        )}
        <Button
          variant="ghost"
          className="h-fit w-fit py-1 px-1"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <CuidaSideBarExpand /> : <CuidaSideBarCollapse />}
        </Button>
      </div>
      {children ? (
        children
      ) : (
        <div
          className="group-data-[collapsed=true]:hidden"
          onClick={commandSearch?.open}
        >
          <Input
            readOnly
            onClick={commandSearch?.open}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                commandSearch?.open();
              }
            }}
            containerClassName="cursor-pointer"
            className="cursor-pointer"
            startIcon={<SearchIcon />}
            endIcon={<Keyboard keys={["command", "k"]} />}
          />
        </div>
      )}
    </header>
  );
}

function SideBarNav({
  groups,
  items,
  className,
}: {
  groups?: NavGroupConfig[];
  items?: NavItemConfig[];
  className?: string;
}) {
  const navGroups: NavGroupConfig[] =
    groups ??
    (items && items.length > 0
      ? [{ items }]
      : [
          {
            items: [
              {
                id: "dashboard",
                label: "Dashboard",
                path: "/",
                icon: <DashboardIcon />,
              },
              { id: "shop", label: "Shop", path: "/shop", icon: <ShopIcon /> },
              {
                id: "schedule",
                label: "Schedule",
                path: "/schedule",
                icon: <TimeIcon />,
              },
              {
                id: "settings",
                label: "Settings",
                path: "/settings",
                icon: <GearIcon />,
              },
            ],
          },
        ]);

  return (
    <nav
      className={cn(
        "mt-4 flex flex-col gap-4 flex-1 overflow-y-auto min-h-0",
        className,
      )}
    >
      {navGroups.map((group, groupIdx) => (
        <div key={group.id || groupIdx} className="flex flex-col gap-1">
          {group.title && (
            <p className="px-4 text-muted text-xs tracking-wider font-semibold group-data-[collapsed=true]:hidden mb-1">
              {group.title}
            </p>
          )}
          <ul className="flex flex-col gap-1 px-3 group-data-[collapsed=true]:px-2">
            {group.items.map((item) => (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={item.active}
                action={item.action}
                badge={item.badge}
                href={item.path}
                items={item.items}
                defaultOpen={item.defaultOpen}
              />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SideBarFooter({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <footer className={cn("mt-auto shrink-0", className)}>
      <hr className="border-border/70 my-4 group-data-[collapsed=true]:mx-2" />
      <NavItem label="Dark Mode" className="px-5 my-1" icon={<MoonIcon />}>
        <NavItem.Action>
          <ThemeSwitch />
        </NavItem.Action>
      </NavItem>
      {children}
    </footer>
  );
}

function SideBarUserMenu({
  user = { name: "Leon", email: "leon@zeroui.com" },
  menuItems = [],
  onSignOut,
  className,
}: {
  menuItems?: UserMenuItem[];
  user?: UserProfile;
  onSignOut?: () => void;
  className?: string;
}) {
  return (
    <Menu as="div" className={cn("px-3", className)}>
      <MenuButton className="w-full flex items-center justify-between py-2 px-2 rounded-md hover:bg-accent cursor-pointer transition-colors group-data-[collapsed=true]:justify-center focus:outline-none">
        <div className="flex gap-2.5 items-center min-w-0">
          <Avatar
            src={user.avatarUrl}
            className="group-data-[collapsed=true]:size-6"
          />
          <div className="flex flex-col text-left group-data-[collapsed=true]:hidden min-w-0">
            <span className="text-sm font-medium text-foreground truncate">
              {user.name}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {user.email}
            </span>
          </div>
        </div>
        <ChevronUpIcon className="size-4 text-muted-foreground group-data-[collapsed=true]:hidden shrink-0" />
      </MenuButton>
      <MenuItems
        transition
        anchor={{ to: "top start", gap: 12 }}
        className="w-(--button-width) min-w-48 z-50 rounded-lg border border-border/40 bg-card p-2 text-popover-foreground shadow-lg focus:outline-none transition duration-150 ease-out data-closed:scale-95 data-closed:opacity-0 origin-bottom"
      >
        {menuItems.length > 0 &&
          menuItems.map((item) => (
            <MenuItem key={item.id}>
              {item.href ? (
                <a
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent data-focus:bg-accent whitespace-nowrap"
                  href={item.href}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap cursor-pointer hover:bg-accent data-focus:bg-accent",
                    item.variant === "destructive"
                      ? "text-red-400"
                      : "text-foreground",
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              )}
            </MenuItem>
          ))}
        {menuItems.length > 0 && <hr className="my-1 border-border/40" />}
        {onSignOut && (
          <MenuItem>
            <button
              type="button"
              onClick={onSignOut}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 hover:bg-accent data-focus:bg-accent cursor-pointer whitespace-nowrap"
            >
              <LogoutIcon className="size-4 shrink-0" />
              <span>Sign out</span>
            </button>
          </MenuItem>
        )}
      </MenuItems>
    </Menu>
  );
}

function SideBarRoot({
  title = "ZeroUI",
  logo,
  navGroups,
  navItems,
  footerNavItems,
  user,
  userMenuItems,
  onSignOut,
  sidebarFooter,
  children,
}: SideBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      {/* Desktop Sidebar */}
      <aside
        data-collapsed={isCollapsed}
        className="hidden md:flex border-r-[0.5px] border-border z-10 text-foreground group h-svh shrink-0 flex-col w-80 data-[collapsed=true]:w-16 bg-card data-[collapsed=true]:px-0 py-4 transition-all duration-200"
      >
        <div className="flex flex-col flex-1 gap-2 min-h-0">
          {children ? (
            children
          ) : (
            <>
              <SideBarHeader title={title} logo={logo} />
              <SideBarNav groups={navGroups} items={navItems} />
              {sidebarFooter ? (
                sidebarFooter
              ) : (
                <SideBarFooter>
                  {footerNavItems && footerNavItems.length > 0 && (
                    <ul className="flex flex-col gap-1 my-2 px-3 group-data-[collapsed=true]:px-2">
                      {footerNavItems.map((item) => (
                        <NavItem
                          key={item.id}
                          icon={item.icon}
                          label={item.label}
                          active={item.active}
                          action={item.action}
                          badge={item.badge}
                          href={item.path}
                          items={item.items}
                          defaultOpen={item.defaultOpen}
                        />
                      ))}
                    </ul>
                  )}
                  <SideBarUserMenu
                    user={user}
                    menuItems={userMenuItems ?? []}
                    onSignOut={onSignOut}
                  />
                </SideBarFooter>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Mobile Responsive Navigation (Bottom Dock + Bottom Sheet) */}
      <MobileNav
        navGroups={navGroups}
        navItems={navItems}
        footerNavItems={footerNavItems}
        user={user}
        userMenuItems={userMenuItems}
        onSignOut={onSignOut}
        sidebarFooter={sidebarFooter}
      />
    </SidebarContext.Provider>
  );
}

export const SideBar = Object.assign(SideBarRoot, {
  Header: SideBarHeader,
  Nav: SideBarNav,
  Footer: SideBarFooter,
  UserMenu: SideBarUserMenu,
  Item: NavItem,
});

export default SideBar;
