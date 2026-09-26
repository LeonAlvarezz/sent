import { useEffect, useState } from "react";
import {
  Button,
  Drawer,
  Input,
  NavItem,
  SideBar,
  useActiveUrl,
  useCommandSearch,
} from "..";
import type { NavItemConfig, SideBarProps } from "..";
import { cn } from "../libs/cn";
import Keyboard from "./ui/keyboard";
import { ChevronUpIcon, SearchIcon, MenuIcon } from "./ui/icons";

function MobileNav({
  navGroups,
  navItems,
  footerNavItems,
  user,
  userMenuItems,
  onSignOut,
  sidebarFooter,
}: SideBarProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const commandSearch = useCommandSearch();
  const { pathname } = useActiveUrl();

  // Auto-close drawer and popovers on route change
  useEffect(() => {
    setIsSheetOpen(false);
    setOpenPopoverId(null);
  }, [pathname]);

  // Extract all top-level items
  const allTopItems: NavItemConfig[] =
    navItems ?? (navGroups ? navGroups.flatMap((g) => g.items) : []);

  // First 3 items go to bottom dock, 4th is More Menu
  const dockItems = allTopItems.slice(0, 3);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border px-3 flex items-center justify-around shrink-0 z-30 md:hidden">
        {dockItems.map((item) => {
          const hasSubItems = Boolean(item.items && item.items.length > 0);
          const isPopoverOpen = openPopoverId === item.id;

          if (hasSubItems) {
            return (
              <div key={item.id} className="relative">
                {/* SUBMENU POPOVER FLOATING ABOVE DOCK */}
                {isPopoverOpen && (
                  <>
                    <div
                      className="fixed inset-0 bg-black/40 z-40"
                      onClick={() => setOpenPopoverId(null)}
                    />
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-56 bg-card border border-border/80 rounded-2xl p-2 shadow-2xl z-50 animate-in slide-in-from-bottom-2 duration-150">
                      <div className="px-3 py-1.5 border-b border-border/50 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {item.label}
                      </div>
                      <div className="flex flex-col gap-1 mt-1">
                        {item.items!.map((sub) => (
                          <NavItem
                            key={sub.id}
                            icon={sub.icon}
                            label={sub.label}
                            href={sub.path}
                            className="px-3 py-2 text-xs"
                            onClick={() => setOpenPopoverId(null)}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Button
                  variant="barebone"
                  type="button"
                  onClick={() =>
                    setOpenPopoverId(isPopoverOpen ? null : item.id)
                  }
                  className={cn(
                    "flex flex-col items-center gap-1 p-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors relative",
                    isPopoverOpen && "text-primary font-bold",
                  )}
                >
                  <div className="relative flex items-center justify-center">
                    {item.icon}
                    {/* <span className="absolute -top-0.5 -right-1 size-2 rounded-full bg-primary" />*/}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <span className="text-[10px] font-medium">
                      {item.label}
                    </span>
                    {/* <ChevronUpIcon
                      className={cn(
                        "size-3 transition-transform",
                        isPopoverOpen ? "rotate-180" : "rotate-0",
                      )}
                    />*/}
                  </div>
                </Button>
              </div>
            );
          }

          return (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              href={item.path}
              className="flex-col gap-1 px-2 py-1 text-[10px] font-medium hover:bg-transparent"
            />
          );
        })}

        <Button
          type="button"
          variant="barebone"
          onClick={() => {
            setIsSheetOpen(true);
            setOpenPopoverId(null);
          }}
          className={cn(
            "flex flex-col items-center gap-1 p-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors",
            isSheetOpen && "text-primary font-bold",
          )}
        >
          <span className="shrink-0 text-base flex items-center justify-center">
            <MenuIcon />
          </span>
          <span className="text-[10px] font-medium">Menu</span>
        </Button>
      </nav>

      <Drawer open={isSheetOpen} onClose={() => setIsSheetOpen(false)}>
        {/* Quick Search */}
        <div
          className="py-3 shrink-0"
          onClick={() => {
            setIsSheetOpen(false);
            commandSearch?.open();
          }}
        >
          <Input
            readOnly
            onClick={() => {
              setIsSheetOpen(false);
              commandSearch?.open();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsSheetOpen(false);
                commandSearch?.open();
              }
            }}
            containerClassName="cursor-pointer"
            className="cursor-pointer"
            startIcon={<SearchIcon />}
            placeholder="Search commands & routes..."
            endIcon={<Keyboard keys={["command", "k"]} />}
          />
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto min-h-0 py-2">
          <SideBar.Nav groups={navGroups} items={navItems} />
        </div>

        {/* Footer */}
        {sidebarFooter ? (
          sidebarFooter
        ) : (
          <SideBar.Footer>
            {footerNavItems && footerNavItems.length > 0 && (
              <ul className="flex flex-col gap-1 my-2 px-3">
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
            <SideBar.UserMenu
              user={user}
              menuItems={userMenuItems ?? []}
              onSignOut={onSignOut}
            />
          </SideBar.Footer>
        )}
      </Drawer>
    </>
  );
}
export default MobileNav;
