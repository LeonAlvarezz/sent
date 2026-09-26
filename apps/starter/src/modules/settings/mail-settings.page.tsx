import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  PlusIcon,
  CardContent,
  Field,
  FieldLabel,
  Input,
  Tag,
  toast,
} from "@z3/admin-core";
import { useState, useEffect } from "react";
import ConnectSenderModal from "../outreach/components/connect-sender-modal";
import CreatePitchProfileModal from "../outreach/components/create-pitch-profile-modal";
import {
  useSendersQuery,
  usePitchProfilesQuery,
  useDeleteSenderMutation,
  useDeletePitchProfileMutation,
  useOutreachSettingsQuery,
  useSaveOutreachSettingsMutation,
} from "../outreach/outreach.api";

export function OutreachSettingsSection() {
  // Queries
  const { data: senders } = useSendersQuery();
  const { data: pitchProfiles } = usePitchProfilesQuery();

  // Mutations
  const deleteSenderMutation = useDeleteSenderMutation();
  const deletePitchProfileMutation = useDeletePitchProfileMutation();

  // Modal states
  const [isNewSenderOpen, setIsNewSenderOpen] = useState(false);
  const [isNewProfileOpen, setIsNewProfileOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* SECTION 1: Connected Sender Mailboxes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sender Mailboxes (SMTP / Google / Outlook)</CardTitle>
            <CardDescription>
              Authenticated inboxes used to send cold outreach emails directly
              from your domain.
            </CardDescription>
          </div>
          <Button variant="default" onClick={() => setIsNewSenderOpen(true)}>
            <PlusIcon className="mr-2" />
            Connect
          </Button>
        </CardHeader>
        <CardContent>
          {senders && senders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No sender inboxes connected. Connect your SMTP or Google Workspace
              account to start sending.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {senders?.map((s) => (
                <div
                  key={s.id}
                  className="py-4 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {s.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({s.email})
                      </span>
                      {s.isDefault && (
                        <Tag color="blue" dot={false}>
                          Default
                        </Tag>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Host: {s.host}:{s.port} • User: {s.username}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (confirm(`Remove sender mailbox ${s.email}?`)) {
                        await deleteSenderMutation.mutateAsync(s.id);
                        toast.success("Mailbox removed");
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2: Pitch Profiles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Saved Pitch Profiles</CardTitle>
            <CardDescription>
              Reusable value propositions and outreach formulas used to
              condition AI email drafts.
            </CardDescription>
          </div>
          <Button variant="ghost" onClick={() => setIsNewProfileOpen(true)}>
            <PlusIcon className="mr-2" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {pitchProfiles && pitchProfiles.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No pitch profiles created yet. Create a profile (e.g. "SaaS
              Backlinks") to avoid retyping your pitch.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pitchProfiles?.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-lg border border-border bg-card space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{p.name}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (confirm(`Delete pitch profile "${p.name}"?`)) {
                          await deletePitchProfileMutation.mutateAsync(p.id);
                          toast.success("Profile deleted");
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {p.valueProposition}
                  </p>
                  {p.toneInstructions && (
                    <div className="text-xs text-accent-foreground">
                      Tone: {p.toneInstructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 3: Queue & Drip Throttle Settings */}
      <QueueThrottleSettingsSection />

      {/* MODAL: Connect Mailbox */}
      <ConnectSenderModal
        open={isNewSenderOpen}
        onClose={() => setIsNewSenderOpen(false)}
      />

      {/* MODAL: New Pitch Profile */}
      <CreatePitchProfileModal
        open={isNewProfileOpen}
        onClose={() => setIsNewProfileOpen(false)}
      />
    </div>
  );
}

function QueueThrottleSettingsSection() {
  const { data: settings } = useOutreachSettingsQuery();
  const saveMutation = useSaveOutreachSettingsMutation();

  const [minDelay, setMinDelay] = useState<number>(15);
  const [maxDelay, setMaxDelay] = useState<number>(45);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (settings && !isInitialized) {
      if (typeof settings.defaultDelayMinSeconds === "number") {
        setMinDelay(settings.defaultDelayMinSeconds);
      }
      if (typeof settings.defaultDelayMaxSeconds === "number") {
        setMaxDelay(settings.defaultDelayMaxSeconds);
      }
      setIsInitialized(true);
    }
  }, [settings, isInitialized]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (minDelay < 1) {
      toast.error("Minimum delay must be at least 1 second");
      return;
    }
    if (maxDelay < minDelay) {
      toast.error("Maximum delay cannot be less than minimum delay");
      return;
    }
    try {
      await saveMutation.mutateAsync({
        ...settings,
        preferredProvider: settings?.preferredProvider ?? "openai",
        defaultDelayMinSeconds: Number(minDelay),
        defaultDelayMaxSeconds: Number(maxDelay),
      });
      toast.success("Queue throttle settings saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Queue & Drip Throttle Settings</CardTitle>
        <CardDescription>
          Global pacing delay intervals between bulk campaign emails to protect domain reputation and avoid spam blacklisting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Default Minimum Delay (seconds)</FieldLabel>
              <Input
                type="number"
                min={1}
                max={600}
                value={minDelay}
                onChange={(e) => setMinDelay(Number(e.target.value))}
              />
            </Field>
            <Field>
              <FieldLabel>Default Maximum Delay (seconds)</FieldLabel>
              <Input
                type="number"
                min={1}
                max={600}
                value={maxDelay}
                onChange={(e) => setMaxDelay(Number(e.target.value))}
              />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            Bulk outreach campaigns will default to randomized delays between {minDelay}s and {maxDelay}s per delivery.
          </p>
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save Throttle Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function MailSettingsPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Mail & Outreach Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure outgoing email mailboxes, reusable AI pitch profiles, and
          language model keys.
        </p>
      </div>

      <OutreachSettingsSection />
    </div>
  );
}

export default MailSettingsPage;
