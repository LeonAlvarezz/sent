import { createFileRoute } from "@tanstack/react-router";
import { noop } from "@tanstack/react-query";
import { CampaignQueuePage } from "../../modules/outreach/campaign-queue.page";
import { queryClient } from "../../libs/query-client";
import { apiClient } from "../../libs/api-client";
import { OUTREACH_KEYS } from "../../modules/outreach/outreach.api";
import type { CampaignWithRelations } from "@z3/types";

export const Route = createFileRoute("/_authenticated/campaign-queue")({
  loader: () => {
    void queryClient
      .query({
        queryKey: OUTREACH_KEYS.campaigns(),
        queryFn: () => apiClient.get<CampaignWithRelations[]>("/campaigns"),
      })
      .catch(noop);
  },
  component: CampaignQueuePage,
});
