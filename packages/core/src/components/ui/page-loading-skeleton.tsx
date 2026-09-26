import React from "react";
import Skeleton from "./skeleton";
import { cn } from "../../libs/cn";

export interface PageLoadingSkeletonProps {
  className?: string;
}

export function PageLoadingSkeleton({ className }: PageLoadingSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading page content"
      className={cn(
        "flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full animate-fade-in",
        className,
      )}
    >
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48 sm:w-60" />
          <Skeleton className="h-4 w-72 sm:w-96" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Toolbar Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-8 w-64 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Content / Table Skeleton */}
      <div className="rounded-xl border border-border/60 bg-card p-4 flex flex-col gap-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="flex flex-col gap-3 py-1">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <Skeleton className="h-4 w-28" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageLoadingSkeleton;
