import * as React from "react";
import type { ReactTable } from "@tanstack/react-table";
import Button from "../button";
import { CloseIcon } from "../icons";
import { DataTableViewOptions } from "./data-table-view-options";
import type { DefaultDataTableFeatures } from "./data-table";
import { cn } from "../../../libs/cn";

export interface DataTableToolbarProps<
  TData extends Record<string, any> = any,
> extends React.HTMLAttributes<HTMLDivElement> {
  table?: ReactTable<DefaultDataTableFeatures, TData>;
  enableColumnViewToggle?: boolean;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function DataTableToolbar<TData extends Record<string, any> = any>({
  table,
  enableColumnViewToggle = true,
  actions,
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  if (children) {
    const childCount = React.Children.toArray(children).filter(Boolean).length;
    return (
      <div
        className={cn(
          "flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pb-3",
          childCount > 1 ? "justify-between" : "justify-end",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  const isFiltered = Boolean(table && table.state.columnFilters.length > 0);

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3",
        className,
      )}
      {...props}
    >
      {/* Reset Column Filters Button */}
      <div className="flex flex-1 items-center gap-2">
        {isFiltered && table && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetColumnFilters()}
            className="h-9 px-2 text-xs flex items-center gap-1.5"
          >
            <span>Reset</span>
            <CloseIcon className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Right side actions & Column View options */}
      <div className="flex items-center gap-2 justify-end">
        {actions}
        {enableColumnViewToggle && table && (
          <DataTableViewOptions table={table} />
        )}
      </div>
    </div>
  );
}
