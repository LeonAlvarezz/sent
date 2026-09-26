import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./user.schema";

export const senderIdentity = sqliteTable("sender_identity", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  host: text("host").notNull(),
  port: integer("port").notNull(),
  secure: integer("secure", { mode: "boolean" }).default(false).notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
