import { createFileRoute } from "@tanstack/react-router";
import { QuickOutreachPage } from "../../modules/outreach/quick-outreach.page";
import { queryClient } from "../../libs/query-client";
import { apiClient } from "../../libs/api-client";
import { OUTREACH_KEYS } from "../../modules/outreach/outreach.api";
import type { PitchProfile, SenderIdentity } from "@z3/types";

export type OutreachSearch = {
  targetUrl?: string;
};

export const Route = createFileRoute("/_authenticated/outreach")({
  validateSearch: (search: Record<string, unknown>): OutreachSearch => ({
    targetUrl: typeof search.targetUrl === "string" ? search.targetUrl : undefined,
  }),
  loader: () => {
    void queryClient.prefetchQuery({
      queryKey: OUTREACH_KEYS.senders(),
      queryFn: () => apiClient.get<SenderIdentity[]>("/outreach/senders"),
    });
    void queryClient.prefetchQuery({
      queryKey: OUTREACH_KEYS.pitchProfiles(),
      queryFn: () => apiClient.get<PitchProfile[]>("/outreach/pitch-profiles"),
    });
  },
  component: QuickOutreachPage,
});
