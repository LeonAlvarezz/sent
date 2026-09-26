import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button, PlusIcon, Tag, formatDate } from "@z3/admin-core";
import {
  useCampaignsQuery,
  useStartCampaignMutation,
  usePauseCampaignMutation,
  useResumeCampaignMutation,
  useCancelCampaignMutation,
  useRetryCampaignMutation,
  useTickCampaignMutation,
} from "./outreach.api";
import { CampaignQueueModal } from "./components/campaign-queue-modal";

export function CampaignQueuePage() {
  const { data: campaigns = [], isLoading } = useCampaignsQuery();

  const startCampaignMutation = useStartCampaignMutation();
  const pauseCampaignMutation = usePauseCampaignMutation();
  const resumeCampaignMutation = useResumeCampaignMutation();
  const cancelCampaignMutation = useCancelCampaignMutation();
  const retryCampaignMutation = useRetryCampaignMutation();
  const tickCampaignMutation = useTickCampaignMutation();

  const [inspectedCampaignId, setInspectedCampaignId] = useState<number | null>(
    null,
  );

  const activeCount = campaigns.filter(
    (c) => c.status === "running" || c.status === "queued",
  ).length;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Email Queue
            </h1>
            {activeCount > 0 && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {activeCount} Active
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time status, delivery progress, and controls for background
            campaign email queues.
          </p>
        </div>

        <Link to="/bulk-send">
          <Button variant="default">
            <PlusIcon className="mr-1" />
            New
          </Button>
        </Link>
      </div>

      {/* Campaigns List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground bg-card border border-border rounded-xl">
          Loading email delivery queues...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="p-12 text-center text-xs text-muted-foreground bg-card border border-border rounded-xl space-y-3">
          <p className="text-base font-semibold text-foreground">
            No Campaign Queues Found
          </p>
          <p className="max-w-md mx-auto">
            You haven't launched any bulk email campaigns yet. Launch a campaign
            from the Bulk Send page to start delivering queued outreach.
          </p>
          <Link to="/bulk-send">
            <Button variant="default" size="sm" className="mt-2">
              Go to Bulk Send
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((camp) => {
            const total = camp.totalCount || 0;
            const sent = camp.sentCount || 0;
            const failed = camp.failedCount || 0;
            const processed = sent + failed;
            const percent =
              total > 0 ? Math.round((processed / total) * 100) : 0;

            const isRunning = camp.status === "running";
            const isPaused = camp.status === "paused";
            const isQueued = camp.status === "queued";
            const isCompleted = camp.status === "completed";

            return (
              <div
                key={camp.id}
                className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4 transition-all hover:border-border/80"
              >
                {/* Title & Status Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground">
                        {camp.name}
                      </h2>
                      <Tag
                        color={
                          isRunning
                            ? "emerald"
                            : isPaused
                              ? "amber"
                              : isCompleted
                                ? "sky"
                                : isQueued
                                  ? "zinc"
                                  : "rose"
                        }
                      >
                        {camp.status.toUpperCase()}
                      </Tag>
                      {isRunning && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Audience:{" "}
                      <span className="text-foreground font-medium">
                        {camp.listName}
                      </span>{" "}
                      • Mailbox:{" "}
                      <span className="text-foreground font-medium">
                        {camp.senderEmail}
                      </span>{" "}
                      • Created: {formatDate(new Date(camp.createdAt))}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {isRunning && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => pauseCampaignMutation.mutate(camp.id)}
                          disabled={pauseCampaignMutation.isPending}
                        >
                          ⏸ Pause
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            tickCampaignMutation.mutate({
                              id: camp.id,
                              batchSize: 2,
                            })
                          }
                          disabled={tickCampaignMutation.isPending}
                          title="Process next pending items in queue immediately"
                        >
                          ⚡ Process Step
                        </Button>
                      </>
                    )}

                    {isPaused && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resumeCampaignMutation.mutate(camp.id)}
                        disabled={resumeCampaignMutation.isPending}
                      >
                        ▶ Resume
                      </Button>
                    )}

                    {isQueued && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => startCampaignMutation.mutate(camp.id)}
                        disabled={startCampaignMutation.isPending}
                      >
                        ▶ Start Queue
                      </Button>
                    )}

                    {failed > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryCampaignMutation.mutate(camp.id)}
                        disabled={retryCampaignMutation.isPending}
                      >
                        🔄 Retry Failed ({failed})
                      </Button>
                    )}

                    {!isCompleted && camp.status !== "cancelled" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelCampaignMutation.mutate(camp.id)}
                        disabled={cancelCampaignMutation.isPending}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        Cancel
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setInspectedCampaignId(camp.id)}
                    >
                      🔍 View Queue ({total})
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">
                      {isCompleted
                        ? "Campaign Completed"
                        : isRunning
                          ? "Sending in progress..."
                          : isPaused
                            ? "Campaign Paused"
                            : "Queued"}
                    </span>
                    <span className="font-semibold text-foreground">
                      {sent} / {total} delivered ({percent}%)
                    </span>
                  </div>

                  <div className="w-full bg-border rounded-full h-2 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${total ? (sent / total) * 100 : 0}%` }}
                    />
                    <div
                      className="bg-rose-500 h-full transition-all duration-300"
                      style={{
                        width: `${total ? (failed / total) * 100 : 0}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-0.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {sent} Sent
                    </span>
                    {failed > 0 && (
                      <span className="flex items-center gap-1.5 text-destructive font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {failed} Failed
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                      {Math.max(0, total - (sent + failed))} Remaining
                    </span>
                    <span className="ml-auto text-[11px]">
                      Throttle: {camp.delayMinSeconds}–{camp.delayMaxSeconds}s
                      drip delay
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Queue Details Inspection Modal */}
      {inspectedCampaignId && (
        <CampaignQueueModal
          campaignId={inspectedCampaignId}
          onClose={() => setInspectedCampaignId(null)}
        />
      )}
    </div>
  );
}
