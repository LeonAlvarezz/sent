import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { campaign } from "./campaign.schema";
import { email } from "./email.schema";
import { QUEUE_ITEM_STATUS } from "@z3/types";

export const campaignQueue = sqliteTable("campaign_queue", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id")
    .notNull()
    .references(() => campaign.id, { onDelete: "cascade" }),
  emailId: integer("email_id").references(() => email.id, {
    onDelete: "set null",
  }),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  renderedSubject: text("rendered_subject").notNull(),
  renderedBody: text("rendered_body").notNull(),
  status: text("status").$type<QUEUE_ITEM_STATUS>().default(QUEUE_ITEM_STATUS.PENDING).notNull(),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0).notNull(),
  sentAt: integer("sent_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
