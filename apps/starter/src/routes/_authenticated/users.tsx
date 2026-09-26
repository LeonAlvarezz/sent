import { createFileRoute } from "@tanstack/react-router";
import { UserPage } from "../../modules/user/user.page";
import { ListUsersQuerySchema, safeValidateSearch } from "@z3/types";
import { queryClient } from "../../libs/query-client";
import { apiClient } from "../../libs/api-client";
import { userKeys } from "../../modules/user/api/user.api";
import type { UsersListResponse } from "@z3/types";

export const Route = createFileRoute("/_authenticated/users")({
  validateSearch: safeValidateSearch(ListUsersQuerySchema),
  loader: ({ deps }) => {
    void queryClient.prefetchQuery({
      queryKey: userKeys.list(deps),
      queryFn: () => apiClient.get<UsersListResponse>("/users"),
    });
  },
  component: UserPage,
});

