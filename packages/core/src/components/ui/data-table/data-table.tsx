import * as React from "react";
import {
  useTable,
  flexRender,
  tableFeatures,
  rowSortingFeature,
  rowPaginationFeature,
  columnFilteringFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  columnSizingFeature,
  metaHelper,
  createCoreRowModel,
  createSortedRowModel,
  createPaginatedRowModel,
} from "@tanstack/react-table";
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  ColumnVisibilityState,
} from "@tanstack/react-table";
import { cn } from "../../../libs/cn";
import { InboxIcon } from "../icons";
import { Tooltip } from "../tooltip";
import { Skeleton } from "../skeleton";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";

export type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  ColumnVisibilityState,
};

export interface DataTableColumnMeta {
  className?: string;
  truncate?: boolean;
  freeze?: boolean | "left" | "right";
}

export const defaultFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  columnFilteringFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  columnSizingFeature,
  columnMeta: metaHelper<DataTableColumnMeta>(),
  coreRowModel: createCoreRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

export type DefaultDataTableFeatures = typeof defaultFeatures;

function getColumnDefinitionInfo<TData extends Record<string, any>>(
  columns: readonly ColumnDef<DefaultDataTableFeatures, TData, any>[],
) {
  const sizedColumnIds = new Set<string>();
  const customCellColumnIds = new Set<string>();

  const visitColumns = (
    columnDefs: readonly ColumnDef<DefaultDataTableFeatures, TData, any>[],
  ) => {
    for (const columnDef of columnDefs) {
      if ("columns" in columnDef && columnDef.columns) {
        visitColumns(columnDef.columns);
        continue;
      }

      const accessorKey =
        "accessorKey" in columnDef && typeof columnDef.accessorKey === "string"
          ? columnDef.accessorKey
          : undefined;
      const columnId =
        columnDef.id ??
        accessorKey?.replaceAll(".", "_") ??
        (typeof columnDef.header === "string" ? columnDef.header : undefined);

      if (!columnId) continue;

      if (columnDef.size != null) sizedColumnIds.add(columnId);
      if (columnDef.cell != null) customCellColumnIds.add(columnId);
    }
  };

  visitColumns(columns);
  return {
    explicitlySizedColumnIds: sizedColumnIds,
    customCellColumnIds,
  };
}

export interface DataTableProps<
  TData extends Record<string, any> = any,
  TValue = unknown,
> {
  columns: ColumnDef<DefaultDataTableFeatures, TData, TValue>[];
  data: TData[];
  loading?: boolean;
  enablePagination?: boolean;
  enableColumnViewToggle?: boolean;
  pageSizeOptions?: number[];
  initialPageSize?: number;
  /** Whether to automatically reset page index when data, sorting, or filters change. Defaults to false. */
  autoResetPageIndex?: boolean;
  /** Total number of rows across all pages for server-side / manual pagination. */
  rowCount?: number;
  /** Total number of pages for server-side / manual pagination. Auto-calculated if rowCount is provided. */
  pageCount?: number;
  /**
   * Data & pagination handling mode:
   * - "server": Table expects page chunks from API; uses rowCount / pageCount for paging.
   * - "client": Table paginates and filters entire dataset locally in memory.
   * @default "client" (auto-promoted to "server" if rowCount or pageCount is provided)
   */
  mode?: "client" | "server";
  pagination?: PaginationState;
  onPaginationChange?:
    | React.Dispatch<React.SetStateAction<PaginationState>>
    | ((updater: any) => void);
  toolbarActions?: React.ReactNode;
  toolbar?: React.ReactNode | ((table: any) => React.ReactNode);
  emptyState?: React.ReactNode;
  onRowClick?: (row: TData) => void;
  className?: string;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?:
    | React.Dispatch<React.SetStateAction<RowSelectionState>>
    | ((updater: any) => void);
  getRowId?: (originalRow: TData, index: number, parent?: any) => string;
  freezeActionColumn?: boolean;
}

function DataTableRoot<
  TData extends Record<string, any> = any,
  TValue = unknown,
>({
  columns,
  data,
  loading = false,
  enablePagination = true,
  enableColumnViewToggle = true,
  pageSizeOptions = [10, 20, 30, 40, 50],
  initialPageSize = 10,
  autoResetPageIndex = false,
  rowCount,
  pageCount,
  mode,
  pagination: paginationProp,
  onPaginationChange: onPaginationChangeProp,
  toolbarActions,
  toolbar,
  emptyState,
  onRowClick,
  className,
  rowSelection: rowSelectionProp,
  onRowSelectionChange: onRowSelectionChangeProp,
  getRowId,
  freezeActionColumn = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({});
  const [internalRowSelection, setInternalRowSelection] =
    React.useState<RowSelectionState>({});
  const activeRowSelection = rowSelectionProp ?? internalRowSelection;
  const handleRowSelectionChange =
    onRowSelectionChangeProp ?? setInternalRowSelection;

  const [internalPagination, setInternalPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: initialPageSize,
    });
  const activePagination = paginationProp ?? internalPagination;
  const handlePaginationChange =
    onPaginationChangeProp ?? setInternalPagination;

  const { explicitlySizedColumnIds, customCellColumnIds } =
    getColumnDefinitionInfo(columns);

  const getColumnFreeze = React.useCallback(
    (columnId: string, meta?: DataTableColumnMeta): "left" | "right" | null => {
      if (meta?.freeze === "left") return "left";
      if (meta?.freeze === "right" || meta?.freeze === true) return "right";
      if (freezeActionColumn && columnId === "actions") return "right";
      return null;
    },
    [freezeActionColumn],
  );

  const isServer =
    mode !== undefined
      ? mode === "server"
      : rowCount !== undefined || pageCount !== undefined;

  const table = useTable({
    features: defaultFeatures,
    data,
    columns: columns as any,
    autoResetPageIndex,
    manualPagination: isServer,
    rowCount,
    pageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection: activeRowSelection,
      pagination: activePagination,
    },
    getRowId,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: handleRowSelectionChange,
    onPaginationChange: handlePaginationChange,
  });

  // Clamp pageIndex if total pageCount drops below current pageIndex
  React.useEffect(() => {
    if (loading) return;
    if (isServer && pageCount === undefined && rowCount === undefined) return;

    const totalPages = table.getPageCount();
    if (totalPages > 0 && activePagination.pageIndex >= totalPages) {
      handlePaginationChange((prev: PaginationState) => {
        const clampedIndex = Math.max(0, totalPages - 1);
        if (prev.pageIndex === clampedIndex) return prev;
        return {
          ...prev,
          pageIndex: clampedIndex,
        };
      });
    }
  }, [
    loading,
    isServer,
    pageCount,
    rowCount,
    activePagination.pageIndex,
    handlePaginationChange,
    table,
  ]);

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Toolbar Slot */}
      {toolbar ? (
        typeof toolbar === "function" ? (
          toolbar(table as any)
        ) : (
          toolbar
        )
      ) : enableColumnViewToggle || toolbarActions ? (
        <DataTableToolbar
          table={table as any}
          enableColumnViewToggle={enableColumnViewToggle}
          actions={toolbarActions}
        />
      ) : null}

      {/* Main Table Shell */}
      <div className="@container rounded-lg border border-border bg-card/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto table-scrollbar">
          <table
            className="w-full table-fixed text-left text-sm text-foreground"
            style={{ minWidth: table.getTotalSize() }}
          >
            <colgroup>
              {table.getVisibleLeafColumns().map((column) => (
                <col
                  key={column.id}
                  style={
                    explicitlySizedColumnIds.has(column.id)
                      ? { width: column.getSize() }
                      : undefined
                  }
                />
              ))}
            </colgroup>
            <thead className="bg-accent border-border text-xs uppercase tracking-wider text-muted-foreground select-none">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const freeze = getColumnFreeze(
                      header.column.id,
                      header.column.columnDef.meta,
                    );

                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        className={cn(
                          "px-4 py-3 font-semibold whitespace-nowrap transition-colors",
                          freeze === "right" &&
                            "sticky right-0 z-20 bg-accent border-l border-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]",
                          freeze === "left" &&
                            "sticky left-0 z-20 bg-accent border-r border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]",
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                // Loading Skeleton Rows
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    {table.getVisibleLeafColumns().map((column) => {
                      const freeze = getColumnFreeze(
                        column.id,
                        column.columnDef.meta,
                      );

                      return (
                        <td
                          key={`skeleton-${column.id}`}
                          className={cn(
                            "px-4 py-3.5 whitespace-nowrap",
                            freeze === "right" &&
                              "sticky right-0 z-10 bg-card border-l border-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]",
                            freeze === "left" &&
                              "sticky left-0 z-10 bg-card border-r border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]",
                          )}
                        >
                          <Skeleton className="h-4 w-3/4" />
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : table.getRowModel().rows.length > 0 ? (
                // Data Rows
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onClick={() => onRowClick?.(row.original)}
                    className={cn(
                      "group/row transition-colors hover:bg-accent data-[state=selected]:bg-primary/5",
                      onRowClick && "cursor-pointer",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const content = flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      );
                      const shouldTruncate =
                        cell.column.columnDef.meta?.truncate ??
                        !customCellColumnIds.has(cell.column.id);
                      const freeze = getColumnFreeze(
                        cell.column.id,
                        cell.column.columnDef.meta,
                      );

                      return (
                        <td
                          key={cell.id}
                          className={cn(
                            "px-4 py-3 align-middle whitespace-nowrap overflow-hidden",
                            cell.column.columnDef.meta?.className,
                            freeze === "right" &&
                              "sticky right-0 z-10 bg-card group-hover/row:bg-accent group-data-[state=selected]/row:bg-primary/5 border-l border-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]",
                            freeze === "left" &&
                              "sticky left-0 z-10 bg-card group-hover/row:bg-accent group-data-[state=selected]/row:bg-primary/5 border-r border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]",
                          )}
                        >
                          {shouldTruncate ? (
                            <Tooltip
                              content={content}
                              showWhenTruncated
                              className="block min-w-0 truncate"
                            >
                              {content}
                            </Tooltip>
                          ) : (
                            content
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                // Empty State
                <tr>
                  <td
                    colSpan={
                      table.getVisibleLeafColumns().length || columns.length
                    }
                    className="h-36 p-0 text-center"
                  >
                    <div className="sticky left-0 w-[100cqw] flex flex-col items-center justify-center gap-2 text-muted-foreground py-8">
                      {emptyState ?? (
                        <>
                          <InboxIcon className="size-8 opacity-40" />
                          <p className="text-sm font-medium">
                            No results found.
                          </p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {enablePagination && (
          <DataTablePagination
            table={table as any}
            pageSizeOptions={pageSizeOptions}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

export const DataTable = Object.assign(DataTableRoot, {
  Toolbar: DataTableToolbar,
  ViewOptions: DataTableViewOptions,
  Pagination: DataTablePagination,
  ColumnHeader: DataTableColumnHeader,
  RowActions: DataTableRowActions,
});
