import { createFileRoute } from "@tanstack/react-router";
import { MailSettingsPage } from "@/modules/settings/mail-settings.page";

export const Route = createFileRoute("/_authenticated/settings/mail")({
  component: MailSettingsPage,
});
