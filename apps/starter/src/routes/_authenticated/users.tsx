import { createFileRoute } from "@tanstack/react-router";
import { UserPage } from "../../modules/user/user.page";
import { ListUsersQuerySchema, safeValidateSearch } from "@z3/types";

export const Route = createFileRoute("/_authenticated/users")({
  validateSearch: safeValidateSearch(ListUsersQuerySchema),
  component: UserPage,
});

