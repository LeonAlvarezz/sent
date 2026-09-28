import { createFileRoute, redirect } from "@tanstack/react-router";
import { noop } from "@tanstack/react-query";
import { SeoPartnerPage } from "../../modules/seo-partner/seo-partner.page";
import { queryClient } from "../../libs/query-client";
import { apiClient } from "../../libs/api-client";
import { SEO_PARTNER_KEYS } from "../../modules/seo-partner/seo-partner.api";
import { hasRequiredRole } from "@z3/admin-core";
import { USER_ROLE } from "@z3/types";
import type { SeoPartner } from "@z3/types";

export const Route = createFileRoute("/_authenticated/seo-partners")({
  beforeLoad: ({ context }) => {
    if (
      !context.auth.isLoading &&
      !hasRequiredRole(context.auth.user?.role, [
        USER_ROLE.SUPER_ADMIN,
        USER_ROLE.ADMIN,
      ])
    ) {
      throw redirect({ to: "/forbidden" });
    }
  },
  loader: () => {
    void queryClient
      .query({
        queryKey: SEO_PARTNER_KEYS.lists(),
        queryFn: () => apiClient.get<SeoPartner[]>("/seo-partners"),
      })
      .catch(noop);
    void queryClient
      .query({
        queryKey: SEO_PARTNER_KEYS.targets(),
        queryFn: () => apiClient.get<string[]>("/seo-partners/targets"),
      })
      .catch(noop);
  },
  component: SeoPartnerPage,
});
