import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Button from "../button";
import { cn } from "../../../libs/cn";
import { MoreHorizontalIcon as MoreIcon } from "../icons";
import type { ReactNode } from "react";

export interface DataTableRowActionItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
}

interface DataTableRowActionsProps {
  actions: DataTableRowActionItem[];
  className?: string;
  showItem?: number;
}

export function DataTableRowActions({
  actions,
  className,
  showItem = 2,
}: DataTableRowActionsProps) {
  const flatItems = actions.slice(0, showItem);
  const remainingItems = actions.slice(showItem);
  if (actions.length === 0) return null;

  return (
    <Menu
      as="div"
      className={cn("relative flex items-center gap-2", className)}
    >
      <div className="flex gap-2">
        {flatItems.map((action, index) => {
          const isDestructive = action.variant === "destructive";

          return (
            <Button
              variant="outline"
              title={action.label}
              aria-label={action.label}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                action.onClick();
              }}
              className={cn(
                "rounded-sm p-1 h-6 w-6 text-xs text-left cursor-pointer transition-colors",
                isDestructive
                  ? "text-destructive focus:text-destructive"
                  : "text-foreground",
              )}
            >
              {action.icon && action.icon}
            </Button>
          );
        })}
      </div>

      {remainingItems.length > 0 && (
        <>
          <MenuButton
            as={Button}
            variant="ghost"
            size="sm"
            className="p-0.5 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <MoreIcon className="size-5" />
          </MenuButton>

          <MenuItems
            transition
            anchor="bottom end"
            className="z-50 min-w-36 rounded-md border border-border bg-card p-1 text-popover-foreground shadow-md transition duration-100 ease-out focus:outline-none data-closed:scale-95 data-closed:opacity-0"
          >
            {remainingItems.map((action, index) => {
              const isDestructive = action.variant === "destructive";

              return (
                <MenuItem key={`${action.label}-${index}`}>
                  {({ focus }) => (
                    <Button
                      variant="barebone"
                      type="button"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        action.onClick();
                      }}
                      className={cn(
                        "flex w-full justify-start items-center gap-2 rounded-sm px-2 text-xs text-left cursor-pointer transition-colors",
                        isDestructive
                          ? "text-destructive focus:text-destructive"
                          : "text-foreground",
                        focus &&
                          (isDestructive
                            ? "bg-destructive/10"
                            : "bg-accent text-accent-foreground"),
                      )}
                    >
                      {action.icon && action.icon}
                      <span>{action.label}</span>
                    </Button>
                  )}
                </MenuItem>
              );
            })}
          </MenuItems>
        </>
      )}
    </Menu>
  );
}
