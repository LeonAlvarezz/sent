import {
  Avatar,
  CopyIcon,
  copyToClipboard,
  DataTableColumnHeader,
  DataTableRowActions,
  EditIcon,
  formatDate,
  Tag,
  toast,
} from "@z3/admin-core";
import type { DefaultDataTableFeatures } from "@z3/admin-core";
import { USER_ROLE } from "@z3/types";
import type { User } from "@z3/types";
import type { ColumnDef } from "@tanstack/react-table";
import UserRoleTag from "./user-role-tag";

export const createUserColumn = ({
  onChangeRole,
}: {
  onChangeRole: (user: User) => void;
}): ColumnDef<DefaultDataTableFeatures, User>[] => {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => {
        const u = row.original;
        const initials = u.name
          ? u.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
          : "U";

        return (
          <div className="flex items-center gap-3">
            {u.image ? (
              <Avatar
                src={u.image}
                className="size-9 ring-1 ring-border shrink-0"
              />
            ) : (
              <div className="size-9 rounded-full bg-accent text-accent-foreground font-semibold text-xs flex items-center justify-center shrink-0 ring-1 ring-border">
                {initials}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-foreground truncate text-sm">
                {u.name}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {u.email}
              </span>
            </div>
          </div>
        );
      },
      size: 260,
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => <UserRoleTag role={row.original.role} />,
      size: 130,
    },
    {
      accessorKey: "emailVerified",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email Status" />
      ),
      cell: ({ row }) => {
        const verified = row.original.emailVerified;
        return (
          <Tag color={verified ? "emerald" : "amber"}>
            {verified ? "Verified" : "Unverified"}
          </Tag>
        );
      },
      size: 130,
    },
    {
      accessorKey: "twoFactorEnabled",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="2FA Security" />
      ),
      cell: ({ row }) => {
        const twoFa = row.original.twoFactorEnabled;
        return (
          <Tag color={twoFa ? "emerald" : "zinc"}>
            {twoFa ? "Enabled" : "Disabled"}
          </Tag>
        );
      },
      size: 130,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Joined" />
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
      size: 80,
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const targetUser = row.original;

        return (
          <DataTableRowActions
            actions={[
              {
                label: "Change Role",
                icon: <EditIcon />,
                onClick: () => onChangeRole(targetUser),
              },

              {
                label: "Copy User ID",
                icon: <CopyIcon />,
                onClick: async () => {
                  await copyToClipboard(targetUser.id);
                  toast.info(`Copied ID: ${targetUser.id}`);
                },
              },
            ]}
          />
        );
      },
    },
  ];
};
