import { createFileRoute } from "@tanstack/react-router";
import { AccountSettingsPage } from "@/modules/settings/account-settings.page";

export const Route = createFileRoute("/_authenticated/settings/account")({
  component: AccountSettingsPage,
});
