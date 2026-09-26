import { createFileRoute } from "@tanstack/react-router";
import { EmailPage } from "../../modules/outreach/email.page";

export const Route = createFileRoute("/_authenticated/emails")({
  component: EmailPage,
});
