import { createFileRoute } from "@tanstack/react-router";
import { SeoPartnerPage } from "../../modules/seo-partner/seo-partner.page";

export const Route = createFileRoute("/_authenticated/seo-partners")({
  component: SeoPartnerPage,
});
