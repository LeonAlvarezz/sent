import type { ReactTable } from "@tanstack/react-table";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Button from "../button";
import Checkbox from "../checkbox";
import type { DefaultDataTableFeatures } from "./data-table";
import { ColumnsIcon as ColumnIcon } from "../icons";
import { cn } from "../../../libs/cn";

interface DataTableViewOptionsProps<TData extends Record<string, any> = any> {
  table: ReactTable<DefaultDataTableFeatures, TData>;
}

export function DataTableViewOptions<TData extends Record<string, any> = any>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const toggleableColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== "undefined" && column.getCanHide(),
    );

  if (toggleableColumns.length === 0) return null;

  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton
        as={Button}
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 px-2 text-xs"
      >
        {/* <ColumnIcon />*/}
        Properties
      </MenuButton>

      <MenuItems
        transition
        anchor="bottom end"
        className="z-50 min-w-44 rounded-md border border-border bg-card p-1.5 text-popover-foreground shadow-md transition duration-100 ease-out focus:outline-none data-closed:scale-95 data-closed:opacity-0"
      >
        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground capitalize tracking-wider">
          View columns
        </div>
        <hr className="my-2 border-border" />
        <div className="max-h-60 overflow-y-auto">
          {toggleableColumns.map((column) => {
            const isVisible = column.getIsVisible();
            const header = column.columnDef.header;
            const label = typeof header === "string" ? header : column.id;

            return (
              <MenuItem key={column.id}>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      column.toggleVisibility(!isVisible);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-xs capitalize cursor-pointer select-none text-left focus:outline-none transition-colors",
                      focus && "bg-accent text-accent-foreground",
                    )}
                  >
                    <Checkbox
                      checked={isVisible}
                      onChange={() => {}}
                      tabIndex={-1}
                      className="pointer-events-none"
                    />
                    <span className="truncate">{label}</span>
                  </button>
                )}
              </MenuItem>
            );
          })}
        </div>
      </MenuItems>
    </Menu>
  );
}
