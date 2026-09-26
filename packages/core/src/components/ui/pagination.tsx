import * as React from "react";
import Button from "./button";
import { cn } from "../../libs/cn";
import { ChevronDownIcon as ChevronIcon } from "./icons";

export type PaginationItem = number | "...";

export function generatePaginationItems(
  currentPage: number,
  totalPages: number,
  siblingCount = 1,
): PaginationItem[] {
  if (totalPages <= 0) return [];

  const totalPageNumbersToShow = siblingCount * 2 + 5;

  if (totalPages <= totalPageNumbersToShow) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, "...", totalPages];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1,
    );
    return [firstPageIndex, "...", ...rightRange];
  }

  if (shouldShowLeftDots && shouldShowRightDots) {
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i,
    );
    return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex];
  }

  return [];
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const items = generatePaginationItems(page, totalPages, siblingCount);
  const canPrevious = page > 1;
  const canNext = page < totalPages;

  if (totalPages <= 0) return null;

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className={cn("flex items-center space-x-1.5", className)}
    >
      {/* Previous Page Button */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0 flex items-center justify-center rounded-lg"
        onClick={() => canPrevious && onPageChange(page - 1)}
        disabled={!canPrevious}
        aria-label="Go to previous page"
      >
        <ChevronIcon className="rotate-90" />
      </Button>

      {/* Page Numbers and Ellipses */}
      {items.map((item, index) => {
        if (item === "...") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="h-8 min-w-8 px-1.5 flex items-center justify-center text-sm text-muted-foreground select-none"
            >
              &#8230;
            </span>
          );
        }

        const isCurrentPage = item === page;

        return (
          <Button
            variant="barebone"
            key={`page-${item}`}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={isCurrentPage ? "page" : undefined}
            className={cn(
              "h-8 min-w-8 px-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-center select-none",
              isCurrentPage
                ? "bg-primary text-white font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
            )}
          >
            {item}
          </Button>
        );
      })}

      {/* Next Page Button */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0 flex items-center justify-center rounded-lg"
        onClick={() => canNext && onPageChange(page + 1)}
        disabled={!canNext}
        aria-label="Go to next page"
      >
        <ChevronIcon className="-rotate-90" />
      </Button>
    </nav>
  );
}

export default Pagination;
