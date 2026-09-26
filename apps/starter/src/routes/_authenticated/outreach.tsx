import { createFileRoute } from "@tanstack/react-router";
import { QuickOutreachPage } from "../../modules/outreach/quick-outreach.page";

export type OutreachSearch = {
  targetUrl?: string;
};

export const Route = createFileRoute("/_authenticated/outreach")({
  validateSearch: (search: Record<string, unknown>): OutreachSearch => ({
    targetUrl: typeof search.targetUrl === "string" ? search.targetUrl : undefined,
  }),
  component: QuickOutreachPage,
});
