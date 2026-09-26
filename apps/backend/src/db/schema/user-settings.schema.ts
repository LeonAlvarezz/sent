import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./user.schema";

export const userSettings = sqliteTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  settings: text("settings", { mode: "json" })
    .$type<Record<string, any>>()
    .default({})
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
