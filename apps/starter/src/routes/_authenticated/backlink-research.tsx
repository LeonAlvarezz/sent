import { createFileRoute, redirect } from "@tanstack/react-router";
import { BacklinkResearchPage } from "../../modules/seo-partner/backlink-research.page";
import { hasRequiredRole } from "@z3/admin-core";
import { USER_ROLE } from "@z3/types";

export const Route = createFileRoute("/_authenticated/backlink-research")({
  beforeLoad: ({ context }) => {
    if (
      !context.auth.isLoading &&
      !hasRequiredRole(context.auth.user?.role, [
        USER_ROLE.SUPER_ADMIN,
        USER_ROLE.ADMIN,
      ])
    ) {
      throw redirect({ to: "/forbidden" });
    }
  },
  component: BacklinkResearchPage,
});
