import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRightLinearIcon,
  Button,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  Collapsible,
  Drawer,
  Field,
  FieldLabel,
  Input,
  MailIcon,
  SearchIcon,
  Select,
  SpinnerIcon,
  Tag,
  Textarea,
  toast,
} from "@z3/admin-core";
import { FOLLOW_UP_ACTION, SEO_PARTNER_STATUS } from "@z3/types";
import type { SeoPartner } from "@z3/types";
import { SeoPartnerStatusColor } from "@/modules/shared/status-color";
import {
  useDispatchEmailMutation,
  useGenerateDraftMutation,
  usePitchProfilesQuery,
  useScrapeUrlMutation,
  useSendersQuery,
} from "../../outreach/outreach.api";
import { useUpdateSeoPartnerMutation } from "../seo-partner.api";

export interface SeoPartnerOutreachDrawerProps {
  open: boolean;
  onClose: () => void;
  partner: SeoPartner | null;
  partners: SeoPartner[];
  onSelectPartner: (partner: SeoPartner) => void;
}

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  outreached: "Outreached",
  overbudget: "Overbudget",
  in_progress: "In Progress",
  accepted: "Accepted",
  rejected: "Rejected",
};

export function SeoPartnerOutreachDrawer({
  open,
  onClose,
  partner,
  partners,
  onSelectPartner,
}: SeoPartnerOutreachDrawerProps) {
  // Queries
  const { data: senders } = useSendersQuery();
  const { data: pitchProfiles } = usePitchProfilesQuery();

  // Mutations
  const scrapeMutation = useScrapeUrlMutation();
  const generateMutation = useGenerateDraftMutation();
  const dispatchMutation = useDispatchEmailMutation();
  const updatePartnerMutation = useUpdateSeoPartnerMutation();

  // Selected config
  const [selectedSenderId, setSelectedSenderId] = useState<number | undefined>(
    undefined,
  );
  const [selectedPitchProfileId, setSelectedPitchProfileId] = useState<
    number | undefined
  >(undefined);

  // Form fields
  const [targetUrl, setTargetUrl] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [customAngle, setCustomAngle] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });

  // Scrape & AI draft states
  const [candidateEmails, setCandidateEmails] = useState<string[]>([]);
  const [pageContext, setPageContext] = useState("");
  const [scrapeNoResult, setScrapeNoResult] = useState(false);
  const [activeTone, setActiveTone] = useState<string | null>(null);
  const [showAngle, setShowAngle] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Auto-bind default sender
  useEffect(() => {
    if (senders && senders.length > 0 && !selectedSenderId) {
      const defaultSender = senders.find((s) => s.isDefault) || senders[0];
      setSelectedSenderId(defaultSender.id);
    }
  }, [senders, selectedSenderId]);

  // Auto-bind first pitch profile
  useEffect(() => {
    if (pitchProfiles && pitchProfiles.length > 0 && !selectedPitchProfileId) {
      setSelectedPitchProfileId(pitchProfiles[0].id);
    }
  }, [pitchProfiles, selectedPitchProfileId]);

  // Navigation & list filtering states
  const [filterUncontacted, setFilterUncontacted] = useState(false);

  const activeList: SeoPartner[] = useMemo(() => {
    if (filterUncontacted) {
      return partners.filter(
        (p) => p.outreachStatus === SEO_PARTNER_STATUS.NOT_STARTED,
      );
    }
    return partners;
  }, [partners, filterUncontacted]);

  // Partner position & navigation calculations
  const currentIndex = partner
    ? activeList.findIndex((p) => p.id === partner.id)
    : -1;
  const uncontactedPartners = partners.filter(
    (p) => p.outreachStatus === SEO_PARTNER_STATUS.NOT_STARTED,
  );
  const uncontactedCount = uncontactedPartners.length;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < activeList.length - 1;
  const prevPartner = hasPrev ? activeList[currentIndex - 1] : null;
  const nextPartner = hasNext ? activeList[currentIndex + 1] : null;

  const nextUncontactedPartner =
    partners.find(
      (p, idx) =>
        idx >
          (partner
            ? partners.findIndex((item) => item.id === partner.id)
            : -1) && p.outreachStatus === SEO_PARTNER_STATUS.NOT_STARTED,
    ) ||
    partners.find(
      (p) =>
        p.id !== partner?.id &&
        p.outreachStatus === SEO_PARTNER_STATUS.NOT_STARTED,
    );

  const partnerOptions = useMemo(() => {
    return activeList.map((p) => ({
      value: p.id,
      label: p.website,
      description: `${p.url} · DR ${p.dr ?? "—"} · ${STATUS_LABELS[p.outreachStatus] || p.outreachStatus}`,
      keywords: [p.website, p.url, p.backlinkFor || "", p.outreachStatus],
    }));
  }, [activeList]);

  // Reset form and auto-scrape when partner changes
  useEffect(() => {
    if (!open || !partner) return;

    setTargetUrl(partner.url || "");
    setRecipientEmail(partner.contactEmail || "");
    setRecipientName(partner.website || "");
    setSubject("");
    setBody("");
    setCustomAngle("");
    setCandidateEmails([]);
    setPageContext("");
    setScrapeNoResult(false);
    setActiveTone(null);

    if (partner.url) {
      let isSubscribed = true;
      scrapeMutation
        .mutateAsync({ url: partner.url })
        .then((result) => {
          if (!isSubscribed) return;
          const contextParts = [
            result.title ? `Title: ${result.title}` : "",
            result.h1 && result.h1 !== result.title ? `Heading: ${result.h1}` : "",
            result.description ? `Description: ${result.description}` : "",
            result.textSnippet ? `Content: ${result.textSnippet}` : "",
          ].filter(Boolean);
          setPageContext(contextParts.join("\n\n"));
          const emails = result.candidateEmails;
          setCandidateEmails(emails);

          // If partner had no email stored, pre-fill with first discovered email
          if (emails.length > 0 && !partner.contactEmail) {
            setRecipientEmail(emails[0]);
          }

          if (result.siteName && !partner.website) {
            setRecipientName(result.siteName);
          }

          if (
            !emails.length &&
            !result.title.trim() &&
            !result.textSnippet.trim()
          ) {
            setScrapeNoResult(true);
          }
        })
        .catch(() => {
          if (!isSubscribed) return;
          setScrapeNoResult(true);
        });

      return () => {
        isSubscribed = false;
      };
    }
  }, [open, partner?.id]);

  // Manual re-scrape handler
  const handleManualScrape = async () => {
    const url = targetUrl.trim();
    if (!url) {
      toast.error("Please enter a target URL to scrape");
      return;
    }
    setScrapeNoResult(false);
    try {
      const result = await scrapeMutation.mutateAsync({ url });
      const contextParts = [
        result.title ? `Title: ${result.title}` : "",
        result.h1 && result.h1 !== result.title ? `Heading: ${result.h1}` : "",
        result.description ? `Description: ${result.description}` : "",
        result.textSnippet ? `Content: ${result.textSnippet}` : "",
      ].filter(Boolean);
      setPageContext(contextParts.join("\n\n"));
      const emails = result.candidateEmails;
      setCandidateEmails(emails);

      if (emails.length > 0 && !recipientEmail) {
        setRecipientEmail(emails[0]);
      }
      if (result.siteName && !recipientName) {
        setRecipientName(result.siteName);
      }

      if (
        !emails.length &&
        !result.title.trim() &&
        !result.textSnippet.trim()
      ) {
        setScrapeNoResult(true);
        toast.warning("Scrape completed, but no content or emails found.");
      } else {
        toast.success(`Scraped: found ${emails.length} email(s)`);
      }
    } catch (err: any) {
      setScrapeNoResult(true);
      toast.error(err.message || "Failed to scrape page");
    }
  };

  // AI draft generator handler
  const handleGenerate = async (toneModifier?: string) => {
    setActiveTone(toneModifier || "default");
    try {
      const draft = await generateMutation.mutateAsync({
        targetUrl: targetUrl.trim() || undefined,
        pageContext: pageContext.trim() || undefined,
        recipientName: recipientName.trim() || undefined,
        recipientEmail: recipientEmail.trim() || undefined,
        pitchProfileId: selectedPitchProfileId,
        customAngle: customAngle.trim() || undefined,
        toneModifier,
      });

      setSubject(draft.subject);
      setBody(draft.body);

      const toneLabelMap: Record<string, string> = {
        punchy: "Punchy (<60w)",
        casual: "Casual",
        value: "Value-First",
        "follow-up": "Follow-up",
      };
      const label = toneModifier
        ? toneLabelMap[toneModifier] || toneModifier
        : "Standard";
      toast.success(`${label} draft generated!`);
    } catch (err: any) {
      toast.error(err.message || "Draft generation failed");
    } finally {
      setActiveTone(null);
    }
  };

  // Email dispatch handler
  const handleSend = async (advanceToNext: boolean) => {
    if (!partner) return;
    if (!selectedSenderId) {
      toast.error("Please configure a Sender Identity in Mail Settings");
      return;
    }
    if (!recipientEmail.trim()) {
      toast.error("Recipient email is required");
      return;
    }
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body are required to send");
      return;
    }

    setIsSending(true);
    try {
      // 1. Dispatch email via SMTP
      await dispatchMutation.mutateAsync({
        senderId: selectedSenderId,
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName.trim() || undefined,
        subject: subject.trim(),
        body: body.trim(),
        pitchProfileId: selectedPitchProfileId,
        followUpDate: followUpDate || null,
        followUpAction: FOLLOW_UP_ACTION.ALERT,
      });

      // 2. Update partner in database
      await updatePartnerMutation.mutateAsync({
        id: partner.id,
        data: {
          outreachStatus: SEO_PARTNER_STATUS.OUTREACHED,
          outreachDate: new Date(),
          ...(recipientEmail ? { contactEmail: recipientEmail.trim() } : {}),
        },
      });

      toast.success(`Outreach sent to ${partner.website}!`);

      // 3. Advance to next uncontacted partner if requested
      if (advanceToNext) {
        if (nextUncontactedPartner) {
          onSelectPartner(nextUncontactedPartner);
        } else if (nextPartner) {
          onSelectPartner(nextPartner);
        } else {
          toast.success("All partners in this list have been outreached! 🎉");
          onClose();
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send outreach email");
    } finally {
      setIsSending(false);
    }
  };

  // Skip to next uncontacted partner
  const handleSkip = () => {
    if (nextUncontactedPartner) {
      onSelectPartner(nextUncontactedPartner);
    } else if (nextPartner) {
      onSelectPartner(nextPartner);
    } else {
      toast.info("No more partners in this list");
    }
  };

  if (!partner) return null;

  const senderOptions = (senders || []).map((s) => ({
    value: s.id,
    label: `${s.name} (${s.email})`,
  }));

  const pitchProfileOptions = (pitchProfiles || []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const statusColor = SeoPartnerStatusColor[partner.outreachStatus];
  const statusLabel =
    STATUS_LABELS[partner.outreachStatus] || partner.outreachStatus;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      showDragHandle={false}
      className="w-full sm:w-[620px] md:w-[700px] max-w-full p-0 flex flex-col h-full overflow-hidden"
    >
      {/* Drawer Header */}
      <div className="p-4 sm:p-5 border-b border-border bg-card shrink-0 space-y-3">
        {/* Top row: Searchable Partner Switcher, Badges, Navigation & Close */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-56 sm:w-64 shrink-0">
              <Select
                value={partner.id}
                onChange={(val) => {
                  const target = partners.find((p) => p.id === Number(val));
                  if (target) onSelectPartner(target);
                }}
                options={partnerOptions}
                searchable
                virtual
                placeholder="Jump to any partner..."
                className="text-xs h-8 font-semibold"
              />
            </div>
            {partner.dr !== null && partner.dr !== undefined && (
              <Tag
                color={
                  partner.dr >= 70
                    ? "emerald"
                    : partner.dr >= 40
                      ? "sky"
                      : partner.dr >= 20
                        ? "amber"
                        : "stone"
                }
                className="font-mono font-bold text-xs shrink-0"
              >
                DR {partner.dr}
              </Tag>
            )}
            <Tag color={statusColor} className="capitalize text-xs shrink-0">
              {statusLabel}
            </Tag>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 justify-end">
            {/* Prev / Next buttons */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => prevPartner && onSelectPartner(prevPartner)}
              disabled={!hasPrev || isSending}
              className="size-8 p-0"
              title="Previous Partner"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="text-xs text-muted-foreground font-mono px-1 whitespace-nowrap">
              {currentIndex >= 0 ? currentIndex + 1 : 0} / {activeList.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => nextPartner && onSelectPartner(nextPartner)}
              disabled={!hasNext || isSending}
              className="size-8 p-0"
              title="Next Partner"
            >
              <ChevronRightIcon className="size-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSending}
              className="size-8 p-0 ml-1 text-muted-foreground hover:text-foreground"
            >
              <CloseIcon className="size-4" />
            </Button>
          </div>
        </div>

        {/* Sub-row: URL link & Quick context badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <a
            href={
              partner.url.startsWith("http")
                ? partner.url
                : `https://${partner.url}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors font-mono truncate max-w-sm inline-flex items-center gap-1"
          >
            <span>{partner.url}</span>
            <span className="text-[10px] opacity-60">↗</span>
          </a>

          <div className="flex items-center gap-2">
            {partner.backlinkFor && (
              <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded text-[11px] font-medium border border-indigo-500/20">
                For: {partner.backlinkFor}
              </span>
            )}
            {uncontactedCount > 0 && (
              <span className="text-[11px] text-muted-foreground bg-accent px-2 py-0.5 rounded border border-border">
                {uncontactedCount} uncontacted left
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Drawer Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {/* Configuration Row: From Sender & Pitch Profile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1 border-b border-border/60">
          <Field>
            <FieldLabel className="text-xs">From Mailbox</FieldLabel>
            <Select
              value={selectedSenderId}
              onChange={(val) => val && setSelectedSenderId(Number(val))}
              options={senderOptions}
              placeholder="Select sender..."
              className="text-xs h-8"
            />
          </Field>

          <Field>
            <FieldLabel className="text-xs">Pitch Profile</FieldLabel>
            <Select
              value={selectedPitchProfileId}
              onChange={(val) => val && setSelectedPitchProfileId(Number(val))}
              options={pitchProfileOptions}
              placeholder="Select pitch..."
              className="text-xs h-8"
            />
          </Field>
        </div>

        {/* Target URL & Scrape Action */}
        <Field>
          <FieldLabel className="text-xs flex items-center justify-between">
            <span>Target Partner Page</span>
            {scrapeMutation.isPending && (
              <span className="text-[11px] text-primary flex items-center gap-1 font-normal">
                <SpinnerIcon className="size-3" />
                Scraping page context...
              </span>
            )}
          </FieldLabel>
          <div className="flex gap-2">
            <Input
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://partner-website.com/article"
              containerClassName="flex-1"
              className="text-xs h-8"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleManualScrape}
              disabled={scrapeMutation.isPending}
              className="shrink-0 h-8 gap-1.5 text-xs px-3"
            >
              {scrapeMutation.isPending ? (
                <SpinnerIcon className="size-3" />
              ) : (
                <SearchIcon className="size-3.5" />
              )}
              <span>Scrape</span>
            </Button>
          </div>
        </Field>

        {/* Scrape Warning Banner if no content or emails */}
        {scrapeNoResult && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-md text-xs text-amber-700 dark:text-amber-400 flex items-start justify-between gap-2">
            <span>
              ⚠️ Could not extract emails from target URL (anti-bot or JS
              protected). Fill recipient details below or click{" "}
              <strong>AI Draft</strong>.
            </span>
            <button
              type="button"
              onClick={() => setScrapeNoResult(false)}
              className="underline hover:opacity-75 shrink-0 text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Discovered Candidate Emails Chips */}
        {candidateEmails.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-muted/40 rounded-lg border border-border/70">
            <span className="text-[11px] text-muted-foreground font-medium shrink-0">
              Discovered Emails:
            </span>
            {candidateEmails.map((email) => {
              const isSelected = recipientEmail === email;
              return (
                <button
                  key={email}
                  type="button"
                  onClick={() => setRecipientEmail(email)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary font-medium"
                      : "bg-background hover:bg-accent text-foreground border-border"
                  }`}
                >
                  {email}
                </button>
              );
            })}
          </div>
        )}

        {/* Recipient Email & Recipient Name Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field>
            <FieldLabel className="text-xs">
              Recipient Email <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="editor@domain.com"
              className="text-xs h-8"
            />
          </Field>

          <Field>
            <FieldLabel className="text-xs">Recipient / Site Name</FieldLabel>
            <Input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Alex or Site Editor"
              className="text-xs h-8"
            />
          </Field>
        </div>

        {/* Collapsible Pitch Angle / Specific Hook */}
        <Collapsible open={showAngle} onOpenChange={setShowAngle}>
          <div className="pt-0.5">
            <Collapsible.Trigger className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors flex items-center gap-1">
              {showAngle
                ? "− Hide custom pitch angle"
                : "+ Add custom angle / hook (optional)"}
            </Collapsible.Trigger>
          </div>
          <Collapsible.Content className="pt-2">
            <Field>
              <Input
                value={customAngle}
                onChange={(e) => setCustomAngle(e.target.value)}
                placeholder="e.g. Broken link on item #3, Indochina tour logistics, custom travel tool"
                className="text-xs h-8"
              />
            </Field>
          </Collapsible.Content>
        </Collapsible>

        {/* AI Draft Generator Action Bar */}
        <div className="bg-muted/40 p-2.5 rounded-lg border border-border space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>✨ AI Email Draft</span>
              {generateMutation.isPending && (
                <SpinnerIcon className="size-3 text-primary animate-spin" />
              )}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Select a tone preset:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={
                activeTone === "default" || !activeTone ? "default" : "outline"
              }
              onClick={() => handleGenerate()}
              disabled={generateMutation.isPending || isSending}
              className="text-xs h-7 px-2.5"
            >
              {generateMutation.isPending &&
              (activeTone === "default" || !activeTone) ? (
                <SpinnerIcon className="size-3 mr-1" />
              ) : null}
              Standard
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTone === "punchy" ? "secondary" : "outline"}
              onClick={() => handleGenerate("punchy")}
              disabled={generateMutation.isPending || isSending}
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
              disabled={generateMutation.isPending || isSending}
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
              disabled={generateMutation.isPending || isSending}
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
              disabled={generateMutation.isPending || isSending}
              className="text-xs h-7 px-2.5"
            >
              {generateMutation.isPending && activeTone === "follow-up" ? (
                <SpinnerIcon className="size-3 mr-1" />
              ) : null}
              🔄 Follow-up
            </Button>
          </div>
        </div>

        {/* Email Subject Line */}
        <Field>
          <FieldLabel className="text-xs">
            Subject <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Collaboration / Article Inquiry"
            className="text-xs h-8 font-medium"
          />
        </Field>

        {/* Email Body Textarea */}
        <Field>
          <FieldLabel className="text-xs">
            Message Body <span className="text-destructive">*</span>
          </FieldLabel>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Click 'AI Draft' above to generate tailored pitch, or type custom message..."
            rows={10}
            className="text-xs font-mono resize-y"
          />
        </Field>
      </div>

      {/* Drawer Sticky Footer */}
      <div className="p-4 border-t border-border bg-card shrink-0 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          disabled={isSending}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <span>Skip Partner</span>
          <ArrowRightLinearIcon className="size-3.5 ml-1" />
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSend(false)}
            disabled={isSending || generateMutation.isPending}
            className="text-xs"
          >
            {isSending ? (
              <SpinnerIcon className="size-3 mr-1.5" />
            ) : (
              <MailIcon className="size-3.5 mr-1.5" />
            )}
            <span>Send Only</span>
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => handleSend(true)}
            disabled={isSending || generateMutation.isPending}
            className="text-xs font-semibold gap-1.5"
          >
            {isSending ? (
              <SpinnerIcon className="size-3" />
            ) : (
              <ArrowRightLinearIcon className="size-3.5" />
            )}
            <span>Send & Next</span>
            {uncontactedCount > 0 && (
              <span className="opacity-80 font-normal">
                ({uncontactedCount} left)
              </span>
            )}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
