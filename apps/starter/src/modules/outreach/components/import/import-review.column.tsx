import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox, DataTableColumnHeader, Tag } from "@z3/admin-core";
import type { DefaultDataTableFeatures } from "@z3/admin-core";
import type { ReviewEmail } from "./types";

export interface CreateImportReviewColumnsProps {
  isAllVisibleSelected: boolean;
  onToggleSelectAll: () => void;
  onToggleSelect: (id: number) => void;
}

export const createImportReviewColumns = ({
  isAllVisibleSelected,
  onToggleSelectAll,
  onToggleSelect,
}: CreateImportReviewColumnsProps): ColumnDef<
  DefaultDataTableFeatures,
  ReviewEmail
>[] => [
  {
    id: "select",
    header: () => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={isAllVisibleSelected}
          onChange={onToggleSelectAll}
          aria-label="Select all visible emails"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div
        className="flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={row.original.selected}
          onChange={() => onToggleSelect(row.original.id)}
          aria-label={`Select email ${row.original.email}`}
        />
      </div>
    ),
    size: 48,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => {
      const email = row.original.email;
      return (
        <span className="font-mono text-xs font-medium text-foreground truncate block">
          {email || (
            <span className="text-muted-foreground italic font-sans">
              (empty)
            </span>
          )}
        </span>
      );
    },
    size: 240,
  },
  {
    id: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const { firstName, lastName } = row.original;
      const fullName = [firstName, lastName].filter(Boolean).join(" ");
      return (
        <span className="text-xs font-medium text-foreground truncate block">
          {fullName || <span className="text-muted-foreground">--</span>}
        </span>
      );
    },
    size: 160,
  },
  {
    id: "company",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company / Title" />
    ),
    cell: ({ row }) => {
      const { companyName, title } = row.original;
      if (!companyName && !title) {
        return <span className="text-xs text-muted-foreground">--</span>;
      }
      return (
        <span className="text-xs text-muted-foreground truncate block">
          {companyName && <strong className="text-foreground">{companyName}</strong>}
          {companyName && title && " • "}
          {title}
        </span>
      );
    },
    size: 200,
  },
  {
    accessorKey: "attributes",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Extra Details" />
    ),
    cell: ({ row }) => {
      const entries = Object.entries(row.original.attributes).filter(
        ([k]) =>
          !k.toLowerCase().includes("company") &&
          !k.toLowerCase().includes("title"),
      );

      if (entries.length === 0) {
        return <span className="text-xs text-muted-foreground">—</span>;
      }

      return (
        <div className="flex items-center gap-1 flex-wrap max-w-xs">
          {entries.slice(0, 2).map(([key, val]) => (
            <span
              key={key}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-accent text-accent-foreground font-mono"
              title={`${key}: ${val}`}
            >
              {key}: {String(val)}
            </span>
          ))}
          {entries.length > 2 && (
            <span className="text-[10px] text-muted-foreground font-medium">
              +{entries.length - 2} more
            </span>
          )}
        </div>
      );
    },
    size: 220,
  },
  {
    id: "status",
    header: ({ column }) => (
      <div className="text-right">
        <DataTableColumnHeader column={column} title="Status" />
      </div>
    ),
    cell: ({ row }) => {
      const { isValidEmail, isDuplicate, duplicateReason, duplicateSource } =
        row.original;

      if (!isValidEmail) {
        return (
          <div className="text-right">
            <Tag color="rose" className="text-[11px] py-0.5 px-2">
              Invalid Email
            </Tag>
          </div>
        );
      }

      if (isDuplicate) {
        let label = "Duplicate";
        if (duplicateReason === "email") label = "Duplicate Email";
        else if (duplicateReason === "company_title") label = "Duplicate Role";

        const sourceHint =
          duplicateSource === "database" ? "in database" : "in file";

        return (
          <div className="text-right">
            <Tag
              color="amber"
              className="text-[11px] py-0.5 px-2"
              title={`${label} (${sourceHint})`}
            >
              {label}
            </Tag>
          </div>
        );
      }

      return (
        <div className="text-right">
          <Tag color="emerald" className="text-[11px] py-0.5 px-2">
            New
          </Tag>
        </div>
      );
    },
    size: 140,
  },
];
