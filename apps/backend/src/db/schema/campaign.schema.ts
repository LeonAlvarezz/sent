import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./user.schema";
import { emailList } from "./email-list.schema";
import { senderIdentity } from "./sender-identity.schema";
import { pitchProfile } from "./pitch-profile.schema";
import { CAMPAIGN_STATUS } from "@z3/types";

export const campaign = sqliteTable("campaign", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  listId: integer("list_id").references(() => emailList.id, {
    onDelete: "set null",
  }),
  audienceType: text("audience_type").default("custom"),
  targetJobTitle: text("target_job_title"),
  senderId: integer("sender_id")
    .notNull()
    .references(() => senderIdentity.id, { onDelete: "cascade" }),
  pitchProfileId: integer("pitch_profile_id").references(() => pitchProfile.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").$type<CAMPAIGN_STATUS>().default(CAMPAIGN_STATUS.QUEUED).notNull(),
  delayMinSeconds: integer("delay_min_seconds").default(15).notNull(),
  delayMaxSeconds: integer("delay_max_seconds").default(45).notNull(),
  totalCount: integer("total_count").default(0).notNull(),
  sentCount: integer("sent_count").default(0).notNull(),
  failedCount: integer("failed_count").default(0).notNull(),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
