import {
  Checkbox,
  CopyIcon,
  copyToClipboard,
  DataTableColumnHeader,
  DataTableRowActions,
  DeleteIcon,
  EditIcon,
  formatDate,
  Tag,
  TimeIcon,
  toast,
} from "@z3/admin-core";
import type { DefaultDataTableFeatures } from "@z3/admin-core";
import type { Email, EmailList } from "@z3/types";
import type { ColumnDef } from "@tanstack/react-table";
import { EmailStatusColor } from "@/modules/shared/status-color";

export interface CreateEmailColumnProps {
  onDelete: (emailItem?: Email) => void;
  onEdit: (emailItem?: Email) => void;
  onQuickOutreach?: (emailItem?: Email) => void;
  emailLists?: EmailList[];
  isAllSelected?: boolean;
  onToggleSelectAll?: () => void;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
}

export const createEmailColumn = ({
  onDelete,
  onEdit,
  onQuickOutreach,
  emailLists = [],
  isAllSelected,
  onToggleSelectAll,
  selectedIds,
  onToggleSelect,
}: CreateEmailColumnProps): ColumnDef<DefaultDataTableFeatures, Email>[] => {
  const columns: ColumnDef<DefaultDataTableFeatures, Email>[] = [];

  if (onToggleSelect) {
    columns.push({
      id: "select",
      header: () => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={Boolean(isAllSelected)}
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
            checked={selectedIds?.has(row.original.id) ?? false}
            onChange={() => onToggleSelect(row.original.id)}
            aria-label={`Select email ${row.original.email}`}
          />
        </div>
      ),
      size: 44,
      enableSorting: false,
      enableHiding: false,
    });
  }

  columns.push(
    {
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ID" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium text-muted-foreground">
          #{row.original.id}
        </span>
      ),
      size: 70,
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => {
        const item = row.original;
        const fullName = [item.firstName, item.lastName]
          .filter(Boolean)
          .join(" ");
        const initial = (
          item.firstName?.[0] ||
          item.email[0] ||
          "?"
        ).toUpperCase();

        return (
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0 border border-primary/20">
              {initial}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-foreground truncate">
                {item.email}
              </span>
              {fullName && (
                <span className="text-xs text-muted-foreground truncate">
                  {fullName}
                </span>
              )}
            </div>
          </div>
        );
      },
      size: 260,
    },
    {
      accessorKey: "companyName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Company / Title" />
      ),
      cell: ({ row }) => {
        const { companyName, title } = row.original;
        if (!companyName && !title) {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
        return (
          <div className="flex flex-col min-w-0 max-w-xs">
            {companyName && (
              <span className="text-xs font-medium text-foreground truncate">
                {companyName}
              </span>
            )}
            {title && (
              <span className="text-[11px] text-muted-foreground truncate">
                {title}
              </span>
            )}
          </div>
        );
      },
      size: 180,
    },
    {
      accessorKey: "listId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Audience List" />
      ),
      cell: ({ row }) => {
        const listName = emailLists.find((l) => l.id === row.original.listId)?.name;
        return listName ? (
          <Tag color="indigo" dot={false} className="font-medium">
            {listName}
          </Tag>
        ) : (
          <span className="text-xs text-muted-foreground italic">General</span>
        );
      },
      size: 160,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Tag
            label={status}
            color={EmailStatusColor[status]}
          />
        );
      },
      size: 130,
    },
    {
      accessorKey: "attributes",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Custom Attributes" />
      ),
      cell: ({ row }) => {
        const entries = Object.entries(row.original.attributes);
        if (entries.length === 0) {
          return <span className="text-xs text-muted-foreground">—</span>;
        }

        return (
          <div className="flex flex-wrap gap-1 items-center max-w-xs">
            {entries.slice(0, 2).map(([k, v]) => (
              <span
                key={k}
                className="text-[11px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono truncate max-w-32"
                title={`${k}: ${String(v)}`}
              >
                {k}: {String(v)}
              </span>
            ))}
            {entries.length > 2 && (
              <span className="text-[11px] text-muted-foreground font-medium">
                +{entries.length - 2} more
              </span>
            )}
          </div>
        );
      },
      size: 240,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Added" />
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.createdAt, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
      size: 120,
    },
    {
      id: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Action" />
      ),
      enableHiding: false,
      size: 110,
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;

        return (
          <DataTableRowActions
            actions={[
              {
                label: "Edit",
                icon: <EditIcon />,
                onClick: () => onEdit(item),
              },
              ...(onQuickOutreach
                ? [
                    {
                      label: "Quick Outreach",
                      icon: <TimeIcon />,
                      onClick: () => onQuickOutreach(item),
                    },
                  ]
                : []),
              {
                label: "Copy Email",
                icon: <CopyIcon />,
                onClick: async () => {
                  await copyToClipboard(item.email);
                  toast.info(`Copied: ${item.email}`);
                },
              },
              {
                label: "Delete",
                icon: <DeleteIcon />,
                variant: "destructive",
                onClick: () => onDelete(item),
              },
            ]}
          />
        );
      },
    },
  );

  return columns;
};

export const createContactColumn = createEmailColumn;
export type CreateContactColumnProps = CreateEmailColumnProps;
