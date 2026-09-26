import React, { useState, useEffect } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import * as v from "valibot";
import {
  Button,
  Card,
  Collapsible,
  Drawer,
  Field,
  FieldError,
  FieldLabel,
  HistoryIcon,
  Input,
  SearchIcon,
  Select,
  SpinnerIcon,
  Tag,
  Textarea,
  toast,
} from "@z3/admin-core";
import {
  useDispatchEmailMutation,
  useGenerateDraftMutation,
  usePitchProfilesQuery,
  useScrapeUrlMutation,
  useSendersQuery,
  useEmailListsQuery,
  useOutreachLogsQuery,
} from "./outreach.api";
import { FOLLOW_UP_ACTION } from "@z3/types";

const FOLLOW_UP_OPTIONS = [
  { value: FOLLOW_UP_ACTION.ALERT, label: "Alert Me (Task)" },
  { value: FOLLOW_UP_ACTION.AUTO_SEND, label: "Auto-Send Follow-up" },
];

export function QuickOutreachPage() {
  const searchParams = useSearch({ strict: false });

  // Scraped page context & discovered email candidates
  const [scrapedTitle, setScrapedTitle] = useState("");
  const [pageContext, setPageContext] = useState("");
  const [candidateEmails, setCandidateEmails] = useState<string[]>([]);
  const [scrapeNoResult, setScrapeNoResult] = useState(false);
  const [activeTone, setActiveTone] = useState<string | null>(null);

  // Sending Controls & Drawer/Collapsible UI state
  const [selectedSenderId, setSelectedSenderId] = useState<number | undefined>(
    undefined,
  );
  const [showOptions, setShowOptions] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  // Queries & Mutations
  const { data: senders } = useSendersQuery();
  const { data: pitchProfiles } = usePitchProfilesQuery();
  const { data: emailLists } = useEmailListsQuery();
  const { data: logs, refetch: refetchLogs } = useOutreachLogsQuery();

  const scrapeMutation = useScrapeUrlMutation();
  const generateMutation = useGenerateDraftMutation();
  const dispatchMutation = useDispatchEmailMutation();

  // Auto-bind default sender
  useEffect(() => {
    if (senders && senders.length > 0 && !selectedSenderId) {
      const defaultSender = senders.find((s) => s.isDefault) || senders[0];
      setSelectedSenderId(defaultSender.id);
    }
  }, [senders, selectedSenderId]);

  const defaultFollowUpDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  })();

  const form = useForm({
    defaultValues: {
      targetUrl: "",
      recipientEmail: "",
      recipientName: "",
      pitchProfileId: undefined as number | undefined,
      customAngle: "",
      selectedListId: undefined as number | undefined,
      subject: "",
      body: "",
      followUpDate: defaultFollowUpDate,
      followUpAction: FOLLOW_UP_ACTION.ALERT,
    },
    onSubmit: async ({ value }) => {
      if (!selectedSenderId) {
        toast.error("Please configure a Sender Identity in Settings");
        return;
      }
      if (!value.recipientEmail.trim()) {
        toast.error("Recipient email is required");
        return;
      }
      if (!value.subject.trim() || !value.body.trim()) {
        toast.error("Subject and body are required");
        return;
      }

      try {
        await dispatchMutation.mutateAsync({
          senderId: selectedSenderId,
          recipientEmail: value.recipientEmail.trim(),
          recipientName: value.recipientName.trim() || undefined,
          listId: value.selectedListId,
          subject: value.subject.trim(),
          body: value.body.trim(),
          pitchProfileId: value.pitchProfileId,
          followUpDate: value.followUpDate || null,
          followUpAction: value.followUpAction,
        });
        toast.success("Outreach email sent successfully!");
        // Reset fields for next recipient
        form.reset();
        setScrapedTitle("");
        setPageContext("");
        setCandidateEmails([]);
        setScrapeNoResult(false);
        refetchLogs();
      } catch (err: any) {
        toast.error(err.message || "Failed to send outreach email");
      }
    },
  });

  // Auto-bind first pitch profile when available
  useEffect(() => {
    if (
      pitchProfiles &&
      pitchProfiles.length > 0 &&
      !form.getFieldValue("pitchProfileId")
    ) {
      form.setFieldValue("pitchProfileId", pitchProfiles[0].id);
    }
  }, [pitchProfiles, form]);

  // Auto-populate targetUrl from search query if present
  useEffect(() => {
    if (searchParams.targetUrl && !form.getFieldValue("targetUrl")) {
      form.setFieldValue("targetUrl", searchParams.targetUrl);
    }
  }, [searchParams.targetUrl, form]);

  const handleScrape = async () => {
    const url = form.getFieldValue("targetUrl").trim();
    if (!url) {
      toast.error("Please enter a target URL to scrape");
      return;
    }
    setScrapeNoResult(false);
    try {
      const result = await scrapeMutation.mutateAsync({
        url,
      });
      setScrapedTitle(result.title || "");
      const contextParts = [
        result.title ? `Title: ${result.title}` : "",
        result.h1 && result.h1 !== result.title ? `Heading: ${result.h1}` : "",
        result.description ? `Description: ${result.description}` : "",
        result.textSnippet ? `Content: ${result.textSnippet}` : "",
      ].filter(Boolean);
      setPageContext(contextParts.join("\n\n"));
      const emails = result.candidateEmails;
      setCandidateEmails(emails);

      if (emails.length > 0 && !form.getFieldValue("recipientEmail")) {
        form.setFieldValue("recipientEmail", emails[0]);
      }

      if (result.siteName && !form.getFieldValue("recipientName")) {
        form.setFieldValue("recipientName", result.siteName);
      }

      const hasEmails = emails.length > 0;

      const hasContent = Boolean(
        result.title.trim() ||
        result.textSnippet.trim() ||
        result.description.trim(),
      );

      if (!hasEmails && !hasContent) {
        setScrapeNoResult(true);
        toast.warning(
          "Scrape completed, but no content or contact emails could be found on this page.",
        );
      } else if (hasEmails && hasContent) {
        toast.success(
          `Found ${emails.length} email(s) and extracted page context`,
        );
      } else if (hasEmails) {
        toast.success(
          `Found ${emails.length} email(s) on target page`,
        );
      } else {
        toast.info(
          "Page content scraped, but no email addresses were found on the page.",
        );
      }
    } catch (err: any) {
      setScrapeNoResult(true);
      toast.error(err.message || "Failed to scrape page");
    }
  };

  const handleGenerate = async (toneModifier?: string) => {
    setActiveTone(toneModifier || "default");
    try {
      const values = form.state.values;
      const draft = await generateMutation.mutateAsync({
        targetUrl: values.targetUrl.trim() || undefined,
        pageContext: pageContext.trim() || undefined,
        recipientName: values.recipientName.trim() || undefined,
        recipientEmail: values.recipientEmail.trim() || undefined,
        pitchProfileId: values.pitchProfileId,
        customAngle: values.customAngle.trim() || undefined,
        toneModifier,
      });
      form.setFieldValue("subject", draft.subject);
      form.setFieldValue("body", draft.body);

      const toneLabelMap: Record<string, string> = {
        punchy: "Punchy (<60w)",
        casual: "Casual",
        value: "Value-First",
        "follow-up": "Follow-up",
      };
      const label = toneModifier
        ? toneLabelMap[toneModifier] || toneModifier
        : "Standard";
      toast.success(`${label} draft generated successfully`);
    } catch (err: any) {
      toast.error(err.message || "Draft generation failed");
    } finally {
      setActiveTone(null);
    }
  };

  const pitchProfileOptions = (pitchProfiles ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const audienceListOptions = [
    { value: 0, label: "Do not assign to list" },
    ...(emailLists ?? []).map((list) => ({
      value: list.id,
      label: `${list.name} (${list.emailCount} emails)`,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="gap-1 flex flex-col">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Quick Outreach
            </h1>
            {senders && senders.length === 0 && (
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
          <p className="text-xs sm:text-sm text-muted-foreground">
            Draft personalized 1-to-1 backlink outreach and dispatch directly
            from your inbox.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            onClick={() => setIsActivityOpen(true)}
            className="relative"
          >
            <div className="flex justify-center items-center gap-2">
              <HistoryIcon />
              Activity History
            </div>
            {logs && logs.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-primary/20 text-primary font-semibold">
                {logs.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Main Mailbox Canvas Form Card */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Card className="border-border shadow-xs">
          {/* Email Header Fields */}
          <div className="p-4 sm:p-6 border-b border-border space-y-4">
            {/* Target Article / URL Scrape Row */}
            <form.Field name="targetUrl">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Target Partner Page
                  </FieldLabel>
                  <div className="flex gap-2 w-full">
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                        if (scrapeNoResult) setScrapeNoResult(false);
                      }}
                      placeholder="https://littlegreybox.net/2026/halong-bay-guide"
                      containerClassName="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleScrape}
                      disabled={scrapeMutation.isPending}
                      className="shrink-0"
                    >
                      {scrapeMutation.isPending ? (
                        <SpinnerIcon />
                      ) : (
                        <div className="flex gap-2 justify-center items-center">
                          <SearchIcon />
                          Scrape
                        </div>
                      )}
                    </Button>
                  </div>
                </Field>
              )}
            </form.Field>

            {/* Scrape Warning when no result found */}
            {scrapeNoResult && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
                <span className="flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>
                    <strong>No information returned:</strong> Could not extract
                    content or contact emails from this URL (it may be protected
                    by anti-bot verification or rendered via client-side
                    JavaScript). You can manually fill in recipient details or
                    click <strong>AI Draft</strong> to generate a tailored
                    pitch.
                  </span>
                </span>
                <Button
                  type="button"
                  variant="barebone"
                  size="sm"
                  onClick={() => setScrapeNoResult(false)}
                  className="text-xs underline ml-2 shrink-0 h-auto p-0 text-amber-700 dark:text-amber-400 hover:opacity-75"
                >
                  Dismiss
                </Button>
              </div>
            )}

            {/* Scraped Context & Candidate Emails if found */}
            {(scrapedTitle || candidateEmails.length > 0) && (
              <div className="p-3 bg-muted/30 rounded-lg border border-border space-y-2 text-xs">
                {scrapedTitle && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground font-medium truncate">
                      <strong>Page:</strong> {scrapedTitle}
                    </span>
                    <Tag color="emerald" dot={false}>
                      Scraped
                    </Tag>
                  </div>
                )}
                {candidateEmails.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/60">
                    <span className="text-muted-foreground font-medium">
                      Found Emails (click to use):
                    </span>
                    {candidateEmails.map((email) => (
                      <form.Subscribe
                        key={email}
                        selector={(state) => state.values.recipientEmail}
                      >
                        {(currentEmail) => {
                          const isSelected = currentEmail === email;
                          return (
                            <Button
                              key={email}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() =>
                                form.setFieldValue("recipientEmail", email)
                              }
                              className="h-6 text-xs px-2.5 rounded-full font-medium"
                            >
                              {isSelected && "✓ "}
                              {email}
                            </Button>
                          );
                        }}
                      </form.Subscribe>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recipient Email, Name, and Pitch Profile */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-4">
                <form.Field
                  name="recipientEmail"
                  validators={{
                    onBlur: v.pipe(
                      v.string(),
                      v.email("Please enter a valid email address"),
                    ),
                  }}
                >
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field>
                        <FieldLabel htmlFor={field.name} required>
                          Recipient Email
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="editor@littlegreybox.net"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
              </div>
              <div className="md:col-span-4">
                <form.Field name="recipientName">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Recipient Name
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. Little Grey Box or Alex"
                      />
                    </Field>
                  )}
                </form.Field>
              </div>
              <div className="md:col-span-4">
                <form.Field name="pitchProfileId">
                  {(field) => (
                    <Field>
                      <FieldLabel>Pitch Profile</FieldLabel>
                      <Select
                        value={field.state.value}
                        onChange={(val) =>
                          field.handleChange(val ? Number(val) : undefined)
                        }
                        options={pitchProfileOptions}
                        placeholder="Select a pitch angle..."
                      />
                    </Field>
                  )}
                </form.Field>
              </div>
            </div>

            {/* Expandable Advanced Options */}
            <Collapsible
              open={showOptions}
              onOpenChange={setShowOptions}
              className="w-full"
            >
              <div className="pt-1 flex items-center justify-between text-xs">
                <Collapsible.Trigger className="text-muted-foreground hover:text-foreground font-medium flex items-center gap-1.5 transition-colors">
                  {showOptions
                    ? "Hide Pitch Context & Audience Options"
                    : "Add Pitch Angle / Save to Audience List"}
                </Collapsible.Trigger>
              </div>

              <Collapsible.Content className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-border mt-1">
                <form.Field name="customAngle">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Pitch Hook / Specific Angle
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        placeholder="e.g. Broken link on #4, Indochina logistics, or custom travel planning tool"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="selectedListId">
                  {(field) => (
                    <Field>
                      <FieldLabel>Save Contact to Audience List</FieldLabel>
                      <Select
                        value={field.state.value ?? 0}
                        onChange={(val) =>
                          field.handleChange(
                            val && Number(val) > 0 ? Number(val) : undefined,
                          )
                        }
                        options={audienceListOptions}
                      />
                    </Field>
                  )}
                </form.Field>
              </Collapsible.Content>
            </Collapsible>
          </div>

          {/* AI Generator Action Bar (Planted Directly Above Email Content) */}
          <div className="bg-muted/30 px-4 sm:px-6 py-2.5 border-b border-border flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => handleGenerate()}
                disabled={generateMutation.isPending}
                className="font-medium"
              >
                {generateMutation.isPending &&
                (activeTone === "default" || !activeTone) ? (
                  <div className="flex items-center gap-1.5">
                    <SpinnerIcon className="size-3.5" />
                    <span>Drafting...</span>
                  </div>
                ) : (
                  "✨ AI Draft"
                )}
              </Button>
              <span className="text-xs text-muted-foreground hidden md:inline">
                or quick rewrite tone:
              </span>
            </div>

            {/* Quick AI Presets & Angle Actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                type="button"
                size="sm"
                variant={activeTone === "punchy" ? "secondary" : "outline"}
                onClick={() => handleGenerate("punchy")}
                disabled={generateMutation.isPending}
                className="text-xs h-7 px-2.5"
              >
                {generateMutation.isPending && activeTone === "punchy" ? (
                  <SpinnerIcon className="size-3 mr-1" />
                ) : null}
                ⚡ Punchy (&lt;60w)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeTone === "casual" ? "secondary" : "outline"}
                onClick={() => handleGenerate("casual")}
                disabled={generateMutation.isPending}
                className="text-xs h-7 px-2.5"
              >
                {generateMutation.isPending && activeTone === "casual" ? (
                  <SpinnerIcon className="size-3 mr-1" />
                ) : null}
                ☕ Casual
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeTone === "value" ? "secondary" : "outline"}
                onClick={() => handleGenerate("value")}
                disabled={generateMutation.isPending}
                className="text-xs h-7 px-2.5"
              >
                {generateMutation.isPending && activeTone === "value" ? (
                  <SpinnerIcon className="size-3 mr-1" />
                ) : null}
                💎 Value-First
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeTone === "follow-up" ? "secondary" : "outline"}
                onClick={() => handleGenerate("follow-up")}
                disabled={generateMutation.isPending}
                className="text-xs h-7 px-2.5"
              >
                {generateMutation.isPending && activeTone === "follow-up" ? (
                  <SpinnerIcon className="size-3 mr-1" />
                ) : null}
                🔄 Follow-up
              </Button>
            </div>
          </div>

          {/* Email Body Canvas */}
          <div className="p-4 sm:p-6 bg-card space-y-4">
            <form.Field
              name="subject"
              validators={{
                onBlur: v.pipe(
                  v.string(),
                  v.minLength(1, "Subject line is required"),
                ),
              }}
            >
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field>
                    <FieldLabel htmlFor={field.name} required>
                      Subject Line
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Subject will be generated by AI Draft, or enter custom subject..."
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field
              name="body"
              validators={{
                onBlur: v.pipe(
                  v.string(),
                  v.minLength(1, "Email body is required"),
                ),
              }}
            >
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <div>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      rows={12}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Type your email here, or click '✨ AI Draft' or any tone preset above to automatically generate a structured outreach pitch..."
                      containerClassName="border-0 p-0 shadow-none focus-within:ring-0 focus-within:border-transparent"
                      className="w-full resize-none font-sans text-sm leading-relaxed p-0 bg-transparent placeholder:text-muted-foreground/60"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </div>
                );
              }}
            </form.Field>
          </div>

          {/* Bottom Bar: Follow-up Configuration & Send Action */}
          <div className="px-4 sm:px-6 py-4 bg-muted/20 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Follow-up reminder controls */}
            <Collapsible
              open={showFollowUp}
              onOpenChange={setShowFollowUp}
              className="flex flex-wrap items-center gap-3 text-xs"
            >
              <Collapsible.Trigger className="text-xs font-medium text-muted-foreground hover:text-foreground">
                Follow-up Reminder:
              </Collapsible.Trigger>
              <Collapsible.Content className="flex items-center gap-2">
                <form.Field name="followUpDate">
                  {(field) => (
                    <Input
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      containerClassName="h-8 w-36"
                      className="text-xs"
                    />
                  )}
                </form.Field>
                <div className="w-44">
                  <form.Field name="followUpAction">
                    {(field) => (
                      <Select
                        value={field.state.value}
                        onChange={(val) =>
                          field.handleChange(val as FOLLOW_UP_ACTION)
                        }
                        options={FOLLOW_UP_OPTIONS}
                      />
                    )}
                  </form.Field>
                </div>
              </Collapsible.Content>
            </Collapsible>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.setFieldValue("subject", "");
                  form.setFieldValue("body", "");
                }}
              >
                Clear
              </Button>
              <form.Subscribe
                selector={(state) => [
                  state.isSubmitting,
                  state.values.recipientEmail,
                  state.values.subject,
                ]}
              >
                {([isSubmitting, recipientEmail, subject]) => (
                  <Button
                    type="submit"
                    variant="default"
                    disabled={
                      dispatchMutation.isPending ||
                      Boolean(isSubmitting) ||
                      !recipientEmail ||
                      !subject
                    }
                    className="px-5 font-semibold"
                  >
                    {dispatchMutation.isPending || isSubmitting
                      ? "Dispatching..."
                      : "Send"}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </div>
        </Card>
      </form>

      {/* Activity History Drawer */}
      <Drawer
        open={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        title="Outreach Activity & Delivery Log"
      >
        <div className="p-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Dispatched emails and scheduled follow-ups across your connected
            mailbox.
          </p>
          {logs && logs.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-lg text-sm text-muted-foreground">
              No outreach messages logged yet.
            </div>
          ) : (
            <div className="divide-y divide-border border border-border rounded-lg bg-card overflow-hidden">
              {logs?.map(({ log, senderName }) => (
                <div
                  key={log.id}
                  className="p-3.5 space-y-2 text-sm hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {log.recipientEmail}
                      </span>
                      <Tag color="emerald" dot={false}>
                        {log.status}
                      </Tag>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Via {senderName || "Default Mailbox"}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-foreground">
                    {log.subject}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 font-mono bg-muted/40 p-2 rounded">
                    {log.body}
                  </p>
                  {log.followUpDate && (
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span>
                        Follow-up Date:{" "}
                        <strong className="text-foreground">
                          {log.followUpDate}
                        </strong>
                      </span>
                      <span className="capitalize">
                        Rule: {log.followUpAction?.replace("_", " ")}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
