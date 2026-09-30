import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Button,
  Checkbox,
  DataTableColumnHeader,
  PlusIcon,
  SpinnerIcon,
  Tag,
} from "@z3/admin-core";
import type { DefaultDataTableFeatures } from "@z3/admin-core";
import type { CompetitorBacklinkItem } from "@z3/types";

export interface CreateBacklinkColumnProps {
  importingDomains?: Record<string, boolean>;
  onImportSingle?: (item: CompetitorBacklinkItem) => void;
}

export const createBacklinkColumn = ({
  importingDomains = {},
  onImportSingle,
}: CreateBacklinkColumnProps = {}): ColumnDef<
  DefaultDataTableFeatures,
  CompetitorBacklinkItem
>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onChange={(checked) =>
            table.toggleAllPageRowsSelected(Boolean(checked))
          }
          aria-label="Select all backlinks"
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
          onChange={(checked) => row.toggleSelected(Boolean(checked))}
          aria-label={`Select ${row.original.domain}`}
        />
      </div>
    ),
    size: 40,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "dr",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="DR" />
    ),
    cell: ({ row }) => {
      const dr = row.original.dr;
      return (
        <div className="font-semibold text-foreground text-sm pl-1 font-mono">
          {dr}
        </div>
      );
    },
    size: 60,
  },
  {
    id: "referringPage",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Referring page" />
    ),
    cell: ({ row }) => {
      const item = row.original;
      const displayTitle = item.pageTitle || item.domain;

      return (
        <div className="flex flex-col gap-0.5 max-w-85 pr-2">
          <a
            href={item.referringUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline leading-snug line-clamp-2"
            title={displayTitle}
          >
            {displayTitle}
          </a>
          <a
            href={item.referringUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline truncate font-mono"
            title={item.referringUrl}
          >
            {item.referringUrl}
          </a>
        </div>
      );
    },
    size: 320,
  },
  {
    id: "anchorAndTarget",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Anchor and target URL" />
    ),
    cell: ({ row }) => {
      const item = row.original;
      const hasContext = Boolean(item.textPre || item.textPost);

      return (
        <div className="flex flex-col gap-1 text-wrap">
          {/* Context and Anchor */}
          <div className="text-xs text-foreground/90 leading-relaxed line-clamp-2">
            {hasContext ? (
              <span>
                {item.textPre ? `${item.textPre} ` : ""}
                <a
                  href={item.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  {item.anchor || "link"}
                </a>
                {item.textPost ? ` ${item.textPost}` : ""}
              </span>
            ) : (
              <span>
                Anchor:{" "}
                <a
                  href={item.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  {item.anchor || "link"}
                </a>
              </span>
            )}
          </div>

          {/* Target URL in emerald */}
          <a
            href={item.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline truncate font-mono"
            title={item.targetUrl}
          >
            {item.targetUrl}
          </a>
        </div>
      );
    },
    size: 360,
  },
  {
    accessorKey: "isExistingPartner",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isExisting = row.original.isExistingPartner;
      return isExisting ? (
        <Tag color="amber" className="gap-1 px-2 py-0.5">
          <span>Already Partner</span>
        </Tag>
      ) : (
        <Tag color="blue" className="gap-1 px-2 py-0.5">
          <span>New Lead</span>
        </Tag>
      );
    },
    size: 130,
  },
  {
    id: "actions",
    header: () => <span className="text-xs font-semibold">Action</span>,
    cell: ({ row }) => {
      const item = row.original;
      const isCurrentlyImporting = Boolean(importingDomains[item.domain]);

      if (item.isExistingPartner) {
        return (
          <span className="text-xs text-muted-foreground italic pl-1">
            Saved
          </span>
        );
      }

      return (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isCurrentlyImporting}
          onClick={() => onImportSingle?.(item)}
          className="h-7 px-2.5 text-xs gap-1"
        >
          <span>
            {isCurrentlyImporting ? (
              <SpinnerIcon />
            ) : (
              <div className="flex gap-2 items-center">
                <PlusIcon />
                <p>Import</p>
              </div>
            )}
          </span>
        </Button>
      );
    },
    size: 95,
    enableSorting: false,
  },
];
