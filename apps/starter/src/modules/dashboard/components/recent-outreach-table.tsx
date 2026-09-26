import React from "react";
import { Link } from "@tanstack/react-router";
import {
  Button,
  Card,
  Tag,
  HistoryIcon,
  ArrowRightLinearIcon,
  formatRelativeTime,
  Skeleton,
  MailIcon,
} from "@z3/admin-core";
import type { OutreachLog } from "@z3/types";
import { OutreachStatusColor } from "../../shared/status-color";

interface RecentOutreachTableProps {
  logs: Array<{
    log: OutreachLog;
    senderName?: string;
    pitchProfileName?: string;
  }>;
  isLoading: boolean;
}

export function RecentOutreachTable({
  logs,
  isLoading,
}: RecentOutreachTableProps) {
  const recentLogs = logs.slice(0, 8);

  return (
    <Card padding="md">
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <HistoryIcon className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">
              Recent Activity Log
            </h2>
            <p className="text-xs text-muted-foreground">
              Latest outreach messages and dispatch status
            </p>
          </div>
        </div>

        <Link to="/outreach">
          <Button
            variant="barebone"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <span>Quick Outreach</span>
            <ArrowRightLinearIcon className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : recentLogs.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border/70 bg-accent/20">
          <MailIcon className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
          <p className="text-xs font-medium text-foreground">
            No outreach activity recorded yet
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 mb-3">
            Use Quick Outreach or Bulk Send to dispatch your first personalized
            pitch
          </p>
          <Link to="/outreach">
            <Button size="sm" variant="outline">
              Compose Cold Pitch
            </Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground">
                <th className="pb-2.5 font-medium">Recipient</th>
                <th className="pb-2.5 font-medium hidden sm:table-cell">
                  Subject
                </th>
                <th className="pb-2.5 font-medium hidden md:table-cell">
                  Pitch Profile
                </th>
                <th className="pb-2.5 font-medium">Status</th>
                <th className="pb-2.5 font-medium text-right">Sent Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {recentLogs.map((item) => {
                const { log, pitchProfileName, senderName } = item;
                return (
                  <tr
                    key={log.id}
                    className="hover:bg-accent/30 transition-colors group"
                  >
                    <td className="py-2.5 pr-3">
                      <div className="font-medium text-foreground truncate max-w-45 sm:max-w-55">
                        {log.recipientEmail}
                      </div>
                      {senderName && (
                        <div className="text-[11px] text-muted-foreground truncate">
                          via {senderName}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 pr-3 hidden sm:table-cell">
                      <span className="text-muted-foreground truncate block max-w-60 lg:max-w-[320px]">
                        {log.subject || "(No subject)"}
                      </span>
                    </td>

                    <td className="py-2.5 pr-3 hidden md:table-cell">
                      <span className="px-2 py-0.5 rounded-md bg-accent/50 border border-border/40 text-[11px] text-muted-foreground truncate inline-block max-w-45">
                        {pitchProfileName || "Default Profile"}
                      </span>
                    </td>

                    <td className="py-2.5 pr-3">
                      <Tag
                        color={OutreachStatusColor[log.status]}
                        className="px-2 py-0.5 text-[11px]"
                      >
                        {log.status.toUpperCase()}
                      </Tag>
                    </td>

                    <td className="py-2.5 text-right text-muted-foreground whitespace-nowrap">
                      {log.sentAt ? formatRelativeTime(log.sentAt) : "Just now"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
