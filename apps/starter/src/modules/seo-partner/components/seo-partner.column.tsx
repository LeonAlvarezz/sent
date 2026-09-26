import {
  CopyIcon,
  copyToClipboard,
  DataTableColumnHeader,
  DataTableRowActions,
  DeleteIcon,
  EditIcon,
  formatDate,
  formatNumber,
  Tag,
  TimeIcon,
  toast,
  Tooltip,
} from "@z3/admin-core";
import type { DefaultDataTableFeatures } from "@z3/admin-core";
import type { SeoPartner } from "@z3/types";
import type { ColumnDef } from "@tanstack/react-table";
import { SeoPartnerStatusColor } from "@/modules/shared/status-color";

export interface CreateSeoPartnerColumnProps {
  onDelete: (partner: SeoPartner) => void;
  onEdit: (partner: SeoPartner) => void;
  onQuickOutreach?: (partner: SeoPartner) => void;
}

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  outreached: "Outreached",
  overbudget: "Overbudget",
  in_progress: "In Progress",
  accepted: "Accepted",
  rejected: "Rejected",
};

export const createSeoPartnerColumns = ({
  onDelete,
  onEdit,
  onQuickOutreach,
}: CreateSeoPartnerColumnProps): ColumnDef<
  DefaultDataTableFeatures,
  SeoPartner
>[] => {
  return [
    {
      accessorKey: "website",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Website" />
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col min-w-0 pr-2">
            <span className="font-semibold text-foreground truncate text-sm">
              {item.website}
            </span>
            <a
              href={
                item.url.startsWith("http") ? item.url : `https://${item.url}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors truncate font-mono inline-flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {item.url}
              <span className="text-[10px] opacity-60">↗</span>
            </a>
          </div>
        );
      },
      size: 240,
    },
    {
      accessorKey: "dr",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="DR" />
      ),
      cell: ({ row }) => {
        const dr = row.original.dr;
        if (dr === null || dr === undefined) {
          return <span className="text-muted-foreground text-xs">—</span>;
        }

        const color =
          dr >= 70
            ? "emerald"
            : dr >= 40
              ? "sky"
              : dr >= 20
                ? "amber"
                : "stone";

        return (
          <Tag color={color} className="font-bold font-mono">
            {dr}
          </Tag>
        );
      },
      size: 80,
    },
    {
      accessorKey: "backlinks",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Backlinks" />
      ),
      cell: ({ row }) => {
        const backlinks = row.original.backlinks;
        if (backlinks === null || backlinks === undefined) {
          return <span className="text-muted-foreground text-xs">—</span>;
        }

        return (
          <span className="font-mono text-xs font-medium text-foreground">
            {formatNumber(backlinks, { notation: "compact" })}
          </span>
        );
      },
      size: 110,
    },
    {
      accessorKey: "backlinkFor",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Backlink For" />
      ),
      cell: ({ row }) => {
        const client = row.original.backlinkFor;
        if (!client) {
          return <span className="text-muted-foreground text-xs">—</span>;
        }

        return (
          <Tag color="indigo" className="max-w-35 truncate">
            {client}
          </Tag>
        );
      },
      size: 150,
    },
    {
      accessorKey: "outreachStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.original.outreachStatus;
        const color = SeoPartnerStatusColor[status];
        const label = STATUS_LABELS[status] || status;

        return (
          <Tag color={color} className="capitalize font-medium">
            {label}
          </Tag>
        );
      },
      size: 130,
    },
    {
      accessorKey: "outreachDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Outreach Date" />
      ),
      cell: ({ row }) => {
        const date = row.original.outreachDate;
        if (!date)
          return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <span className="text-xs text-muted-foreground font-mono">
            {formatDate(new Date(date), {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        );
      },
      size: 130,
    },
    {
      accessorKey: "followUpDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Follow Up" />
      ),
      cell: ({ row }) => {
        const date = row.original.followUpDate;
        if (!date)
          return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <span className="text-xs text-muted-foreground font-mono">
            {formatDate(new Date(date), {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        );
      },
      size: 130,
    },
    {
      accessorKey: "quotedPrice",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Quoted Price" />
      ),
      cell: ({ row }) => {
        const price = row.original.quotedPrice;
        if (!price)
          return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <Tooltip content={price}>
            <span className="text-xs font-medium text-foreground bg-accent/60 px-2 py-0.5 rounded border border-border/40 truncate max-w-37.5 inline-block">
              {price}
            </span>
          </Tooltip>
        );
      },
      size: 160,
    },
    {
      id: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Action" />
      ),
      enableHiding: false,
      enableSorting: false,
      meta: {
        freeze: true,
      },
      size: 120,
      cell: ({ row }) => {
        const partner = row.original;
        return (
          <DataTableRowActions
            showItem={2}
            actions={[
              ...(onQuickOutreach
                ? [
                    {
                      label: "Quick Outreach",
                      icon: <TimeIcon />,
                      onClick: () => onQuickOutreach(partner),
                    },
                  ]
                : []),
              {
                label: "Edit Partner",
                icon: <EditIcon />,
                onClick: () => onEdit(partner),
              },
              {
                label: "Copy URL",
                icon: <CopyIcon />,
                onClick: async () => {
                  await copyToClipboard(partner.url);
                  toast.success("URL copied to clipboard");
                },
              },
              {
                label: "Delete",
                icon: <DeleteIcon />,
                variant: "destructive" as const,
                onClick: () => onDelete(partner),
              },
            ]}
          />
        );
      },
    },
  ];
};
