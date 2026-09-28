import { createFileRoute, redirect } from "@tanstack/react-router";
import { noop } from "@tanstack/react-query";
import { UserPage } from "../../modules/user/user.page";
import { hasRequiredRole } from "@z3/admin-core";
import { ListUsersQuerySchema, safeValidateSearch, USER_ROLE } from "@z3/types";
import { queryClient } from "../../libs/query-client";
import { apiClient } from "../../libs/api-client";
import { userKeys } from "../../modules/user/api/user.api";
import type { UsersListResponse } from "@z3/types";

export const Route = createFileRoute("/_authenticated/users")({
  validateSearch: safeValidateSearch(ListUsersQuerySchema),
  beforeLoad: ({ context }) => {
    if (!context.auth.isLoading && !hasRequiredRole(context.auth.user?.role, [USER_ROLE.SUPER_ADMIN])) {
      throw redirect({ to: "/forbidden" });
    }
  },
  loader: ({ deps }) => {
    void queryClient
      .query({
        queryKey: userKeys.list(deps),
        queryFn: () => apiClient.get<UsersListResponse>("/users"),
      })
      .catch(noop);
  },
  component: UserPage,
});

