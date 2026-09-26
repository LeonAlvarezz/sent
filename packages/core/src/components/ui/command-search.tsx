import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
} from "@headlessui/react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "../../libs/cn";
import Keyboard from "./keyboard";
import { useTheme } from "../../hooks/theme";
import type {
  CommandGroup,
  CommandItem,
  CommandSearchContextValue,
  CommandSearchProps,
  NavGroupConfig,
  NavItemConfig,
} from "../../types";

import {
  SearchIcon,
  MoonIcon,
  SunIcon,
  LogoutIcon,
  ArrowRightIcon,
  CommandIcon,
} from "./icons";

const CommandSearchContext = createContext<
  CommandSearchContextValue | undefined
>(undefined);

export function useCommandSearch() {
  const context = useContext(CommandSearchContext);
  return context;
}

export function CommandSearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [registeredCommands, setRegisteredCommands] = useState<CommandItem[]>(
    [],
  );

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  const unregisterCommands = (ids: string[]) => {
    setRegisteredCommands((prev) =>
      prev.filter((cmd) => !ids.includes(cmd.id)),
    );
  };

  const registerCommands = (commands: CommandItem[]) => {
    setRegisteredCommands((prev) => {
      const existingIds = new Set(prev.map((c) => c.id));
      const newCommands = commands.filter((c) => !existingIds.has(c.id));
      return [...prev, ...newCommands];
    });

    return () => {
      const idsToUnregister = commands.map((c) => c.id);
      unregisterCommands(idsToUnregister);
    };
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <CommandSearchContext.Provider
      value={{
        isOpen,
        open,
        close,
        toggle,
        registeredCommands,
        registerCommands,
        unregisterCommands,
      }}
    >
      {children}
    </CommandSearchContext.Provider>
  );
}

export function useRegisterCommands(commands: CommandItem[]) {
  const context = useContext(CommandSearchContext);

  useEffect(() => {
    if (!context || commands.length === 0) return;
    const unregister = context.registerCommands(commands);
    return unregister;
  }, [context, commands]);
}

function extractNavCommands(
  navGroups?: NavGroupConfig[],
  navItems?: NavItemConfig[],
): CommandItem[] {
  const commands: CommandItem[] = [];

  const processItem = (
    item: NavItemConfig,
    parentLabel?: string,
    groupTitle?: string,
  ) => {
    const fullCategory = parentLabel
      ? `${groupTitle ? `${groupTitle} > ` : ""}${parentLabel}`
      : groupTitle;

    if (item.path) {
      commands.push({
        id: `nav-${item.id}-${item.path}`,
        label: String(item.label),
        category: fullCategory || "Navigation",
        icon: item.icon || (
          <ArrowRightIcon className="size-4 text-muted-foreground" />
        ),
        path: item.path,
        badge: item.badge,
      });
    }

    if (item.items && item.items.length > 0) {
      const currentParent = String(item.label);
      item.items.forEach((child) =>
        processItem(child, currentParent, groupTitle),
      );
    }
  };

  if (navGroups && navGroups.length > 0) {
    navGroups.forEach((group) => {
      group.items.forEach((item) => processItem(item, undefined, group.title));
    });
  } else if (navItems && navItems.length > 0) {
    navItems.forEach((item) => processItem(item));
  }

  return commands;
}

export function CommandSearch({
  open: customOpen,
  onOpenChange,
  groups: customGroups = [],
  items: customItems = [],
  navGroups,
  navItems,
  onSignOut,
  placeholder = "Type a command or search pages...",
  emptyText = "No results found.",
}: CommandSearchProps) {
  const context = useContext(CommandSearchContext);
  const isOpen = customOpen ?? context?.isOpen ?? false;
  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    } else if (context) {
      context.close();
    }
  };

  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { isDark, setTheme } = useTheme();

  const allGroups = useMemo(() => {
    const result: CommandGroup[] = [];

    // 1. Navigation items
    const navCommands = extractNavCommands(navGroups, navItems);
    if (navCommands.length > 0) {
      result.push({
        id: "navigation",
        title: "Navigation",
        items: navCommands,
      });
    }

    // 2. Custom passed groups & items + Context registered commands
    if (customGroups.length > 0) {
      result.push(...customGroups);
    }

    const registered = context?.registeredCommands ?? [];
    const combinedActions = [...customItems, ...registered];
    if (combinedActions.length > 0) {
      result.push({
        id: "custom-actions",
        title: "Actions",
        items: combinedActions,
      });
    }

    // 3. System actions
    const systemItems: CommandItem[] = [
      {
        id: "sys-toggle-theme",
        label: isDark ? "Switch to Light Mode" : "Switch to Dark Mode",
        category: "System",
        icon: isDark ? (
          <SunIcon className="size-4 text-amber-400" />
        ) : (
          <MoonIcon className="size-4 text-indigo-400" />
        ),
        onSelect: () => setTheme(isDark ? "light" : "dark"),
        shortcut: ["shift", "t"],
      },
    ];

    if (onSignOut) {
      systemItems.push({
        id: "sys-sign-out",
        label: "Sign Out",
        category: "System",
        icon: <LogoutIcon className="size-4 text-red-400" />,
        onSelect: onSignOut,
      });
    }

    result.push({
      id: "system",
      title: "System & Theme",
      items: systemItems,
    });

    return result;
  }, [
    navGroups,
    navItems,
    customGroups,
    customItems,
    context?.registeredCommands,
    isDark,
    setTheme,
    onSignOut,
  ]);

  const filteredGroups = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return allGroups;

    return allGroups
      .map((group) => {
        const matchingItems = group.items.filter((item) => {
          const matchLabel = item.label.toLowerCase().includes(trimmed);
          const matchCategory = item.category?.toLowerCase().includes(trimmed);
          const matchDesc = item.description?.toLowerCase().includes(trimmed);
          const matchKeywords = item.keywords?.some((k) =>
            k.toLowerCase().includes(trimmed),
          );
          return matchLabel || matchCategory || matchDesc || matchKeywords;
        });

        return {
          ...group,
          items: matchingItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [allGroups, query]);

  const handleSelect = (item: CommandItem | null) => {
    if (!item) return;

    handleClose();
    setQuery("");

    if (item.onSelect) {
      item.onSelect();
    } else if (item.path) {
      navigate({ to: item.path });
    }
  };

  return (
    <Transition appear show={isOpen}>
      <Dialog onClose={handleClose} className="relative z-50">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200 data-closed:opacity-0"
        />

        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24">
          <DialogPanel
            transition
            className="w-full max-w-xl overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xl transition-all duration-200 data-closed:scale-95 data-closed:opacity-0 text-foreground"
          >
            <Combobox onChange={handleSelect}>
              <div className="relative flex items-center border-b border-border/60 px-4">
                <SearchIcon className="pointer-events-none absolute left-4 size-5 text-muted-foreground" />
                <ComboboxInput
                  autoFocus
                  className="w-full bg-transparent py-4 pl-8 pr-12 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
                  placeholder={placeholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <div className="absolute right-4 flex items-center gap-1">
                  <Keyboard keys={["esc"]} />
                </div>
              </div>

              <ComboboxOptions
                static
                className="max-h-80 scroll-fade-y overflow-y-auto p-2 scroll-py-2 divide-y divide-border/30 focus:outline-none"
              >
                {filteredGroups.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                    <CommandIcon className="size-8 text-muted-foreground/50" />
                    <p>{emptyText}</p>
                  </div>
                ) : (
                  filteredGroups.map((group) => (
                    <div key={group.id} className="py-2 first:pt-0 last:pb-0">
                      {group.title && (
                        <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                          {group.title}
                        </div>
                      )}
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        {group.items.map((item) => (
                          <ComboboxOption
                            key={item.id}
                            value={item}
                            className="group/item flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-foreground select-none cursor-pointer transition-colors data-focus:bg-accent data-focus:text-accent-foreground"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {item.icon && (
                                <span className="shrink-0 text-muted-foreground group-data-focus/item:text-foreground">
                                  {item.icon}
                                </span>
                              )}
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2 truncate">
                                  <span className="font-medium truncate">
                                    {item.label}
                                  </span>
                                  {item.category &&
                                    group.title !== item.category && (
                                      <span className="text-xs text-muted-foreground truncate">
                                        in {item.category}
                                      </span>
                                    )}
                                </div>
                                {item.description && (
                                  <span className="text-xs text-muted-foreground truncate">
                                    {item.description}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {item.badge && <div>{item.badge}</div>}
                              {item.shortcut && item.shortcut.length > 0 && (
                                <Keyboard keys={item.shortcut} />
                              )}
                            </div>
                          </ComboboxOption>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </ComboboxOptions>

              <div className="flex items-center justify-between border-t border-border/60 px-4 py-2 text-[11px] text-muted-foreground bg-accent/30">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Keyboard keys={["up"]} /> <Keyboard keys={["down"]} />{" "}
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <Keyboard keys={["enter"]} /> Select
                  </span>
                </div>
              </div>
            </Combobox>
          </DialogPanel>
        </div>
      </Dialog>
    </Transition>
  );
}

export default CommandSearch;
