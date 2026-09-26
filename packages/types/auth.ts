import type { Session } from "better-auth";
import * as v from "valibot";
import { type User, UserSchema } from "./user";

export const SignInEmailSchema = v.object({
  email: v.pipe(v.string(), v.email("Invalid email address")),
  password: v.pipe(
    v.string(),
    v.minLength(6, "Password must be at least 6 characters"),
  ),
  rememberMe: v.boolean(),
});

export type SignInEmail = v.InferOutput<typeof SignInEmailSchema>;

export const SignInEmailResponseSchema = v.object({
  token: v.optional(v.string()),
  url: v.optional(v.nullable(v.string())),
  redirect: v.optional(v.boolean()),
  user: UserSchema,
});

export const VerifyTotpSchema = v.object({
  code: v.pipe(
    v.string(),
    v.minLength(6, "Verification code must be 6 digits"),
    v.maxLength(6, "Verification code must be 6 digits"),
  ),
});

export const DisableTwoFactorSchema = v.object({
  password: v.string(),
});

export const VerifyBackupCodeSchema = v.object({
  code: v.pipe(v.string(), v.minLength(1, "Backup code is required")),
});

export type VerifyTotp = v.InferOutput<typeof VerifyTotpSchema>;
export type DisableTwoFactor = v.InferOutput<typeof DisableTwoFactorSchema>;
export type VerifyBackupCode = v.InferOutput<typeof VerifyBackupCodeSchema>;

export const TotpMethodSchema = v.union([
  v.literal("totp"),
  v.literal("otp"),
]);

export type TotpMethod = v.InferOutput<typeof TotpMethodSchema>;

export const SignInEmailTotpRedirectResponseSchema = v.object({
  twoFactorRedirect: v.boolean(),
  twoFactorMethods: v.array(TotpMethodSchema),
});

export type SignInEmailTotpRedirectResponse = v.InferOutput<
  typeof SignInEmailTotpRedirectResponseSchema
>;

export type SignInEmailSuccessResponse = v.InferOutput<
  typeof SignInEmailResponseSchema
>;

export type SignInEmailResponse =
  | SignInEmailSuccessResponse
  | SignInEmailTotpRedirectResponse;

export type SessionResponse = {
  user: User;
  session: Session;
};

export type EnableTwoFactorResponse = {
  method: "totp" | "otp";
  totpURI: string;
  backupCodes: string[];
};
