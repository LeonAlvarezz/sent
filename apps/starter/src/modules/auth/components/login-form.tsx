import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { SignInEmailSchema } from "@z3/types";
import {
  ArrowLeftIcon,
  Button,
  Checkbox,
  Field,
  FieldError,
  FieldLabel,
  Input,
  KeyIcon,
  ShieldCheckIcon,
  toast,
  useAuth,
} from "@z3/admin-core";
import { apiClient, getErrorMessage } from "@/libs/api-client";
import { queryClient } from "@/libs/query-client";
import * as v from "valibot";

export function LoginForm() {
  const auth = useAuth();
  const { login, isAuthenticated } = auth;
  const navigate = useNavigate();

  // 2FA Challenge state
  const [isTwoFactorStep, setIsTwoFactorStep] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  const form = useForm({
    defaultValues: {
      email: "admin@example.com",
      password: "12345678",
      rememberMe: false,
    },
    validators: {
      onSubmit: SignInEmailSchema,
    },
    onSubmit: async ({ value }) => {
      const res = await login(value);
      if (!res.success) {
        if (
          res.error.message === "TWO_FACTOR_REDIRECT" ||
          (res.error as any).twoFactorRedirect
        ) {
          setIsTwoFactorStep(true);
          setTotpCode("");
          setBackupCode("");
          return;
        }
        toast.error(res.error.message);
        return;
      }
      toast.success("Login Successfully");
      navigate({ to: "/" });
    },
  });

  const handleVerify2FA = async (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!useBackupCode && totpCode.trim().length !== 6) {
      toast.error("Please enter the 6-digit authentication code.");
      return;
    }

    if (useBackupCode && !backupCode.trim()) {
      toast.error("Please enter your backup recovery code.");
      return;
    }

    setIsVerifying(true);
    try {
      if (useBackupCode) {
        await apiClient.post("/auth/two-factor/verify-backup-code", {
          code: backupCode.trim(),
        });
      } else {
        await apiClient.post("/auth/two-factor/verify-totp", {
          code: totpCode.trim(),
        });
      }

      queryClient.clear();
      await auth.initialize();
      toast.success("Welcome back!");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          useBackupCode
            ? "Invalid backup recovery code."
            : "Invalid authentication code. Please try again.",
        ),
      );
    } finally {
      setIsVerifying(false);
    }
  };

  if (isTwoFactorStep) {
    return (
      <form onSubmit={handleVerify2FA} className="space-y-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsTwoFactorStep(false);
            setTotpCode("");
            setBackupCode("");
          }}
          className="absolute left-6 top-6 size-8 p-0 text-muted-foreground hover:text-foreground"
          aria-label="Back to login"
        >
          <ArrowLeftIcon className="size-4" />
        </Button>

        <div className="text-center space-y-1.5 pt-10">
          <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2 shadow-sm">
            {useBackupCode ? (
              <KeyIcon className="size-5 text-amber-500" />
            ) : (
              <ShieldCheckIcon className="size-5" />
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Two-Factor Authentication
          </h2>
          <p className="text-xs text-muted-foreground">
            {useBackupCode
              ? "Enter your emergency recovery code"
              : "Enter your 6-digit code from your authenticator app"}
          </p>
        </div>

        <div className="space-y-4">
          {!useBackupCode ? (
            <Field>
              <FieldLabel htmlFor="totp-code" required>
                Authentication Code
              </FieldLabel>
              <Input
                id="totp-code"
                type="text"
                maxLength={6}
                autoFocus
                placeholder="123456"
                value={totpCode}
                onChange={(e) =>
                  setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="font-mono text-center tracking-widest text-lg"
                disabled={isVerifying}
                required
              />
            </Field>
          ) : (
            <Field>
              <FieldLabel htmlFor="backup-code" required>
                Backup Recovery Code
              </FieldLabel>
              <Input
                id="backup-code"
                type="text"
                autoFocus
                placeholder="e.g. a1b2c3d4"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.trim())}
                className="font-mono text-center tracking-wider text-base"
                disabled={isVerifying}
                required
              />
            </Field>
          )}
          <div className="text-center pt-1">
            <Button
              variant="barebone"
              type="button"
              onClick={() => setUseBackupCode((prev) => !prev)}
              className="text-xs text-primary hover:underline focus:outline-none"
            >
              {useBackupCode
                ? "Use an authenticator app code instead"
                : "Use a bank code instead"}
            </Button>
          </div>

          <Button
            type="submit"
            disabled={
              isVerifying ||
              (!useBackupCode ? totpCode.length !== 6 : !backupCode.trim())
            }
            className="w-full"
          >
            {isVerifying ? "Verifying..." : "Verify & Continue"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Sign in to ZeroUI Admin
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your credentials to access the admin portal
        </p>
      </div>

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="space-y-4 rounded-md">
          <form.Field
            name="email"
            validators={{
              onBlur: v.pipe(v.string(), v.email("Invalid email address")),
            }}
          >
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field>
                  <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="admin@gmail.com"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onBlur: v.pipe(
                v.string(),
                v.minLength(6, "Password must be at least 6 characters"),
              ),
            }}
          >
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field>
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Input.Password
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="••••••••"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="rememberMe">
            {(field) => (
              <div className="flex items-center justify-between pt-1">
                <Checkbox
                  id={field.name}
                  name={field.name}
                  checked={field.state.value}
                  onChange={(checked) => field.handleChange(checked)}
                  label="Remember me"
                />
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
