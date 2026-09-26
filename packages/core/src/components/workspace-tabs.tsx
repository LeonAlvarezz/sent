import type { ChangeEvent, ReactNode } from "react";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Popover,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react";
import {
  CloseIcon,
  CloseCircleIcon as CloseOthersIcon,
  ArrowRightLinearIcon as ArrowRightIcon,
  TrashIcon,
  TabIcon,
  SearchIcon,
} from "./ui/icons";
import type { NavGroupConfig, NavItemConfig } from "../types";
import Button from "./ui/button";
import ContextMenu from "./ui/context-menu";
import { cn } from "../libs/cn";

import { useWorkspaceTabsStore } from "../store/workspace-tabs";

export interface WorkspaceTabItem {
  id: string;
  title: string;
  path: string;
  icon?: ReactNode;
}

export interface WorkspaceTabsProps {
  navGroups?: NavGroupConfig[];
  navItems?: NavItemConfig[];
  className?: string;
  children?: ReactNode;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  tabId: string;
}

export interface WorkspaceTabsContextValue {
  openTabs: WorkspaceTabItem[];
  pathname: string;
  activeTab?: WorkspaceTabItem;
  handleTabClick: (path: string) => void;
  handleCloseTab: (e: React.MouseEvent | null, path: string) => void;
  handleCloseOthers: (path: string) => void;
  handleCloseToRight: (path: string) => void;
  handleCloseAll: () => void;
  contextMenu: ContextMenuState;
  openContextMenu: (e: React.MouseEvent, path: string) => void;
  closeContextMenu: () => void;
  tabContainerRef: React.RefObject<HTMLDivElement | null>;
}

const WorkspaceTabsContext = createContext<
  WorkspaceTabsContextValue | undefined
>(undefined);

export function useWorkspaceTabsContext() {
  const context = useContext(WorkspaceTabsContext);
  if (!context) {
    throw new Error(
      "useWorkspaceTabsContext must be used within a <WorkspaceTabs> provider",
    );
  }
  return context;
}

function findNavInfo(
  path: string,
  navGroups?: NavGroupConfig[],
  navItems?: NavItemConfig[],
): { title: string; icon?: ReactNode } {
  const allItems: NavItemConfig[] = [
    ...(navItems || []),
    ...(navGroups?.flatMap((g) => g.items) || []),
  ];

  const searchList = (
    list: NavItemConfig[],
  ): { title: string; icon?: ReactNode } | null => {
    for (const item of list) {
      if (item.path === path) {
        return {
          title: typeof item.label === "string" ? item.label : String(item.id),
          icon: item.icon,
        };
      }
      if (item.items) {
        const found = searchList(item.items);
        if (found) return found;
      }
    }
    return null;
  };

  const match = searchList(allItems);
  if (match) return match;

  const segments = path.split("/").filter(Boolean);
  const raw = segments[segments.length - 1] || "Dashboard";
  const title =
    raw.charAt(0).toUpperCase() + raw.slice(1).replace(/[-_]/g, " ");

  return { title };
}

export interface WorkspaceTabContextMenuProps {
  className?: string;
}

export const WorkspaceTabContextMenu: React.FC<
  WorkspaceTabContextMenuProps
> = ({ className }) => {
  const {
    contextMenu,
    closeContextMenu,
    handleCloseTab,
    handleCloseOthers,
    handleCloseToRight,
    handleCloseAll,
  } = useWorkspaceTabsContext();

  return (
    <ContextMenu
      open={contextMenu.visible}
      onClose={closeContextMenu}
      position={{ x: contextMenu.x, y: contextMenu.y }}
      className={className}
    >
      <ContextMenu.Item
        onClick={() => handleCloseTab(null, contextMenu.tabId)}
        icon={<CloseIcon />}
      >
        Close Tab
      </ContextMenu.Item>
      <ContextMenu.Item
        onClick={() => handleCloseOthers(contextMenu.tabId)}
        icon={<CloseOthersIcon />}
      >
        Close Other Tabs
      </ContextMenu.Item>
      <ContextMenu.Item
        onClick={() => handleCloseToRight(contextMenu.tabId)}
        icon={<ArrowRightIcon />}
      >
        Close to the Right
      </ContextMenu.Item>
      <ContextMenu.Separator />
      <ContextMenu.Item
        variant="destructive"
        onClick={handleCloseAll}
        icon={<TrashIcon />}
      >
        Close All Tabs
      </ContextMenu.Item>
    </ContextMenu>
  );
};

export interface WorkspaceTabItemProps {
  tab: WorkspaceTabItem;
  className?: string;
}

export const WorkspaceTabItem: React.FC<WorkspaceTabItemProps> = ({
  tab,
  className,
}) => {
  const {
    openTabs,
    pathname,
    handleTabClick,
    handleCloseTab,
    openContextMenu,
  } = useWorkspaceTabsContext();
  const isActive = tab.path === pathname;

  return (
    <div
      onClick={() => handleTabClick(tab.path)}
      onContextMenu={(e) => openContextMenu(e, tab.path)}
      className={cn(
        "group relative flex items-center gap-2 min-h-9 py-2 pl-3 pr-2 text-xs font-medium cursor-pointer transition-all rounded-t-lg shrink-0 select-none",
        isActive
          ? "bg-background text-foreground border-t border-x border-border border-b-background shadow-xs -mb-px font-semibold"
          : "bg-transparent text-muted-foreground border-transparent hover:bg-accent/40 hover:text-accent-foreground",
        className,
      )}
    >
      {tab.icon && (
        <span className="shrink-0 size-3.5 flex items-center justify-center text-muted-foreground group-hover:text-foreground">
          {tab.icon}
        </span>
      )}

      <span className="truncate max-w-32">{tab.title}</span>

      {openTabs.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e: React.MouseEvent) => handleCloseTab(e, tab.path)}
          className="size-fit p-1 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
          title="Close tab"
        >
          <CloseIcon className="size-3 shrink-0" />
        </Button>
      )}
    </div>
  );
};

export interface WorkspaceTabsListProps {
  className?: string;
  children?: ReactNode;
}

export const WorkspaceTabsList: React.FC<WorkspaceTabsListProps> = ({
  className,
  children,
}) => {
  const { openTabs, tabContainerRef } = useWorkspaceTabsContext();

  return (
    <div
      ref={tabContainerRef}
      className={cn(
        "flex items-center gap-1 scroll-fade-x overflow-x-auto overflow-y-hidden scrollbar-none flex-1 pr-2",
        className,
      )}
    >
      {children
        ? children
        : openTabs.map((tab) => <WorkspaceTabItem key={tab.id} tab={tab} />)}
    </div>
  );
};

export interface WorkspaceTabDropdownProps {
  className?: string;
}

export const WorkspaceTabDropdown: React.FC<WorkspaceTabDropdownProps> = ({
  className,
}) => {
  const { openTabs, pathname, handleTabClick, handleCloseTab } =
    useWorkspaceTabsContext();
  const [dropdownSearch, setDropdownSearch] = useState("");

  const filteredDropdownTabs = openTabs.filter((t) =>
    t.title.toLowerCase().includes(dropdownSearch.toLowerCase()),
  );

  return (
    <Popover className={cn("relative shrink-0 pb-1 ml-auto", className)}>
      {({ open, close }) => (
        <>
          <PopoverButton
            as={Button}
            variant="outline"
            size="sm"
            className={cn(
              "h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap",
              open
                ? "bg-accent border-accent text-accent-foreground shadow-2xs font-semibold"
                : "bg-background/80 hover:bg-accent border-border/80 text-muted-foreground hover:text-foreground",
            )}
            title="All Open Tabs"
          >
            <TabIcon className="size-3.5 shrink-0" />
            <span className="shrink-0">{openTabs.length} Tabs</span>
            <span className="text-[10px] shrink-0">▾</span>
          </PopoverButton>

          {/* DROPDOWN MENU POPUP */}
          <PopoverPanel
            transition
            anchor={{ to: "bottom end", gap: 8 }}
            className="z-50 w-64 rounded-xl border border-border bg-popover py-3 px-1 shadow-xl flex flex-col gap-1.5 transition duration-100 ease-out focus:outline-none data-closed:scale-95 data-closed:opacity-0"
          >
            <div className="px-3 py-1 flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                Open Tabs ({openTabs.length})
              </span>
            </div>

            <Combobox
              value={null}
              onChange={(tab: WorkspaceTabItem | null) => {
                if (tab) {
                  handleTabClick(tab.path);
                  close();
                  setDropdownSearch("");
                }
              }}
              onClose={() => setDropdownSearch("")}
            >
              <div className="relative mx-2 flex gap-2 py-1.5 px-2.5 rounded-lg items-center input-focus border">
                <SearchIcon className="pointer-events-none size-3.5 text-muted-foreground shrink-0" />
                <ComboboxInput
                  autoFocus
                  placeholder="Search tabs..."
                  value={dropdownSearch}
                  className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setDropdownSearch(e.target.value)
                  }
                />
              </div>

              <ComboboxOptions
                static
                className="max-h-48 overflow-y-auto flex flex-col focus:outline-none px-1 py-1"
              >
                {filteredDropdownTabs.length === 0 ? (
                  <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                    No matching tabs
                  </div>
                ) : (
                  filteredDropdownTabs.map((t) => {
                    const isActive = t.path === pathname;
                    return (
                      <ComboboxOption
                        key={t.id}
                        value={t}
                        className={cn(
                          "group/option px-2.5 py-1.5 text-xs rounded-md flex items-center justify-between cursor-pointer transition-colors select-none data-focus:bg-accent data-focus:text-accent-foreground",
                          isActive
                            ? "bg-accent/40 font-semibold text-primary"
                            : "text-foreground",
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {t.icon && (
                            <span className="size-3.5 shrink-0 flex items-center justify-center text-muted-foreground group-data-focus/option:text-foreground">
                              {t.icon}
                            </span>
                          )}
                          <span className="truncate">{t.title}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {openTabs.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleCloseTab(e, t.path);
                              }}
                              className="opacity-0 group-hover/option:opacity-100 group-data-focus/option:opacity-100 size-4 rounded-sm hover:text-destructive hover:bg-destructive/10 text-muted-foreground shrink-0 transition-opacity"
                              title="Close tab"
                            >
                              <CloseIcon className="size-3 shrink-0" />
                            </Button>
                          )}
                        </div>
                      </ComboboxOption>
                    );
                  })
                )}
              </ComboboxOptions>
            </Combobox>
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
};

export interface WorkspaceTabsActionsProps {
  className?: string;
  children?: ReactNode;
}

export const WorkspaceTabsActions: React.FC<WorkspaceTabsActionsProps> = ({
  className,
  children,
}) => {
  return (
    <div className={cn("flex items-center gap-1.5 shrink-0 pb-1", className)}>
      {children}
    </div>
  );
};

export interface WorkspaceTabsComponent extends React.FC<WorkspaceTabsProps> {
  List: typeof WorkspaceTabsList;
  Item: typeof WorkspaceTabItem;
  Dropdown: typeof WorkspaceTabDropdown;
  ContextMenu: typeof WorkspaceTabContextMenu;
  Actions: typeof WorkspaceTabsActions;
}

export const WorkspaceTabs: WorkspaceTabsComponent = ({
  navGroups,
  navItems,
  className,
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const tabContainerRef = useRef<HTMLDivElement>(null);

  const { tabPaths, openTab, closeTab, closeOthers, closeToRight, closeAll } =
    useWorkspaceTabsStore();

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    tabId: "",
  });

  // Automatically track route changes and open tabs
  useEffect(() => {
    if (!pathname || pathname === "/login") return;
    openTab(pathname);
  }, [pathname, openTab]);

  const openTabs: WorkspaceTabItem[] = React.useMemo(() => {
    const paths =
      tabPaths.length > 0
        ? tabPaths
        : pathname && pathname !== "/login"
          ? [pathname]
          : [];

    return paths.map((path) => {
      const navInfo = findNavInfo(path, navGroups, navItems);
      return {
        id: path,
        path,
        title: navInfo.title,
        icon: navInfo.icon,
      };
    });
  }, [tabPaths, pathname, navGroups, navItems]);

  // Don't render tab bar if no open tabs
  if (openTabs.length === 0) return null;

  const handleTabClick = (tabPath: string) => {
    if (tabPath !== pathname) {
      navigate({ to: tabPath });
    }
  };

  const handleCloseTab = (e: React.MouseEvent | null, tabPath: string) => {
    if (e) e.stopPropagation();
    if (openTabs.length <= 1) return;

    const remaining = tabPaths.filter((t) => t !== tabPath);
    closeTab(tabPath);

    // If active tab closed, navigate to closest tab
    if (tabPath === pathname) {
      const target = remaining[remaining.length - 1] || remaining[0];
      if (target) {
        navigate({ to: target });
      }
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleCloseOthers = (tabPath: string) => {
    closeOthers(tabPath);
    if (pathname !== tabPath) {
      navigate({ to: tabPath });
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleCloseToRight = (tabPath: string) => {
    const index = tabPaths.indexOf(tabPath);
    if (index !== -1) {
      const remaining = tabPaths.slice(0, index + 1);
      closeToRight(tabPath);
      if (!remaining.includes(pathname)) {
        navigate({ to: tabPath });
      }
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleCloseAll = () => {
    if (openTabs.length > 0) {
      const first = openTabs[0].path;
      closeAll(first);
      if (pathname !== first) {
        navigate({ to: first });
      }
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const openContextMenu = (e: React.MouseEvent, tabPath: string) => {
    e.preventDefault();
    const menuWidth = 190;
    const menuHeight = 160;
    const posX =
      typeof window !== "undefined"
        ? Math.max(8, Math.min(e.clientX, window.innerWidth - menuWidth - 8))
        : e.clientX;
    const posY =
      typeof window !== "undefined"
        ? Math.max(8, Math.min(e.clientY, window.innerHeight - menuHeight - 8))
        : e.clientY;

    setContextMenu({
      visible: true,
      x: posX,
      y: posY,
      tabId: tabPath,
    });
  };

  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const activeTab = openTabs.find((t) => t.path === pathname);

  const contextValue: WorkspaceTabsContextValue = {
    openTabs,
    pathname,
    activeTab,
    handleTabClick,
    handleCloseTab,
    handleCloseOthers,
    handleCloseToRight,
    handleCloseAll,
    contextMenu,
    openContextMenu,
    closeContextMenu,
    tabContainerRef,
  };

  return (
    <WorkspaceTabsContext.Provider value={contextValue}>
      <div
        className={cn(
          "bg-card border-b border-border pt-2 px-2 sm:px-4 flex items-center justify-between gap-2 relative select-none shrink-0 min-w-0 w-full overflow-hidden",
          className,
        )}
      >
        {children ? (
          <>
            {children}
            <WorkspaceTabContextMenu />
          </>
        ) : (
          <>
            <WorkspaceTabsList />
            <WorkspaceTabDropdown />
            <WorkspaceTabContextMenu />
          </>
        )}
      </div>
    </WorkspaceTabsContext.Provider>
  );
};

WorkspaceTabs.List = WorkspaceTabsList;
WorkspaceTabs.Item = WorkspaceTabItem;
WorkspaceTabs.Dropdown = WorkspaceTabDropdown;
WorkspaceTabs.ContextMenu = WorkspaceTabContextMenu;
WorkspaceTabs.Actions = WorkspaceTabsActions;

export default WorkspaceTabs;
