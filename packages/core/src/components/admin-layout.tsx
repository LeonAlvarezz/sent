import React from "react";
import type { AdminLayoutProps } from "../types";
import SideBar from "./sidebar";
import { CommandSearch, CommandSearchProvider } from "./ui/command-search";
import WorkspaceTabs from "./workspace-tabs";

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  title = "ZeroUI",
  logo,
  navGroups,
  navItems,
  footerNavItems,
  user,
  userMenuItems,
  onSignOut,
  headerActions,
  sidebarFooter,
  sidebar,
  commandGroups,
  commandItems,
  enableTabs = true,
  children,
}) => {
  return (
    <CommandSearchProvider>
      <div className="flex h-svh w-full max-w-full overflow-hidden bg-background text-foreground">
        {sidebar ? (
          sidebar
        ) : (
          <SideBar
            title={title}
            logo={logo}
            navGroups={navGroups}
            navItems={navItems}
            footerNavItems={footerNavItems}
            user={user}
            userMenuItems={userMenuItems}
            onSignOut={onSignOut}
            sidebarFooter={sidebarFooter}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0">
          {headerActions && (
            <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between shrink-0">
              {headerActions}
            </header>
          )}
          {enableTabs && (
            <WorkspaceTabs navGroups={navGroups} navItems={navItems} />
          )}
          <main className="flex-1 flex flex-col p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
      <CommandSearch
        navGroups={navGroups}
        navItems={navItems}
        groups={commandGroups}
        items={commandItems}
        onSignOut={onSignOut}
      />
    </CommandSearchProvider>
  );
};
