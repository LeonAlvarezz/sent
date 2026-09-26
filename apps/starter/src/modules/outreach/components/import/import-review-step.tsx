import React, { useMemo, useState } from "react";
import {
  Button,
  DataTable,
  Input,
  NativeSelect,
  SearchIcon,
} from "@z3/admin-core";
import type { ReviewEmail } from "./types";
import { createImportReviewColumns } from "./import-review.column";

export interface ImportReviewStepProps {
  reviewContacts?: ReviewEmail[];
  setReviewContacts?: React.Dispatch<React.SetStateAction<ReviewEmail[]>>;
  reviewEmails?: ReviewEmail[];
  setReviewEmails?: React.Dispatch<React.SetStateAction<ReviewEmail[]>>;
  targetListName: string;
}

export function ImportReviewStep({
  reviewContacts,
  setReviewContacts,
  reviewEmails: propReviewEmails,
  setReviewEmails: propSetReviewEmails,
  targetListName,
}: ImportReviewStepProps) {
  const emails = propReviewEmails || reviewContacts || [];
  const setEmails = propSetReviewEmails || setReviewContacts || (() => {});

  const [filterSearch, setFilterSearch] = useState("");
  const [validityFilter, setValidityFilter] = useState<
    "all" | "unique" | "duplicates" | "invalid"
  >("all");

  // Summary Metrics
  const totalRows = emails.length;
  const validEmails = useMemo(
    () => emails.filter((c) => c.isValidEmail),
    [emails],
  );
  const duplicates = useMemo(
    () => emails.filter((c) => c.isDuplicate),
    [emails],
  );
  const uniqueEmails = useMemo(
    () => emails.filter((c) => c.isValidEmail && !c.isDuplicate),
    [emails],
  );
  const invalidCount = totalRows - validEmails.length;
  const selectedValidCount = useMemo(
    () => emails.filter((c) => c.selected && c.isValidEmail).length,
    [emails],
  );

  // Search & Filter Filtering
  const filteredEmails = useMemo(() => {
    return emails.filter((c) => {
      if (validityFilter === "unique" && (!c.isValidEmail || c.isDuplicate)) {
        return false;
      }
      if (validityFilter === "duplicates" && !c.isDuplicate) {
        return false;
      }
      if (validityFilter === "invalid" && c.isValidEmail) {
        return false;
      }

      if (filterSearch.trim()) {
        const q = filterSearch.toLowerCase().trim();
        const emailMatch = c.email.toLowerCase().includes(q);
        const nameMatch = `${c.firstName || ""} ${c.lastName || ""}`
          .toLowerCase()
          .includes(q);
        const companyMatch = (c.companyName || "").toLowerCase().includes(q);
        const titleMatch = (c.title || "").toLowerCase().includes(q);
        const attrMatch = Object.values(c.attributes).some((v) =>
          String(v).toLowerCase().includes(q),
        );
        return (
          emailMatch || nameMatch || companyMatch || titleMatch || attrMatch
        );
      }
      return true;
    });
  }, [emails, validityFilter, filterSearch]);

  const allVisibleSelected =
    filteredEmails.length > 0 && filteredEmails.every((c) => c.selected);

  const toggleSelectAllVisible = () => {
    const nextSelected = !allVisibleSelected;
    const visibleIds = new Set(filteredEmails.map((c) => c.id));
    setEmails((prev) =>
      prev.map((c) =>
        visibleIds.has(c.id) ? { ...c, selected: nextSelected } : c,
      ),
    );
  };

  const toggleSelectRow = (id: number) => {
    setEmails((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)),
    );
  };

  // Bulk duplicate controls
  const handleSkipAllDuplicates = () => {
    setEmails((prev) =>
      prev.map((c) => (c.isDuplicate ? { ...c, selected: false } : c)),
    );
  };

  const handleIncludeAllDuplicates = () => {
    setEmails((prev) =>
      prev.map((c) =>
        c.isDuplicate && c.isValidEmail ? { ...c, selected: true } : c,
      ),
    );
  };

  const columns = useMemo(
    () =>
      createImportReviewColumns({
        isAllVisibleSelected: allVisibleSelected,
        onToggleSelectAll: toggleSelectAllVisible,
        onToggleSelect: toggleSelectRow,
      }),
    [allVisibleSelected, filteredEmails],
  );

  return (
    <div className="space-y-4">
      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-muted/40 rounded-lg border border-border">
          <span className="text-[11px] font-medium text-muted-foreground block">
            Total Detected
          </span>
          <span className="text-lg font-bold text-foreground">{totalRows}</span>
        </div>
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block">
            Unique & Ready
          </span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {uniqueEmails.length}
          </span>
        </div>
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 block">
            Duplicates
          </span>
          <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
            {duplicates.length}
          </span>
        </div>
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
          <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 block">
            Invalid Emails
          </span>
          <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
            {invalidCount}
          </span>
        </div>
      </div>

      {/* Filter & Selection Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Input
            startIcon={<SearchIcon className="size-3.5" />}
            placeholder="Search emails, company, or title..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            containerClassName="h-8 flex-1 max-w-sm"
            className="text-xs"
          />
          <NativeSelect
            value={validityFilter}
            onChange={(e) =>
              setValidityFilter(
                e.target.value as "all" | "unique" | "duplicates" | "invalid",
              )
            }
            className="h-8 text-xs w-40"
          >
            <option value="all">All Rows ({totalRows})</option>
            <option value="unique">Unique ({uniqueEmails.length})</option>
            <option value="duplicates">Duplicates ({duplicates.length})</option>
            <option value="invalid">Invalid Emails ({invalidCount})</option>
          </NativeSelect>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {duplicates.length > 0 && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSkipAllDuplicates}
                className="h-8 text-xs"
                title="Uncheck all duplicates"
              >
                Skip Duplicates
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleIncludeAllDuplicates}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                title="Check valid duplicates"
              >
                Include All
              </Button>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleSelectAllVisible}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            {allVisibleSelected ? "Deselect All" : "Select All Visible"}
          </Button>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            <strong className="text-foreground">{selectedValidCount}</strong>{" "}
            selected
          </span>
        </div>
      </div>

      {/* Review DataTable */}
      <DataTable
        columns={columns}
        data={filteredEmails}
        enablePagination={true}
        enableColumnViewToggle={false}
        initialPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        onRowClick={(emailRow) => toggleSelectRow(emailRow.id)}
        emptyState={
          <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-muted-foreground">
            <p className="text-xs font-medium">No matching emails found.</p>
          </div>
        }
      />
    </div>
  );
}
