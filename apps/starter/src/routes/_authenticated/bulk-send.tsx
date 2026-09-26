import { createFileRoute } from "@tanstack/react-router";
import { BulkSendPage } from "../../modules/outreach/bulk-send.page";

export type BulkSendSearch = {
  selected?: string;
  jobTitle?: string;
};

export const Route = createFileRoute("/_authenticated/bulk-send")({
  validateSearch: (search: Record<string, unknown>): BulkSendSearch => ({
    selected: typeof search.selected === "string" ? search.selected : undefined,
    jobTitle: typeof search.jobTitle === "string" ? search.jobTitle : undefined,
  }),
  component: BulkSendPage,
});
