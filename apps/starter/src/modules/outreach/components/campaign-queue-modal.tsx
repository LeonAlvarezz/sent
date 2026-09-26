import React, { useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Tag,
  formatDate,
} from "@z3/admin-core";
import {
  useCampaignQuery,
  useCampaignItemsQuery,
  useTickCampaignMutation,
  useRetryCampaignMutation,
} from "../outreach.api";

export interface CampaignQueueModalProps {
  campaignId: number | null;
  onClose: () => void;
}

export function CampaignQueueModal({
  campaignId,
  onClose,
}: CampaignQueueModalProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: campaign } = useCampaignQuery(campaignId ?? undefined);
  const { data: itemsData, isLoading } = useCampaignItemsQuery(
    campaignId ?? undefined,
    statusFilter === "all" ? undefined : { status: statusFilter },
  );

  const tickMutation = useTickCampaignMutation();
  const retryMutation = useRetryCampaignMutation();

  if (!campaignId) return null;

  const items = itemsData?.items || [];
  const percent = campaign?.totalCount
    ? Math.round(((campaign.sentCount + campaign.failedCount) / campaign.totalCount) * 100)
    : 0;

  return (
    <Modal
      isOpen={Boolean(campaignId)}
      setIsOpen={(open) => !open && onClose()}
      size="xl"
    >
      <ModalHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <ModalTitle>Campaign Queue: {campaign?.name || `#${campaignId}`}</ModalTitle>
            <ModalDescription>
              Target Audience: {campaign?.listName || "Audience List"} • Mailbox:{" "}
              {campaign?.senderEmail}
            </ModalDescription>
          </div>
          {campaign && (
            <Tag
              color={
                campaign.status === "running"
                  ? "emerald"
                  : campaign.status === "paused"
                    ? "amber"
                    : campaign.status === "completed"
                      ? "sky"
                      : "zinc"
              }
            >
              {campaign.status.toUpperCase()}
            </Tag>
          )}
        </div>
      </ModalHeader>

      <ModalBody className="space-y-4">
        {/* Progress Metric Bar */}
        <div className="bg-accent/40 rounded-xl p-4 border border-border space-y-2">
          <div className="flex justify-between items-center text-xs font-medium">
            <span className="text-muted-foreground">Queue Delivery Progress</span>
            <span className="text-foreground font-semibold">
              {campaign?.sentCount || 0} / {campaign?.totalCount || 0} sent ({percent}%)
            </span>
          </div>
          <div className="w-full bg-border rounded-full h-2 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{
                width: `${campaign?.totalCount ? ((campaign.sentCount || 0) / campaign.totalCount) * 100 : 0}%`,
              }}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-300"
              style={{
                width: `${campaign?.totalCount ? ((campaign.failedCount || 0) / campaign.totalCount) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {campaign?.sentCount || 0} Delivered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              {campaign?.failedCount || 0} Failed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-400 inline-block" />
              {(campaign?.totalCount || 0) -
                ((campaign?.sentCount || 0) + (campaign?.failedCount || 0))}{" "}
              Remaining
            </span>
            <span className="ml-auto">
              Throttle: {campaign?.delayMinSeconds || 15}–{campaign?.delayMaxSeconds || 45}s drip interval
            </span>
          </div>
        </div>

        {/* Filter Tabs & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            {(["all", "pending", "sending", "sent", "failed"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? "bg-accent text-accent-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {campaign?.status === "running" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => tickMutation.mutate({ id: campaign.id, batchSize: 2 })}
                disabled={tickMutation.isPending}
              >
                {tickMutation.isPending ? "Sending..." : "⚡ Process Next Item"}
              </Button>
            )}
            {campaign && campaign.failedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => retryMutation.mutate(campaign.id)}
                disabled={retryMutation.isPending}
              >
                {retryMutation.isPending ? "Retrying..." : "Retry Failed"}
              </Button>
            )}
          </div>
        </div>

        {/* Queue Items Table */}
        <div className="border border-border rounded-lg overflow-hidden max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Loading queue items...
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No items in this queue filter.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-accent/50 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider sticky top-0 backdrop-blur-xs">
                <tr>
                  <th className="py-2 px-3">Recipient</th>
                  <th className="py-2 px-3">Subject</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Delivery Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-accent/20 transition-colors">
                    <td className="py-2 px-3 font-medium text-foreground">
                      <div>{item.recipientEmail}</div>
                      {item.recipientName && (
                        <div className="text-[10px] text-muted-foreground">
                          {item.recipientName}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 max-w-[200px] truncate text-muted-foreground">
                      {item.renderedSubject}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <Tag
                        color={
                          item.status === "sent"
                            ? "emerald"
                            : item.status === "sending"
                              ? "amber"
                              : item.status === "failed"
                                ? "rose"
                                : "zinc"
                        }
                      >
                        {item.status}
                      </Tag>
                    </td>
                    <td className="py-2 px-3 text-[11px] text-muted-foreground">
                      {item.status === "sent" && item.sentAt ? (
                        <span>{formatDate(new Date(item.sentAt))}</span>
                      ) : item.status === "failed" ? (
                        <span className="text-destructive truncate block max-w-xs" title={item.errorMessage || undefined}>
                          {item.errorMessage || "Failed"}
                        </span>
                      ) : item.status === "sending" ? (
                        <span className="text-amber-500 animate-pulse">Dispatching...</span>
                      ) : (
                        <span>Queued</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="default" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}
