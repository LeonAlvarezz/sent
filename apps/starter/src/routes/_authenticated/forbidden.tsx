import { createFileRoute } from "@tanstack/react-router";
import { Unauthorized } from "@z3/admin-core";

export const Route = createFileRoute("/_authenticated/forbidden")({
  component: ForbiddenRoute,
});

function ForbiddenRoute() {
  return <Unauthorized />;
}
