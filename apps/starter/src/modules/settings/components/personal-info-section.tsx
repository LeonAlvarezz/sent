import React from "react";
import { useForm } from "@tanstack/react-form";
import * as v from "valibot";
import {
  Avatar,
  AVATAR_1,
  Button,
  Field,
  FieldError,
  FieldLabel,
  Input,
  toast,
} from "@z3/admin-core";
import { getErrorMessage } from "@/libs/api-client";
import { useUpdateUserMutation } from "../api/settings.api";
import type { UserProfileData } from "../constant/settings.constant";

interface PersonalInfoSectionProps {
  user?: {
    name: string;
    email: string;
    image?: string | null;
  };
  initialData?: UserProfileData;
  onSave?: (data: UserProfileData) => void;
}

const PersonalInfoSchema = v.object({
  name: v.pipe(
    v.string(),
    v.minLength(2, "Full name must be at least 2 characters"),
  ),
});

export function PersonalInfoSection({
  user,
  initialData,
  onSave,
}: PersonalInfoSectionProps) {
  const updateUserMutation = useUpdateUserMutation();

  const displayName = user?.name ?? initialData?.name ?? "";
  const displayEmail = user?.email ?? initialData?.email ?? "";
  const displayAvatar = user?.image ?? initialData?.avatarUrl ?? AVATAR_1;

  const form = useForm({
    defaultValues: {
      name: displayName,
    },
    onSubmit: async ({ value }) => {
      try {
        await updateUserMutation.mutateAsync({
          name: value.name,
        });

        toast.success("Profile information updated successfully");

        if (initialData && onSave) {
          onSave({
            ...initialData,
            name: value.name,
          });
        }
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to update profile"));
      }
    },
  });

  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Personal Information
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Personal profile details and identity.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <div className="flex items-center gap-5">
          <Avatar
            src={displayAvatar}
            name={form.state.values.name || displayName}
            className="size-20 rounded-full ring-2 ring-border/50 shadow-sm"
          />

          <div className="space-y-0.5">
            <h3 className="text-base font-semibold text-foreground">
              {form.state.values.name || displayName}
            </h3>
            <p className="text-xs text-muted-foreground">{displayEmail}</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          <form.Field
            name="name"
            validators={{
              onBlur: PersonalInfoSchema.entries.name,
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name} required>
                  Full Name
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g. Leon Alvarez"
                  disabled={updateUserMutation.isPending}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>

          <Field>
            <FieldLabel htmlFor="account-email">Email Address</FieldLabel>
            <Input
              id="account-email"
              name="email"
              value={displayEmail}
              disabled
              className="cursor-not-allowed "
              containerClassName="bg-muted/30"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email address is managed by authentication and cannot be changed
              directly.
            </p>
          </Field>

          <div className="flex items-center justify-end gap-3 pt-4 border-border">
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={
                    !canSubmit || isSubmitting || updateUserMutation.isPending
                  }
                >
                  {isSubmitting || updateUserMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </div>
    </div>
  );
}
