import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/libs/api-client";
import type {
  CreateSeoPartner,
  ImportSeoPartnersPayload,
  ListSeoPartnersQuery,
  SeoPartner,
  SeoPartnersListResponse,
  UpdateSeoPartner,
  CompetitorBacklinksQuery,
  CompetitorBacklinkItem,
} from "@z3/types";

export const SEO_PARTNER_KEYS = {
  all: ["seo-partners"] as const,
  lists: (params?: Partial<ListSeoPartnersQuery>) =>
    params !== undefined
      ? ([...SEO_PARTNER_KEYS.all, "list", params] as const)
      : ([...SEO_PARTNER_KEYS.all, "list"] as const),
  targets: () => [...SEO_PARTNER_KEYS.all, "targets"] as const,
  detail: (id: number) => [...SEO_PARTNER_KEYS.all, "detail", id] as const,
};

export function useSeoPartnersQuery(
  params?: Partial<ListSeoPartnersQuery>,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: SEO_PARTNER_KEYS.lists(params),
    queryFn: () =>
      apiClient.get<SeoPartnersListResponse>("/seo-partners", {
        params: {
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.status ? { status: params.status } : {}),
          ...(params?.backlinkFor ? { backlinkFor: params.backlinkFor } : {}),
          ...(params?.page !== undefined ? { page: params.page } : {}),
          ...(params?.page_size !== undefined
            ? { page_size: params.page_size }
            : {}),
          ...(params?.minDr !== undefined ? { minDr: params.minDr } : {}),
          ...(params?.maxDr !== undefined ? { maxDr: params.maxDr } : {}),
          ...(params?.sortBy ? { sortBy: params.sortBy } : {}),
          ...(params?.sortOrder ? { sortOrder: params.sortOrder } : {}),
        },
      }),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

export function useSeoPartnerTargetsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: SEO_PARTNER_KEYS.targets(),
    queryFn: () => apiClient.get<string[]>("/seo-partners/targets"),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateSeoPartnerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSeoPartner) =>
      apiClient.post<SeoPartner>("/seo-partners", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEO_PARTNER_KEYS.all });
    },
  });
}

export function useImportSeoPartnersMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ImportSeoPartnersPayload) =>
      apiClient.post<SeoPartner[]>("/seo-partners/batch", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEO_PARTNER_KEYS.all });
    },
  });
}

export function useUpdateSeoPartnerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSeoPartner }) =>
      apiClient.put<SeoPartner>(`/seo-partners/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEO_PARTNER_KEYS.all });
    },
  });
}

export function useDeleteSeoPartnerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete<{ success: boolean }>(`/seo-partners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEO_PARTNER_KEYS.all });
    },
  });
}

export interface CompetitorBacklinksResult {
  items: CompetitorBacklinkItem[];
  total: number;
}

export function useCompetitorBacklinksMutation() {
  return useMutation({
    mutationFn: (data: CompetitorBacklinksQuery) =>
      apiClient.post<CompetitorBacklinksResult>(
        "/seo-partners/competitor-backlinks",
        data,
      ),
  });
}
