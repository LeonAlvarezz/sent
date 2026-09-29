import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  Button,
  CloseIcon,
  Field,
  FieldLabel,
  Input,
  NativeSelect,
  SearchIcon,
  Tag,
  Textarea,
  toast,
  UsersIcon,
} from "@z3/admin-core";
import {
  useEmailsQuery,
  usePitchProfilesQuery,
  useSendersQuery,
  useOutreachSettingsQuery,
  useCreateCampaignMutation,
} from "./outreach.api";
import { AudienceSelectModal } from "./components/audience-select-modal";

export function BulkSendPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false });

  // Queries
  const { data: allEmails = [] } = useEmailsQuery();
  const { data: senders = [] } = useSendersQuery();
  const { data: pitchProfiles = [] } = usePitchProfilesQuery();
  const { data: settings } = useOutreachSettingsQuery();

  // Mutation
  const createCampaignMutation = useCreateCampaignMutation();

  // Form State (lazy initialization from URL search params)
  const [selectedEmailIds, setSelectedEmailIds] = useState<number[]>(() => {
    if (searchParams.selected) {
      return searchParams.selected
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0);
    }
    return [];
  });
  const [isAudienceModalOpen, setIsAudienceModalOpen] = useState(false);

  const [selectedSenderId, setSelectedSenderId] = useState<string>("");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const subjectInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const activeFieldRef = useRef<"subject" | "body">("body");
  const cursorRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const updateCursor = (
    field: "subject" | "body",
    el: HTMLInputElement | HTMLTextAreaElement,
  ) => {
    activeFieldRef.current = field;
    if (el.selectionStart !== null && el.selectionEnd !== null) {
      cursorRef.current = { start: el.selectionStart, end: el.selectionEnd };
    }
  };

  const handleInsertTag = (tag: string) => {
    const isSubject = activeFieldRef.current === "subject";

    if (isSubject) {
      const input = subjectInputRef.current;
      const start =
        input?.selectionStart ?? cursorRef.current.start ?? subject.length;
      const end =
        input?.selectionEnd ?? cursorRef.current.end ?? subject.length;

      const before = subject.slice(0, start);
      const after = subject.slice(end);
      const nextValue = `${before}${tag}${after}`;
      setSubject(nextValue);

      const nextCursor = start + tag.length;
      cursorRef.current = { start: nextCursor, end: nextCursor };

      requestAnimationFrame(() => {
        if (input) {
          input.focus();
          input.setSelectionRange(nextCursor, nextCursor);
        }
      });
    } else {
      const textarea = bodyTextareaRef.current;
      const start =
        textarea?.selectionStart ?? cursorRef.current.start ?? body.length;
      const end =
        textarea?.selectionEnd ?? cursorRef.current.end ?? body.length;

      const before = body.slice(0, start);
      const after = body.slice(end);
      const nextValue = `${before}${tag}${after}`;
      setBody(nextValue);

      const nextCursor = start + tag.length;
      cursorRef.current = { start: nextCursor, end: nextCursor };

      requestAnimationFrame(() => {
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(nextCursor, nextCursor);
        }
      });
    }
  };

  // Auto-bind default sender when senders load
  useEffect(() => {
    if (senders.length > 0 && !selectedSenderId) {
      const defaultS = senders.find((s) => s.isDefault) ?? senders[0];
      setSelectedSenderId(String(defaultS.id));
    }
  }, [senders, selectedSenderId]);

  useEffect(() => {
    if (
      searchParams.jobTitle &&
      allEmails.length > 0 &&
      selectedEmailIds.length === 0
    ) {
      const matching = allEmails
        .filter(
          (e) =>
            e.status === "active" &&
            e.title?.trim().toLowerCase() ===
              searchParams.jobTitle?.trim().toLowerCase(),
        )
        .map((e) => e.id);
      if (matching.length > 0) {
        setSelectedEmailIds(matching);
      }
    }
  }, [searchParams.jobTitle, allEmails]);

  const handleApplyProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    const profile = pitchProfiles.find((p) => String(p.id) === profileId);
    if (profile) {
      if (!subject) {
        setSubject(`Collaboration Opportunity with ${profile.name}`);
      }
      if (!body) {
        setBody(
          `Hi {{first_name}},\n\n${profile.valueProposition}\n\nBest regards,\n{{sender_name}}`,
        );
      }
    }
  };

  const handleRemoveRecipient = (id: number) => {
    setSelectedEmailIds((prev) => prev.filter((item) => item !== id));
  };

  const handleStartCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedEmailIds.length === 0) {
      toast.error("Please select at least one recipient for this campaign");
      setIsAudienceModalOpen(true);
      return;
    }

    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body are required");
      return;
    }

    const senderId = selectedSenderId ? Number(selectedSenderId) : undefined;
    if (!senderId) {
      toast.error("Please select or configure a sender mailbox in Settings");
      return;
    }

    const campaignName = `Bulk Outreach Campaign (${selectedEmailIds.length} recipients)`;

    try {
      await createCampaignMutation.mutateAsync({
        name: campaignName,
        senderId,
        pitchProfileId: selectedProfileId ? Number(selectedProfileId) : null,
        audienceType: "custom",
        emailIds: selectedEmailIds,
        subject: subject.trim(),
        body: body.trim(),
        delayMinSeconds: settings?.defaultDelayMinSeconds ?? 15,
        delayMaxSeconds: settings?.defaultDelayMaxSeconds ?? 45,
        autoStart: true,
      });

      toast.success(`Queued ${selectedEmailIds.length} emails for delivery!`);
      navigate({ to: "/campaign-queue" });
    } catch (err: any) {
      toast.error(err.message || "Failed to create campaign queue");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Bulk Send
            </h1>
            {senders.length === 0 && (
              <Link to="/settings/mail">
                <Tag
                  color="amber"
                  dot
                  className="cursor-pointer hover:opacity-85 transition-opacity"
                >
                  No Mailbox Connected — Configure in Settings
                </Tag>
              </Link>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Dispatch personalized outreach emails to your selected audience via
            background queue delivery.
          </p>
        </div>
      </div>

      <form onSubmit={handleStartCampaign} className="space-y-6">
        {/* Step 1: Target Audience & Mailbox */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                1. Target Audience
              </h2>
              <p className="text-xs text-muted-foreground">
                Select contacts from your directory to receive this campaign.
              </p>
            </div>
          </div>

          {/* Selected Audience Display */}
          {selectedEmailIds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 px-4 border border-dashed border-border rounded-lg text-center space-y-2 bg-muted/20">
              <UsersIcon className="size-6 text-muted-foreground/60" />
              <div className="text-xs font-medium text-foreground">
                No recipients selected yet
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => setIsAudienceModalOpen(true)}
                className="text-xs mt-1 flex items-center gap-1 px-4 py-2"
              >
                <SearchIcon className="size-3" />
                <span>Browse Audience</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg">
                <div className="flex items-center gap-2">
                  <Tag color="sky" dot>
                    {selectedEmailIds.length} Recipients Selected
                  </Tag>
                  <span className="text-xs text-muted-foreground">
                    Ready for background delivery
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAudienceModalOpen(true)}
                    className="h-7 text-xs px-2.5"
                  >
                    Modify
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEmailIds([])}
                    className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Chips Preview */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {selectedEmailIds.slice(0, 10).map((id) => {
                  const contact = allEmails.find((e) => e.id === id);
                  const fullName = contact
                    ? [contact.firstName, contact.lastName]
                        .filter(Boolean)
                        .join(" ")
                    : "";
                  const label = fullName || contact?.email || `Contact #${id}`;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent text-[11px] text-accent-foreground border border-border"
                    >
                      <span className="truncate max-w-36">{label}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient(id)}
                        className="hover:text-destructive transition-colors cursor-pointer"
                        title="Remove recipient"
                      >
                        <CloseIcon className="size-3" />
                      </button>
                    </span>
                  );
                })}
                {selectedEmailIds.length > 10 && (
                  <button
                    type="button"
                    onClick={() => setIsAudienceModalOpen(true)}
                    className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded bg-muted border border-border/50 cursor-pointer"
                  >
                    +{selectedEmailIds.length - 10} more...
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Mailbox & Template Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border/50">
            <Field>
              <FieldLabel>Sender Mailbox</FieldLabel>
              <NativeSelect
                value={selectedSenderId}
                onChange={(e) => setSelectedSenderId(e.target.value)}
              >
                {senders.length === 0 ? (
                  <option value="">No senders configured</option>
                ) : (
                  senders.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} &lt;{s.email}&gt;{" "}
                      {s.isDefault ? "(Default)" : ""}
                    </option>
                  ))
                )}
              </NativeSelect>
            </Field>

            <Field>
              <FieldLabel>Pitch Profile (Optional)</FieldLabel>
              <NativeSelect
                value={selectedProfileId}
                onChange={(e) => handleApplyProfile(e.target.value)}
              >
                <option value="">Custom (No Template)</option>
                {pitchProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
        </div>

        {/* Step 2: Personalize Message */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              2. Personalize Message
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>Insert Tags:</span>
              {[
                "{{first_name}}",
                "{{last_name}}",
                "{{company_name}}",
                "{{title}}",
                "{{domain_url}}",
                "{{sender_name}}",
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onMouseDown={(e) => {
                    // Prevent button click from stealing focus and losing cursor position
                    e.preventDefault();
                  }}
                  onClick={() => handleInsertTag(tag)}
                  className="px-1.5 py-0.5 rounded bg-accent hover:bg-accent/80 font-mono text-[11px] border border-border text-foreground transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <Field>
            <FieldLabel>
              Subject Line <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              ref={subjectInputRef}
              placeholder="e.g. Quick question regarding {{company_name}}"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                updateCursor("subject", e.currentTarget);
              }}
              onFocus={(e) => updateCursor("subject", e.currentTarget)}
              onClick={(e) => updateCursor("subject", e.currentTarget)}
              onKeyUp={(e) => updateCursor("subject", e.currentTarget)}
              onSelect={(e) => updateCursor("subject", e.currentTarget)}
              required
            />
          </Field>

          <Field>
            <FieldLabel>
              Email Body <span className="text-destructive">*</span>
            </FieldLabel>
            <Textarea
              ref={bodyTextareaRef}
              placeholder="Hi {{first_name}},\n\nI came across {{company_name}} and wanted to connect..."
              rows={9}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                updateCursor("body", e.currentTarget);
              }}
              onFocus={(e) => updateCursor("body", e.currentTarget)}
              onClick={(e) => updateCursor("body", e.currentTarget)}
              onKeyUp={(e) => updateCursor("body", e.currentTarget)}
              onSelect={(e) => updateCursor("body", e.currentTarget)}
              required
            />
          </Field>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {selectedEmailIds.length > 0 ? (
              <span className="font-medium text-foreground">
                🚀 Ready to queue {selectedEmailIds.length} emails for delivery
              </span>
            ) : (
              <span>Select an audience to begin</span>
            )}
          </div>

          <Button
            type="submit"
            disabled={
              createCampaignMutation.isPending ||
              selectedEmailIds.length === 0 ||
              senders.length === 0
            }
          >
            {createCampaignMutation.isPending
              ? "Queuing Campaign..."
              : `🚀 Launch Campaign (${selectedEmailIds.length})`}
          </Button>
        </div>
      </form>

      {/* Audience Selection Modal */}
      <AudienceSelectModal
        isOpen={isAudienceModalOpen}
        setIsOpen={setIsAudienceModalOpen}
        selectedEmailIds={selectedEmailIds}
        onConfirm={(ids) => {
          setSelectedEmailIds(ids);
        }}
        initialJobTitle={searchParams.jobTitle}
      />
    </div>
  );
}
export default BulkSendPage;
