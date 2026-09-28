import { createFileRoute } from "@tanstack/react-router";
import { noop } from "@tanstack/react-query";
import { BulkSendPage } from "../../modules/outreach/bulk-send.page";
import { queryClient } from "../../libs/query-client";
import { apiClient } from "../../libs/api-client";
import { OUTREACH_KEYS } from "../../modules/outreach/outreach.api";
import type { JobTitleItem, PitchProfile, SenderIdentity } from "@z3/types";

export type BulkSendSearch = {
  selected?: string;
  jobTitle?: string;
};

export const Route = createFileRoute("/_authenticated/bulk-send")({
  validateSearch: (search: Record<string, unknown>): BulkSendSearch => ({
    selected: typeof search.selected === "string" ? search.selected : undefined,
    jobTitle: typeof search.jobTitle === "string" ? search.jobTitle : undefined,
  }),
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
    void queryClient
      .query({
        queryKey: OUTREACH_KEYS.jobTitles(),
        queryFn: () => apiClient.get<JobTitleItem[]>("/outreach/job-titles"),
      })
      .catch(noop);
  },
  component: BulkSendPage,
});
