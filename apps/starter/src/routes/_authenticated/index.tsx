import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "../../modules/dashboard/dashboard.page";

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
});
