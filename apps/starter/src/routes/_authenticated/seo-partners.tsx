import { createFileRoute } from "@tanstack/react-router";
import { SeoPartnerPage } from "../../modules/seo-partner/seo-partner.page";
import { queryClient } from "../../libs/query-client";
import { apiClient } from "../../libs/api-client";
import { SEO_PARTNER_KEYS } from "../../modules/seo-partner/seo-partner.api";
import type { SeoPartner } from "@z3/types";

export const Route = createFileRoute("/_authenticated/seo-partners")({
  loader: () => {
    void queryClient.prefetchQuery({
      queryKey: SEO_PARTNER_KEYS.lists(),
      queryFn: () => apiClient.get<SeoPartner[]>("/seo-partners"),
    });
    void queryClient.prefetchQuery({
      queryKey: SEO_PARTNER_KEYS.targets(),
      queryFn: () => apiClient.get<string[]>("/seo-partners/targets"),
    });
  },
  component: SeoPartnerPage,
});
