import { Skeleton } from "@z3/admin-core";

function SettingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="size-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-9 w-full mt-4" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}
export default SettingSkeleton;
