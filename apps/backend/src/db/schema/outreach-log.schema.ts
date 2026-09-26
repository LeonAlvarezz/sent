import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./user.schema";
import { senderIdentity } from "./sender-identity.schema";
import { pitchProfile } from "./pitch-profile.schema";
import { email } from "./email.schema";
import { OUTREACH_STATUS } from "@z3/types";

export const outreachLog = sqliteTable("outreach_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  emailId: integer("email_id").references(() => email.id, {
    onDelete: "set null",
  }),
  senderId: integer("sender_id")
    .references(() => senderIdentity.id, { onDelete: "cascade" })
    .notNull(),
  pitchProfileId: integer("pitch_profile_id").references(() => pitchProfile.id, {
    onDelete: "set null",
  }),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").default(OUTREACH_STATUS.SENT).notNull(),
  followUpDate: text("follow_up_date"),
  followUpAction: text("follow_up_action"),
  sentAt: integer("sent_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
