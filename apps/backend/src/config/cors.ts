import * as v from "valibot";

type CorsOriginResult =
  | boolean
  | string
  | RegExp
  | Array<boolean | string | RegExp>;

export type CorsOriginValidator = (
  requestOrigin: string | undefined,
  callback: (error: Error | null, origin?: CorsOriginResult) => void,
) => void;

export const httpOriginSchema = v.pipe(
  v.string(),
  v.trim(),
  v.url("Origin must be a valid URL"),
  v.transform((value) => new URL(value)),
  v.check(
    (url) => url.protocol === "http:" || url.protocol === "https:",
    "Origin must use HTTP or HTTPS",
  ),
  v.check(
    (url) =>
      url.pathname === "/" &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password,
    "Origin must not contain credentials, a path, query, or hash",
  ),
  v.transform((url) => url.origin),
);

export const corsOriginsSchema = v.pipe(
  v.optional(v.string(), "http://localhost:5173"),
  v.transform((value) => value.split(",")),
  v.array(httpOriginSchema),
  v.minLength(1, "At least one origin must be specified"),
  v.transform((origins) => [...new Set(origins)]),
);

export const trustProxyHopsSchema = v.optional(
  v.pipe(
    v.unknown(),
    v.transform((val) =>
      typeof val === "string" && val.trim() === "" ? NaN : Number(val),
    ),
    v.number("Trust proxy hops must be a number"),
    v.integer("Trust proxy hops must be an integer"),
    v.minValue(0, "Trust proxy hops must be greater than or equal to 0"),
  ),
  0,
);

export function createCorsOriginValidator(
  allowedOrigins: readonly string[],
): CorsOriginValidator {
  const allowlist = new Set(allowedOrigins);

  return (origin, callback) => {
    if (!origin || allowlist.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  };
}
