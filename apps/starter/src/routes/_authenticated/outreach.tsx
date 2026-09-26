import { createFileRoute } from "@tanstack/react-router";
import { QuickOutreachPage } from "../../modules/outreach/quick-outreach.page";

export const Route = createFileRoute("/_authenticated/outreach")({
  component: QuickOutreachPage,
});
