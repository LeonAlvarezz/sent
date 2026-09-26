import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema",
  out: "./d1-migrations",
  dialect: "sqlite",
} satisfies Config;
