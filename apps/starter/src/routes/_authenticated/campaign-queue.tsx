import { createFileRoute } from "@tanstack/react-router";
import { CampaignQueuePage } from "../../modules/outreach/campaign-queue.page";

export const Route = createFileRoute("/_authenticated/campaign-queue")({
  component: CampaignQueuePage,
});
