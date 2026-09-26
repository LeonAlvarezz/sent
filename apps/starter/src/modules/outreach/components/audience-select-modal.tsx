import React, { useMemo, useState, useEffect } from "react";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import {
  Button,
  Checkbox,
  CloseIcon,
  DataTable,
  DataTableColumnHeader,
  Input,
  Modal,
  ModalBody,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  SearchIcon,
  Select,
  Tag,
} from "@z3/admin-core";
import type { DefaultDataTableFeatures } from "@z3/admin-core";
import type { Email } from "@z3/types";
import { useEmailsQuery, useJobTitlesQuery } from "../outreach.api";

export interface AudienceSelectModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedEmailIds: number[];
  onConfirm: (selectedIds: number[]) => void;
  initialJobTitle?: string;
}

// Static columns definition: zero recreations on row selection
const AUDIENCE_COLUMNS: ColumnDef<DefaultDataTableFeatures, Email>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onChange={(checked) => table.toggleAllPageRowsSelected(checked)}
          aria-label="Select all visible recipients"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div
        className="flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={row.getIsSelected()}
          onChange={(checked) => row.toggleSelected(checked)}
          aria-label={`Select recipient ${row.original.email}`}
        />
      </div>
    ),
    size: 44,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contact" />
    ),
    cell: ({ row }) => {
      const item = row.original;
      const fullName = [item.firstName, item.lastName]
        .filter(Boolean)
        .join(" ");
      return (
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-foreground text-xs truncate">
            {fullName || "Unnamed Contact"}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground truncate">
            {item.email}
          </span>
        </div>
      );
    },
    size: 220,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Job Title" />
    ),
    cell: ({ row }) => {
      const title = row.original.title;
      if (!title) {
        return (
          <span className="text-muted-foreground/60 italic text-xs">
            No title
          </span>
        );
      }
      return (
        <Tag color="purple" className="text-[11px] truncate">
          {title}
        </Tag>
      );
    },
    size: 320,
  },
  {
    accessorKey: "companyName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company" />
    ),
    cell: ({ row }) => {
      const company = row.original.companyName;
      if (!company) {
        return (
          <span className="text-muted-foreground/60 italic text-xs">—</span>
        );
      }
      return (
        <span className="text-xs text-foreground truncate block">
          {company}
        </span>
      );
    },
  },
];

export function AudienceSelectModal({
  isOpen,
  setIsOpen,
  selectedEmailIds,
  onConfirm,
  initialJobTitle,
}: AudienceSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>(
    initialJobTitle || "all",
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(() => {
    const map: RowSelectionState = {};
    for (const id of selectedEmailIds) {
      map[String(id)] = true;
    }
    return map;
  });

  // Sync state only when modal opens
  useEffect(() => {
    if (isOpen) {
      const map: RowSelectionState = {};
      for (const id of selectedEmailIds) {
        map[String(id)] = true;
      }
      setRowSelection(map);
      if (initialJobTitle) {
        setSelectedJobTitle(initialJobTitle);
      }
    }
  }, [isOpen]);

  // Queries
  const { data: jobTitles = [] } = useJobTitlesQuery();

  const jobTitleOptions = [
    { value: "all", label: "All Job Titles" },
    ...jobTitles.map((jt) => ({
      value: jt.title,
      label: `${jt.title} (${jt.count})`,
    })),
  ];

  const { data: emails = [], isLoading } = useEmailsQuery({
    title: selectedJobTitle !== "all" ? selectedJobTitle : undefined,
    search: searchTerm.trim() || undefined,
  });

  // Active recipients only
  const activeEmails = emails.filter((e) => e.status === "active");

  const selectedCount = Object.keys(rowSelection).length;

  const handleSelectAllFiltered = () => {
    setRowSelection((prev) => {
      const next = { ...prev };
      for (const e of activeEmails) {
        next[String(e.id)] = true;
      }
      return next;
    });
  };

  const handleDeselectAll = () => {
    setRowSelection({});
  };

  const handleApply = () => {
    const confirmedIds = Object.keys(rowSelection).map(Number);
    onConfirm(confirmedIds);
    setIsOpen(false);
  };

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} size="3xl">
      <ModalHeader>
        <ModalTitle>Select Target Audience</ModalTitle>
        <ModalDescription>
          Filter contacts by job title, search across the directory, and select
          recipients for your outreach campaign.
        </ModalDescription>
      </ModalHeader>

      <ModalBody className="space-y-4">
        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex flex-1 items-center gap-2">
            <Input
              placeholder="Search name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startIcon={<SearchIcon />}
              containerClassName="h-8 flex-1"
              className="text-xs"
            />
            <Select
              value={selectedJobTitle}
              onChange={(val) => setSelectedJobTitle(val || "all")}
              options={jobTitleOptions}
              searchable
              virtual
              clearable={selectedJobTitle !== "all"}
              sizeVariant="sm"
              placeholder="Filter by Job Title..."
              containerClassName="w-52 sm:w-60 shrink-0"
              dropdownClassName="min-w-64"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAllFiltered}
              disabled={activeEmails.length === 0}
              className="h-8 px-2.5 text-xs"
            >
              Select All Filtered ({activeEmails.length})
            </Button>
            {selectedCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <CloseIcon className="size-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Directory Table */}
        <DataTable
          columns={AUDIENCE_COLUMNS}
          data={activeEmails}
          loading={isLoading}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          getRowId={(row) => String(row.id)}
          enablePagination={true}
          enableColumnViewToggle={false}
          initialPageSize={10}
          pageSizeOptions={[10, 20, 50, 100]}
          onRowClick={(row) => {
            setRowSelection((prev) => {
              const idStr = String(row.id);
              if (idStr in prev) {
                const next = { ...prev };
                delete next[idStr];
                return next;
              }
              return { ...prev, [idStr]: true };
            });
          }}
          emptyState={
            <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-muted-foreground">
              <p className="text-xs font-medium">No matching contacts found.</p>
            </div>
          }
        />
      </ModalBody>

      <ModalFooter>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={selectedCount === 0}
            onClick={handleApply}
          >
            Confirm ({selectedCount})
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
