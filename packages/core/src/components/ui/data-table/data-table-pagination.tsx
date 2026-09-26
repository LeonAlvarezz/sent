import type { ReactTable } from "@tanstack/react-table";
import type { DefaultDataTableFeatures } from "./data-table";
import NativeSelect from "../native-select";
import Pagination from "../pagination";
import Skeleton from "../skeleton";
import { cn } from "../../../libs/cn";

export interface DataTablePaginationProps<
  TData extends Record<string, any> = any,
> {
  table: ReactTable<DefaultDataTableFeatures, TData>;
  pageSizeOptions?: number[];
  loading?: boolean;
}

export function DataTablePagination<TData extends Record<string, any> = any>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  loading = false,
}: DataTablePaginationProps<TData>) {
  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;
  const totalRowCount = table.getFilteredRowModel().rows.length;
  const pageIndex = table.state.pagination.pageIndex;
  const pageSize = table.state.pagination.pageSize;
  const pageCount = table.getPageCount();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 pt-5 pb-3 border-t border-border">
      {/* Selected count info */}
      <div className="flex gap-10 sm:items-center">
        <div className="text-xs text-muted-foreground order-2 sm:order-1">
          {loading ? (
            <Skeleton className="h-4 w-20" />
          ) : selectedRowCount > 0 ? (
            <span>
              {selectedRowCount} of {totalRowCount} row(s) selected.
            </span>
          ) : (
            <span>Total: {totalRowCount}</span>
          )}
        </div>
      </div>
      {/* Pagination controls & Page size selector */}
      <div
        className={cn(
          "flex items-center gap-6 lg:gap-8 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end",
          loading && "opacity-50 pointer-events-none",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Rows per page
          </span>
          <NativeSelect
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            options={pageSizeOptions}
            sizeVariant="sm"
            containerClassName="h-8"
            className="w-12 text-xs"
            disabled={loading}
          />
        </div>
        {/* Page numbers & Navigation controls */}
        {loading ? (
          <div className="flex items-center space-x-1.5">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        ) : (
          <Pagination
            page={pageIndex + 1}
            totalPages={pageCount}
            onPageChange={(page) => table.setPageIndex(page - 1)}
          />
        )}
      </div>
    </div>
  );
}
