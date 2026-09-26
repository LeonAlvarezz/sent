import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./user.schema";
import { emailList } from "./email-list.schema";
import { EMAIL_STATUS } from "@z3/types";

export const email = sqliteTable("email", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  listId: integer("list_id").references(() => emailList.id, {
    onDelete: "set null",
  }),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  domainUrl: text("domain_url"),
  title: text("title"),
  personLinkedin: text("person_linkedin"),
  companyName: text("company_name"),
  country: text("country"),
  type: text("type"),
  companyLinkedin: text("company_linkedin"),
  status: text("status").default(EMAIL_STATUS.ACTIVE).notNull(),
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
