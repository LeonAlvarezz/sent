import { createFileRoute, redirect } from "@tanstack/react-router";
import { MailSettingsPage } from "../../modules/settings/mail-settings.page";

export const Route = createFileRoute("/_authenticated/outreach-settings")({
  beforeLoad: () => {
    throw redirect({
      to: "/settings/mail",
    });
  },
  component: MailSettingsPage,
});
