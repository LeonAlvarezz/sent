import { createFileRoute } from "@tanstack/react-router";
import { noop } from "@tanstack/react-query";
import { EmailPage } from "../../modules/outreach/email.page";
import { queryClient } from "../../libs/query-client";
import { apiClient } from "../../libs/api-client";
import { OUTREACH_KEYS } from "../../modules/outreach/outreach.api";
import type { Email, EmailList, JobTitleItem } from "@z3/types";

export const Route = createFileRoute("/_authenticated/emails")({
  loader: () => {
    void queryClient
      .query({
        queryKey: OUTREACH_KEYS.lists(),
        queryFn: () => apiClient.get<EmailList[]>("/outreach/lists"),
      })
      .catch(noop);
    void queryClient
      .query({
        queryKey: OUTREACH_KEYS.emails(),
        queryFn: () => apiClient.get<Email[]>("/outreach/emails"),
      })
      .catch(noop);
    void queryClient
      .query({
        queryKey: OUTREACH_KEYS.jobTitles(),
        queryFn: () => apiClient.get<JobTitleItem[]>("/outreach/job-titles"),
      })
      .catch(noop);
  },
  component: EmailPage,
});
