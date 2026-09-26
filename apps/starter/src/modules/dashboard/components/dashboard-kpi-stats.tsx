import React from "react";
import {
  Card,
  Skeleton,
  formatNumber,
  UsersIcon,
  MailIcon,
  LinkIcon,
  CompassIcon,
} from "@z3/admin-core";
import type {
  CampaignWithRelations,
  Email,
  EmailList,
  OutreachLog,
  SeoPartner,
} from "@z3/types";

interface DashboardKpiStatsProps {
  emails: Email[];
  emailLists: EmailList[];
  partners: SeoPartner[];
  logs: Array<{ log: OutreachLog; senderName?: string; pitchProfileName?: string }>;
  campaigns: CampaignWithRelations[];
  isLoading: boolean;
}

export function DashboardKpiStats({
  emails,
  emailLists,
  partners,
  logs,
  campaigns,
  isLoading,
}: DashboardKpiStatsProps) {
  // 1. Total Contacts & Replied
  const totalContacts = emails.length;
  const repliedContacts = emails.filter((e) => e.status === "replied").length;
  const replyRate =
    totalContacts > 0
      ? ((repliedContacts / totalContacts) * 100).toFixed(1)
      : "0";

  // 2. Outreach Dispatched & Delivered
  const totalOutreach = logs.length;
  const deliveredOutreach = logs.filter(
    (item) => item.log.status === "delivered" || item.log.status === "sent",
  ).length;
  const deliveryRate =
    totalOutreach > 0
      ? ((deliveredOutreach / totalOutreach) * 100).toFixed(0)
      : "100";

  // 3. SEO Partners & Outreached
  const totalPartners = partners.length;
  const outreachedPartners = partners.filter(
    (p) => p.outreachStatus !== "not_started",
  ).length;
  const partnerCoverage =
    totalPartners > 0
      ? ((outreachedPartners / totalPartners) * 100).toFixed(0)
      : "0";
  const validDrs = partners.filter((p) => typeof p.dr === "number" && p.dr > 0);
  const avgDr =
    validDrs.length > 0
      ? Math.round(
          validDrs.reduce((acc, p) => acc + (p.dr || 0), 0) / validDrs.length,
        )
      : 0;

  // 4. Active Bulk Campaigns
  const activeCampaigns = campaigns.filter(
    (c) => c.status === "running" || c.status === "queued",
  );
  const totalCampaigns = campaigns.length;

  const kpis = [
    {
      title: "Total Contacts",
      value: totalContacts,
      subtitle: `Across ${emailLists.length} audience list${emailLists.length === 1 ? "" : "s"}`,
      badge:
        repliedContacts > 0
          ? `${replyRate}% replied`
          : `${emailLists.length} lists`,
      badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      icon: UsersIcon,
      iconColor: "bg-sky-500/10 text-sky-500 border-sky-500/20",
    },
    {
      title: "Outreach Dispatched",
      value: totalOutreach,
      subtitle: `${deliveredOutreach} delivered (${deliveryRate}%)`,
      badge: `${deliveryRate}% success`,
      badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      icon: MailIcon,
      iconColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    {
      title: "SEO Partners",
      value: totalPartners,
      subtitle: `${outreachedPartners} contacted (${partnerCoverage}% coverage)`,
      badge: avgDr > 0 ? `Avg DR ${avgDr}` : `${totalPartners} partners`,
      badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      icon: LinkIcon,
      iconColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    },
    {
      title: "Active Campaigns",
      value: activeCampaigns.length,
      subtitle: `${totalCampaigns} total campaigns created`,
      badge:
        activeCampaigns.length > 0
          ? `${activeCampaigns.length} running`
          : "All caught up",
      badgeColor:
        activeCampaigns.length > 0
          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 animate-pulse"
          : "bg-stone-500/10 text-stone-600 border-stone-500/20",
      icon: CompassIcon,
      iconColor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.title} padding="sm" className="relative overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {kpi.title}
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg border ${kpi.iconColor}`}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-2.5 flex items-baseline gap-2">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {formatNumber(kpi.value)}
                </span>
              )}
              {!isLoading && (
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${kpi.badgeColor}`}
                >
                  {kpi.badge}
                </span>
              )}
            </div>

            <p className="mt-1.5 text-xs text-muted-foreground truncate">
              {isLoading ? <Skeleton className="h-4 w-36" /> : kpi.subtitle}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
