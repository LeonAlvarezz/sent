import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/libs/api-client";
import type {
  Campaign,
  CampaignWithRelations,
  CampaignQueueItem,
  CreateCampaign,
  Email,
  EmailList,
  CreateEmail,
  CreateEmailList,
  CreatePitchProfile,
  CreateSenderIdentity,
  DispatchOutreach,
  EmailsListResponse,
  GenerateDraft,
  GeneratedDraft,
  ImportEmailsPayload,
  JobTitleItem,
  ListEmailsQuery,
  OutreachLog,
  OutreachSettings,
  PitchProfile,
  ScrapeUrl,
  SenderIdentity,
  UpdateEmail,
} from "@z3/types";

export const OUTREACH_KEYS = {
  all: ["outreach"] as const,
  senders: () => [...OUTREACH_KEYS.all, "senders"] as const,
  pitchProfiles: () => [...OUTREACH_KEYS.all, "pitch-profiles"] as const,
  lists: () => [...OUTREACH_KEYS.all, "lists"] as const,
  jobTitles: () => [...OUTREACH_KEYS.all, "job-titles"] as const,
  aiStatus: () => [...OUTREACH_KEYS.all, "ai-status"] as const,
  emails: (params?: Partial<ListEmailsQuery>) =>
    params !== undefined
      ? ([...OUTREACH_KEYS.all, "emails", params] as const)
      : ([...OUTREACH_KEYS.all, "emails"] as const),
  logs: () => [...OUTREACH_KEYS.all, "logs"] as const,
  settings: () => [...OUTREACH_KEYS.all, "settings"] as const,
  campaigns: () => [...OUTREACH_KEYS.all, "campaigns"] as const,
  campaign: (id: number) => [...OUTREACH_KEYS.all, "campaigns", id] as const,
  campaignItems: (
    id: number,
    params?: { status?: string; limit?: number; offset?: number },
  ) => [...OUTREACH_KEYS.all, "campaigns", id, "items", params] as const,
};

// Senders
export function useSendersQuery() {
  return useQuery({
    queryKey: OUTREACH_KEYS.senders(),
    queryFn: () => apiClient.get<SenderIdentity[]>("/outreach/senders"),
  });
}

export function useCreateSenderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSenderIdentity) =>
      apiClient.post<SenderIdentity>("/outreach/senders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.senders() });
    },
  });
}

export function useTestSenderMutation() {
  return useMutation({
    mutationFn: (data: CreateSenderIdentity) =>
      apiClient.post<{ success: boolean; message: string }>(
        "/outreach/senders/test",
        data,
      ),
  });
}

export function useDeleteSenderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/outreach/senders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.senders() });
    },
  });
}

// Pitch Profiles
export function usePitchProfilesQuery() {
  return useQuery({
    queryKey: OUTREACH_KEYS.pitchProfiles(),
    queryFn: () => apiClient.get<PitchProfile[]>("/outreach/pitch-profiles"),
  });
}

export function useCreatePitchProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePitchProfile) =>
      apiClient.post<PitchProfile>("/outreach/pitch-profiles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: OUTREACH_KEYS.pitchProfiles(),
      });
    },
  });
}

export function useDeletePitchProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete(`/outreach/pitch-profiles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: OUTREACH_KEYS.pitchProfiles(),
      });
    },
  });
}

// Email Lists
export function useEmailListsQuery() {
  return useQuery({
    queryKey: OUTREACH_KEYS.lists(),
    queryFn: () => apiClient.get<EmailList[]>("/outreach/lists"),
  });
}

export function useCreateEmailListMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEmailList) =>
      apiClient.post<EmailList>("/outreach/lists", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.lists() });
    },
  });
}

export function useDeleteEmailListMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/outreach/lists/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.emails() });
    },
  });
}

// Job Titles
export function useJobTitlesQuery() {
  return useQuery({
    queryKey: OUTREACH_KEYS.jobTitles(),
    queryFn: () => apiClient.get<JobTitleItem[]>("/outreach/job-titles"),
  });
}

// Emails
export function useEmailsQuery(
  params?: Partial<ListEmailsQuery>,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: OUTREACH_KEYS.emails(params),
    queryFn: () =>
      apiClient.get<EmailsListResponse>("/outreach/emails", {
        params: {
          ...(params?.listId ? { listId: params.listId } : {}),
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.page !== undefined ? { page: params.page } : {}),
          ...(params?.page_size !== undefined
            ? { page_size: params.page_size }
            : {}),
          ...(params?.title ? { title: params.title } : {}),
        },
      }),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

export function useCreateEmailMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEmail) =>
      apiClient.post<Email>("/outreach/emails", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.emails() });
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.jobTitles() });
    },
  });
}

export function useUpdateEmailMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEmail }) =>
      apiClient.put<Email>(`/outreach/emails/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.emails() });
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.jobTitles() });
    },
  });
}

export function useImportEmailsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ImportEmailsPayload) =>
      apiClient.post<Email[]>("/outreach/emails/import", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.emails() });
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.jobTitles() });
    },
  });
}

export function useDeleteEmailMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/outreach/emails/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.emails() });
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.jobTitles() });
    },
  });
}

// Quick Outreach Copilot: Scrape, Generate, Dispatch
export function useScrapeUrlMutation() {
  return useMutation({
    mutationFn: (data: ScrapeUrl) =>
      apiClient.post<{
        url: string;
        title: string;
        siteName?: string;
        description: string;
        h1: string;
        textSnippet: string;
        candidateEmails: string[];
      }>("/outreach/scrape", data),
  });
}

export function useGenerateDraftMutation() {
  return useMutation({
    mutationFn: (data: GenerateDraft) =>
      apiClient.post<GeneratedDraft>("/outreach/generate", data),
  });
}

export function useAiStatusQuery() {
  return useQuery({
    queryKey: OUTREACH_KEYS.aiStatus(),
    queryFn: () =>
      apiClient.get<{ isConfigured: boolean; source: "env" | "db" | "none" }>(
        "/outreach/ai-status",
      ),
    staleTime: 60000,
  });
}

export function useDispatchEmailMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DispatchOutreach) =>
      apiClient.post<{ success: boolean; logId: number; message: string }>(
        "/outreach/dispatch",
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.logs() });
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.emails() });
    },
  });
}

export function useOutreachLogsQuery() {
  return useQuery({
    queryKey: OUTREACH_KEYS.logs(),
    queryFn: () =>
      apiClient.get<
        Array<{
          log: OutreachLog;
          senderName?: string;
          pitchProfileName?: string;
        }>
      >("/outreach/logs"),
  });
}

// Settings
export function useOutreachSettingsQuery() {
  return useQuery({
    queryKey: OUTREACH_KEYS.settings(),
    queryFn: () => apiClient.get<OutreachSettings>("/outreach/settings"),
  });
}

export function useSaveOutreachSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OutreachSettings) =>
      apiClient.post("/outreach/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.settings() });
    },
  });
}

// Campaigns & Queues
export function useCampaignsQuery() {
  return useQuery({
    queryKey: OUTREACH_KEYS.campaigns(),
    queryFn: () =>
      apiClient.get<CampaignWithRelations[]>("/outreach/campaigns"),
    refetchInterval: (query) => {
      // Auto-poll every 3s if any campaign is actively running
      const hasRunning = query.state.data?.some(
        (c) => c.status === "running" || c.status === "queued",
      );
      return hasRunning ? 3000 : false;
    },
  });
}

export function useCampaignQuery(id?: number) {
  return useQuery({
    queryKey: OUTREACH_KEYS.campaign(id || 0),
    queryFn: () =>
      apiClient.get<CampaignWithRelations>(`/outreach/campaigns/${id}`),
    enabled: typeof id === "number" && id > 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "running" || status === "queued" ? 2500 : false;
    },
  });
}

export function useCampaignItemsQuery(
  id?: number,
  params?: { status?: string; limit?: number; offset?: number },
) {
  return useQuery({
    queryKey: OUTREACH_KEYS.campaignItems(id || 0, params),
    queryFn: () =>
      apiClient.get<{ items: CampaignQueueItem[]; total: number }>(
        `/outreach/campaigns/${id}/items`,
        { params },
      ),
    enabled: typeof id === "number" && id > 0,
    refetchInterval: 3000,
  });
}

export function useCreateCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCampaign) =>
      apiClient.post<{
        success: boolean;
        data: CampaignWithRelations;
        message: string;
      }>("/outreach/campaigns", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.campaigns() });
    },
  });
}

export function useStartCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.post<{ success: boolean; data: CampaignWithRelations }>(
        `/outreach/campaigns/${id}/start`,
      ),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.campaigns() });
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.campaign(id) });
    },
  });
}

export function usePauseCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.post<{ success: boolean; data: CampaignWithRelations }>(
        `/outreach/campaigns/${id}/pause`,
      ),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.campaigns() });
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.campaign(id) });
    },
  });
}

export function useResumeCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.post<{ success: boolean; data: CampaignWithRelations }>(
        `/outreach/campaigns/${id}/resume`,
      ),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.campaigns() });
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.campaign(id) });
    },
  });
}

export function useCancelCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.post<{ success: boolean; data: CampaignWithRelations }>(
        `/outreach/campaigns/${id}/cancel`,
      ),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.campaigns() });
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.campaign(id) });
    },
  });
}

export function useRetryCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.post<{ success: boolean; data: CampaignWithRelations }>(
        `/outreach/campaigns/${id}/retry`,
      ),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.campaigns() });
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.campaign(id) });
    },
  });
}

export function useTickCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, batchSize }: { id: number; batchSize?: number }) =>
      apiClient.post<{
        success: boolean;
        data: {
          processed: number;
          sent: number;
          failed: number;
          remaining: number;
          status: string;
        };
      }>(
        `/outreach/campaigns/${id}/tick${batchSize ? `?batchSize=${batchSize}` : ""}`,
      ),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.campaigns() });
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.campaign(id) });
      queryClient.invalidateQueries({ queryKey: OUTREACH_KEYS.logs() });
    },
  });
}
