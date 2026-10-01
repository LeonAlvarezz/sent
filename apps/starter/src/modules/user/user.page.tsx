import * as React from "react";
import {
  Button,
  CloseIcon,
  DataTable,
  Input,
  NativeSelect,
  PageLoadingSkeleton,
  SearchIcon,
  Unauthorized,
  useAuth,
  useTableQuery,
} from "@z3/admin-core";
import { USER_ROLE } from "@z3/types";
import type { ListUsersQuery, User } from "@z3/types";
import { useUsersQuery } from "./api/user.api";
import { createUserColumn } from "./components/user.column";
import { ChangeRoleModal } from "./components/change-role-modal";

export function UserPage() {
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();

  const table = useTableQuery<ListUsersQuery>({
    mode: "client",
    defaultPageSize: 10,
    defaultValues: {
      search: "",
      role: undefined,
      limit: 50,
      order: "desc",
    },
    debounceMs: 300,
  });

  const [selectedUserForRole, setSelectedUserForRole] =
    React.useState<User | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = React.useState(false);

  const isAuthorized = currentUser?.role === USER_ROLE.SUPER_ADMIN;

  const { data, isLoading, isFetching } = useUsersQuery(table.queryParams, {
    enabled: isAuthorized,
  });

  const users = data?.users ?? [];

  const handleOpenRoleModal = (targetUser: User) => {
    setSelectedUserForRole(targetUser);
    setIsRoleModalOpen(true);
  };

  const columns = createUserColumn({
    onChangeRole: handleOpenRoleModal,
  });

  if (isAuthLoading || !currentUser) {
    return <PageLoadingSkeleton />;
  }

  if (!isAuthorized) {
    return (
      <Unauthorized description="You do not have administrator permissions to view or manage user accounts. Contact a system administrator for access." />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="gap-1 flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            User Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            View users and administrators, audit access levels, and assign
            system roles.
          </p>
        </div>
      </div>

      {/* Data Table with Toolbar */}
      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        isFetching={isFetching}
        pageSizeOptions={[10, 20, 30, 50]}
        {...table.paginationProps()}
        toolbar={(t) => (
          <DataTable.Toolbar>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <Input
                placeholder="Search users by name or email..."
                value={table.searchValue}
                onChange={table.setSearchValue}
                startIcon={<SearchIcon />}
                containerClassName="h-9 w-64 sm:w-80"
              />
              <NativeSelect
                value={table.filters.role ?? "all"}
                onChange={(e) => {
                  const role = e.target.value;
                  if (role === "all") return table.setFilter("role", undefined);
                  table.setFilter("role", role as USER_ROLE);
                }}
                className="h-8 text-xs w-36"
                options={[
                  { value: "all", label: "All Roles" },
                  { value: USER_ROLE.SUPER_ADMIN, label: "Super Admin" },
                  { value: USER_ROLE.ADMIN, label: "Admin" },
                  { value: USER_ROLE.USER, label: "Standard User" },
                ]}
              />
              {table.isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={table.resetFilters}
                  className="h-8 px-2 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <CloseIcon className="size-3.5" />
                  <span>Reset</span>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <DataTable.ViewOptions table={t} />
            </div>
          </DataTable.Toolbar>
        )}
      />

      {/* Change Role Modal */}
      <ChangeRoleModal
        isOpen={isRoleModalOpen}
        setIsOpen={setIsRoleModalOpen}
        targetUser={selectedUserForRole}
        currentUser={currentUser}
      />
    </div>
  );
}

export default UserPage;
