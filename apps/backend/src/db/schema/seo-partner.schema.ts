import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./user.schema";
import { SEO_PARTNER_STATUS } from "@z3/types";

export const seoPartner = sqliteTable("seo_partner", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  website: text("website").notNull(),
  url: text("url").notNull(),
  contactEmail: text("contact_email"),
  dr: integer("dr"),
  backlinks: integer("backlinks"),
  backlinkFor: text("backlink_for"),
  outreachStatus: text("outreach_status")
    .default(SEO_PARTNER_STATUS.NOT_STARTED)
    .notNull(),
  outreachDate: integer("outreach_date", { mode: "timestamp" }),
  followUpDate: integer("follow_up_date", { mode: "timestamp" }),
  quotedPrice: text("quoted_price"),
  notes: text("notes"),
  attributes: text("attributes", { mode: "json" })
    .$type<Record<string, any>>()
    .default({})
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
