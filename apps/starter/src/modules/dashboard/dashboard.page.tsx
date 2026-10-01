import React, { Suspense, lazy } from "react";
import { Link } from "@tanstack/react-router";
import { Button, Card, MailIcon, PlusIcon, Skeleton } from "@z3/admin-core";
import { useSeoPartnersQuery } from "../seo-partner/seo-partner.api";
import {
  useCampaignsQuery,
  useEmailListsQuery,
  useEmailsQuery,
  useOutreachLogsQuery,
} from "../outreach/outreach.api";
import { DashboardKpiStats } from "./components/dashboard-kpi-stats";
import { RecentOutreachTable } from "./components/recent-outreach-table";

const OutreachActivityChart = lazy(() =>
  import("./components/outreach-activity-chart").then((m) => ({
    default: m.OutreachActivityChart,
  })),
);

function ChartSkeleton() {
  return (
    <Card padding="md" className="h-64 sm:h-72 w-full flex flex-col justify-between">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex items-end gap-2 h-44 w-full pt-4">
        <Skeleton className="h-20 flex-1" />
        <Skeleton className="h-32 flex-1" />
        <Skeleton className="h-24 flex-1" />
        <Skeleton className="h-40 flex-1" />
        <Skeleton className="h-28 flex-1" />
        <Skeleton className="h-36 flex-1" />
        <Skeleton className="h-24 flex-1" />
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { data: emailsData, isLoading: isLoadingEmails } = useEmailsQuery();
  const emails = emailsData?.emails ?? [];
  const { data: emailLists = [], isLoading: isLoadingLists } =
    useEmailListsQuery();
  const { data: partners = [], isLoading: isLoadingPartners } =
    useSeoPartnersQuery();
  const { data: logs = [], isLoading: isLoadingLogs } = useOutreachLogsQuery();
  const { data: campaigns = [], isLoading: isLoadingCampaigns } =
    useCampaignsQuery();

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
        isLoadingEmails={isLoadingEmails || isLoadingLists}
        isLoadingPartners={isLoadingPartners}
        isLoadingLogs={isLoadingLogs}
        isLoadingCampaigns={isLoadingCampaigns}
      />
      <Suspense fallback={<ChartSkeleton />}>
        <OutreachActivityChart logs={logs} isLoading={isLoadingLogs} />
      </Suspense>
      <RecentOutreachTable logs={logs} isLoading={isLoadingLogs} />
    </div>
  );
}
