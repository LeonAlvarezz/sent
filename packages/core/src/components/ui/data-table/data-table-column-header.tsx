import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Button from "../button";
import { cn } from "../../../libs/cn";
import { ArrowUpIcon as ArrowIcon, HideIcon } from "../icons";

interface DataTableColumnHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  column: any;
  title: string;
}

export function DataTableColumnHeader({
  column,
  title,
  className,
}: DataTableColumnHeaderProps) {
  if (!column.getCanSort?.()) {
    return (
      <div
        className={cn(
          "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
          className,
        )}
      >
        {title}
      </div>
    );
  }

  const isSorted = column.getIsSorted?.();

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Menu as="div" className="relative inline-block text-left">
        <MenuButton
          as={Button}
          variant="ghost"
          size="sm"
          className="h-8 -ml-3 flex items-center gap-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground data-open:bg-accent"
        >
          <span>{title}</span>
          {isSorted === "desc" ? (
            <ArrowIcon className="rotate-180" />
          ) : isSorted === "asc" ? (
            <ArrowIcon className="rotate-0" />
          ) : (
            <ArrowIcon className="rotate-180" />
          )}
        </MenuButton>

        <MenuItems
          transition
          anchor="bottom start"
          className="z-50 min-w-36 rounded-md border border-border bg-card p-1 text-popover-foreground shadow-md transition duration-100 ease-out focus:outline-none data-closed:scale-95 data-closed:opacity-0"
        >
          <MenuItem>
            {({ focus }) => (
              <Button
                variant="barebone"
                type="button"
                onClick={() => column.toggleSorting(false)}
                className={cn(
                  "flex w-full justify-start items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-left cursor-pointer",
                  focus && "bg-accent text-accent-foreground",
                )}
              >
                <ArrowIcon className="rotate-0" />
                Asc
              </Button>
            )}
          </MenuItem>
          <MenuItem>
            {({ focus }) => (
              <Button
                variant="barebone"
                type="button"
                onClick={() => column.toggleSorting(true)}
                className={cn(
                  "flex w-full justify-start items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-left cursor-pointer",
                  focus && "bg-accent text-accent-foreground",
                )}
              >
                <ArrowIcon className="rotate-180" />
                Desc
              </Button>
            )}
          </MenuItem>

          {column.getCanHide?.() && (
            <>
              <div className="my-1 h-px bg-border" />
              <MenuItem>
                {({ focus }) => (
                  <Button
                    variant="barebone"
                    type="button"
                    onClick={() => column.toggleVisibility(false)}
                    className={cn(
                      "flex w-full items-center justify-start gap-2 rounded-sm px-2 py-1.5 text-xs text-left cursor-pointer text-destructive focus:text-destructive",
                      focus && "bg-destructive/10",
                    )}
                  >
                    <HideIcon />
                    Hide Column
                  </Button>
                )}
              </MenuItem>
            </>
          )}
        </MenuItems>
      </Menu>
    </div>
  );
}
