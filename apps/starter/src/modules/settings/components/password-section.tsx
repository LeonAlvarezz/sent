import React, { useState } from "react";
import {
  Button,
  CheckIcon,
  CloseIcon,
  Field,
  FieldLabel,
  InputPassword,
  toast,
} from "@z3/admin-core";
import { getErrorMessage } from "@/libs/api-client";
import { useChangePasswordMutation } from "../api/settings.api";

export function PasswordSection() {
  const changePasswordMutation = useChangePasswordMutation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Criteria calculations
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  const passedCriteriaCount = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumberOrSymbol,
  ].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (newPassword.length === 0) return "";
    switch (passedCriteriaCount) {
      case 1:
        return "Very Weak";
      case 2:
        return "Weak";
      case 3:
        return "Good";
      case 4:
        return "Strong";
      default:
        return "Weak";
    }
  };

  const getStrengthColor = () => {
    switch (passedCriteriaCount) {
      case 1:
        return "bg-rose-500";
      case 2:
        return "bg-amber-500";
      case 3:
        return "bg-blue-500";
      case 4:
        return "bg-emerald-500";
      default:
        return "bg-muted";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    if (passedCriteriaCount < 3) {
      toast.error(
        "New password is too weak. Please fulfill password requirements.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to change password."));
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Change Password
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Ensure your account is using a secure, long password to prevent
            unauthorized access.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="current-password" required>
              Current Password
            </FieldLabel>
            <InputPassword
              id="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              disabled={changePasswordMutation.isPending}
              required
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="new-password" required>
              New Password
            </FieldLabel>
            <InputPassword
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Create new password"
              disabled={changePasswordMutation.isPending}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="confirm-password" required>
              Confirm New Password
            </FieldLabel>
            <InputPassword
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              disabled={changePasswordMutation.isPending}
              required
            />
          </Field>
        </div>

        {/* Live Password Strength Meter */}
        {newPassword.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">
                Password Strength
              </span>
              <span className="font-semibold text-foreground">
                {getStrengthLabel()}
              </span>
            </div>

            {/* 4 Segment Progress Bar */}
            <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`rounded-full transition-all duration-300 ${
                    passedCriteriaCount >= step
                      ? getStrengthColor()
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Rule Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
              <div className="flex items-center gap-1.5">
                {hasMinLength ? (
                  <CheckIcon className="size-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <CloseIcon className="size-3.5 text-muted-foreground/60 shrink-0" />
                )}
                <span
                  className={
                    hasMinLength ? "text-foreground" : "text-muted-foreground"
                  }
                >
                  At least 8 characters
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {hasUppercase ? (
                  <CheckIcon className="size-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <CloseIcon className="size-3.5 text-muted-foreground/60 shrink-0" />
                )}
                <span
                  className={
                    hasUppercase ? "text-foreground" : "text-muted-foreground"
                  }
                >
                  At least 1 uppercase letter
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {hasLowercase ? (
                  <CheckIcon className="size-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <CloseIcon className="size-3.5 text-muted-foreground/60 shrink-0" />
                )}
                <span
                  className={
                    hasLowercase ? "text-foreground" : "text-muted-foreground"
                  }
                >
                  At least 1 lowercase letter
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {hasNumberOrSymbol ? (
                  <CheckIcon className="size-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <CloseIcon className="size-3.5 text-muted-foreground/60 shrink-0" />
                )}
                <span
                  className={
                    hasNumberOrSymbol
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  At least 1 number or symbol
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              changePasswordMutation.isPending ||
              !currentPassword ||
              !newPassword ||
              passedCriteriaCount < 3 ||
              newPassword !== confirmPassword
            }
          >
            {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </form>
    </div>
  );
}
