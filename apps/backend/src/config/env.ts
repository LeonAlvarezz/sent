// env.ts
import * as v from "valibot";
import { corsOriginsSchema, trustProxyHopsSchema } from "./cors";

// Define the schema as an object with all of the env
// variables and their types
const envSchema = v.object({
  PORT: v.pipe(
    v.unknown(),
    v.transform((val) => Number(val)),
    v.number("PORT must be a number"),
    v.integer("PORT must be an integer"),
    v.minValue(1000, "PORT must be at least 1000"),
  ),
  NODE_ENV: v.optional(
    v.union([
      v.literal("development"),
      v.literal("testing"),
      v.literal("production"),
    ]),
    "development",
  ),
  API_PREFIX: v.string(),
  API_BASE_URL: v.string(),
  API_KEY: v.string(),
  PASSWORD_SALT: v.pipe(
    v.unknown(),
    v.transform((val) => Number(val)),
    v.number("PASSWORD_SALT must be a number"),
  ),
  DATABASE_URL: v.string(),
  BETTER_AUTH_SECRET: v.string(),
  BETTER_AUTH_URL: v.string(),
  CORS_ORIGINS: corsOriginsSchema,
  TRUST_PROXY_HOPS: trustProxyHopsSchema,
});

export type Env = v.InferOutput<typeof envSchema>;

// Validate `process.env` against our schema
// and return the result
export const env = v.parse(envSchema, process.env);
export default env;
