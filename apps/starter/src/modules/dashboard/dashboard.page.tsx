import React from "react";
import { Link } from "@tanstack/react-router";
import { Button, MailIcon, PlusIcon } from "@z3/admin-core";
import { useSeoPartnersQuery } from "../seo-partner/seo-partner.api";
import {
  useCampaignsQuery,
  useEmailListsQuery,
  useEmailsQuery,
  useOutreachLogsQuery,
} from "../outreach/outreach.api";
import { DashboardKpiStats } from "./components/dashboard-kpi-stats";
import { OutreachActivityChart } from "./components/outreach-activity-chart";
import { RecentOutreachTable } from "./components/recent-outreach-table";

export function DashboardPage() {
  const { data: emails = [], isLoading: isLoadingEmails } = useEmailsQuery();
  const { data: emailLists = [], isLoading: isLoadingLists } =
    useEmailListsQuery();
  const { data: partners = [], isLoading: isLoadingPartners } =
    useSeoPartnersQuery();
  const { data: logs = [], isLoading: isLoadingLogs } = useOutreachLogsQuery();
  const { data: campaigns = [], isLoading: isLoadingCampaigns } =
    useCampaignsQuery();

  const isInitialLoading =
    isLoadingEmails ||
    isLoadingLists ||
    isLoadingPartners ||
    isLoadingLogs ||
    isLoadingCampaigns;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time outreach performance, SEO partner pipeline, and campaign
            delivery tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link to="/outreach">
            <Button variant="outline" size="sm">
              <MailIcon className="mr-1.5 h-3.5 w-3.5" />
              Quick Pitch
            </Button>
          </Link>
          <Link to="/bulk-send">
            <Button variant="default" size="sm">
              <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>
      {/* KPI Stats Strip */}
      <DashboardKpiStats
        emails={emails}
        emailLists={emailLists}
        partners={partners}
        logs={logs}
        campaigns={campaigns}
        isLoading={isInitialLoading}
      />
      <OutreachActivityChart logs={logs} isLoading={isLoadingLogs} />
      <RecentOutreachTable logs={logs} isLoading={isLoadingLogs} />
    </div>
  );
}
