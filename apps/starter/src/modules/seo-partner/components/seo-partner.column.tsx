import {
  CheckIcon,
  CopyIcon,
  copyToClipboard,
  DataTableColumnHeader,
  DataTableRowActions,
  DeleteIcon,
  EditIcon,
  formatDate,
  formatNumber,
  getAutoColumnSize,
  Select,
  Tag,
  TimeIcon,
  toast,
  Tooltip,
} from "@z3/admin-core";
import type { DefaultDataTableFeatures } from "@z3/admin-core";
import { SEO_PARTNER_STATUS } from "@z3/types";
import type { SeoPartner } from "@z3/types";
import type { ColumnDef } from "@tanstack/react-table";
import { SeoPartnerStatusColor } from "@/modules/shared/status-color";

export interface CreateSeoPartnerColumnProps {
  data?: SeoPartner[];
  onDelete: (partner: SeoPartner) => void;
  onEdit: (partner: SeoPartner) => void;
  onQuickOutreach?: (partner: SeoPartner) => void;
  onStatusChange?: (
    partner: SeoPartner,
    status: SEO_PARTNER_STATUS,
  ) => Promise<void> | void;
  updatingIds?: Record<number, boolean>;
}

export const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  outreached: "Outreached",
  overbudget: "Overbudget",
  in_progress: "In Progress",
  accepted: "Accepted",
  rejected: "Rejected",
  do_not_contact: "Do Not Contact",
};

export const STATUS_OPTIONS = [
  { value: SEO_PARTNER_STATUS.NOT_STARTED, label: "Not Started" },
  { value: SEO_PARTNER_STATUS.OUTREACHED, label: "Outreached" },
  { value: SEO_PARTNER_STATUS.IN_PROGRESS, label: "In Progress" },
  { value: SEO_PARTNER_STATUS.ACCEPTED, label: "Accepted" },
  { value: SEO_PARTNER_STATUS.REJECTED, label: "Rejected" },
  { value: SEO_PARTNER_STATUS.OVERBUDGET, label: "Overbudget" },
  { value: SEO_PARTNER_STATUS.DO_NOT_CONTACT, label: "Do Not Contact" },
];

function SeoPartnerStatusCell({
  partner,
  onStatusChange,
  isUpdating = false,
}: {
  partner: SeoPartner;
  onStatusChange?: (
    partner: SeoPartner,
    status: SEO_PARTNER_STATUS,
  ) => Promise<void> | void;
  isUpdating?: boolean;
}) {
  const status = partner.outreachStatus;
  const color = SeoPartnerStatusColor[status];
  const label = STATUS_LABELS[status] || status;

  if (!onStatusChange) {
    return (
      <Tag color={color} className="capitalize font-medium">
        {label}
      </Tag>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center min-w-36"
    >
      <Select
        value={status}
        onChange={(val) => {
          if (val && val !== status) {
            void onStatusChange(partner, val as SEO_PARTNER_STATUS);
          }
        }}
        options={STATUS_OPTIONS}
        anchor={{ to: "bottom start", gap: 4 }}
        disabled={isUpdating}
        loading={isUpdating}
        sizeVariant="sm"
        containerClassName="w-36"
        className="h-7.5 px-2 bg-accent/40 hover:bg-accent/80 transition-colors border-border/60"
        dropdownClassName="w-40 z-50 shadow-lg"
        renderValue={(val) => {
          const s = val as SEO_PARTNER_STATUS;
          const c = SeoPartnerStatusColor[s];
          const l = STATUS_LABELS[s] || s;
          return (
            <Tag
              color={c}
              className="capitalize font-medium text-xs py-0.5 px-1.5"
            >
              {l}
            </Tag>
          );
        }}
        renderOption={(option, { selected }) => {
          const s = option.value;
          const c = SeoPartnerStatusColor[s];
          return (
            <div className="flex items-center justify-between w-full py-0.5">
              <Tag
                color={c}
                className="capitalize font-medium text-xs py-0.5 px-1.5"
              >
                {option.label}
              </Tag>
              {selected && (
                <CheckIcon className="size-3.5 text-primary ml-2 shrink-0" />
              )}
            </div>
          );
        }}
      />
    </div>
  );
}

export const createSeoPartnerColumns = ({
  data,
  onDelete,
  onEdit,
  onQuickOutreach,
  onStatusChange,
  updatingIds,
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
          <Tooltip content={client}>
            <Tag
              color="indigo"
              className="max-w-full inline-flex items-center min-w-0"
            >
              <span className="truncate">{client}</span>
            </Tag>
          </Tooltip>
        );
      },
      size: getAutoColumnSize(data, (p) => p.backlinkFor),
    },
    {
      accessorKey: "outreachStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      meta: {
        className: "overflow-visible",
      },
      cell: ({ row }) => {
        const partner = row.original;
        const isUpdating = Boolean(updatingIds?.[partner.id]);

        return (
          <SeoPartnerStatusCell
            partner={partner}
            onStatusChange={onStatusChange}
            isUpdating={isUpdating}
          />
        );
      },
      size: 160,
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
