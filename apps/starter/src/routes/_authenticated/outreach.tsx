import { createFileRoute, redirect } from "@tanstack/react-router";
import { noop } from "@tanstack/react-query";
import { QuickOutreachPage } from "../../modules/outreach/quick-outreach.page";
import { queryClient } from "../../libs/query-client";
import { apiClient } from "../../libs/api-client";
import { OUTREACH_KEYS } from "../../modules/outreach/outreach.api";
import { hasRequiredRole } from "@z3/admin-core";
import { USER_ROLE } from "@z3/types";
import type { PitchProfile, SenderIdentity } from "@z3/types";

export type OutreachSearch = {
  targetUrl?: string;
};

export const Route = createFileRoute("/_authenticated/outreach")({
  validateSearch: (search: Record<string, unknown>): OutreachSearch => ({
    targetUrl: typeof search.targetUrl === "string" ? search.targetUrl : undefined,
  }),
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
  loader: () => {
    void queryClient
      .query({
        queryKey: OUTREACH_KEYS.senders(),
        queryFn: () => apiClient.get<SenderIdentity[]>("/outreach/senders"),
      })
      .catch(noop);
    void queryClient
      .query({
        queryKey: OUTREACH_KEYS.pitchProfiles(),
        queryFn: () => apiClient.get<PitchProfile[]>("/outreach/pitch-profiles"),
      })
      .catch(noop);
  },
  component: QuickOutreachPage,
});
