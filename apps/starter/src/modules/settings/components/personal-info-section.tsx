import React, { useEffect, useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import * as v from "valibot";
import {
  Avatar,
  Button,
  EditIcon,
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
  const initialAvatar = user?.image ?? initialData?.avatarUrl ?? "";

  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialAvatar) {
      setAvatarUrl(initialAvatar);
    }
  }, [initialAvatar]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 2MB size limit
    if (file.size > 2 * 1024 * 1024) {
      toast.error(
        "File size exceeds 2MB limit. Please choose a smaller image.",
      );
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error(
        "Invalid file format. Please upload a PNG, JPEG, or WEBP image.",
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setAvatarUrl(base64);

      try {
        await updateUserMutation.mutateAsync({
          name: form.state.values.name || displayName,
          image: base64,
        });
        toast.success("Avatar updated successfully");

        if (initialData && onSave) {
          onSave({
            ...initialData,
            name: form.state.values.name || displayName,
            avatarUrl: base64,
          });
        }
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to update avatar"));
      }
    };
    reader.readAsDataURL(file);

    // Reset input value so same file can be selected again
    e.target.value = "";
  };

  const form = useForm({
    defaultValues: {
      name: displayName,
    },
    onSubmit: async ({ value }) => {
      try {
        await updateUserMutation.mutateAsync({
          name: value.name,
          image: avatarUrl || null,
        });

        toast.success("Profile information updated successfully");

        if (initialData && onSave) {
          onSave({
            ...initialData,
            name: value.name,
            avatarUrl,
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
            Update your photo and personal profile details.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <div className="flex items-center gap-5">
          <div className="relative inline-block">
            <Button
              type="button"
              variant="barebone"
              onClick={() => fileInputRef.current?.click()}
              className="group relative block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring p-0"
              title="Upload new avatar"
              disabled={updateUserMutation.isPending}
            >
              {avatarUrl ? (
                <Avatar
                  src={avatarUrl}
                  className="size-20 rounded-full ring-2 ring-border/50 object-cover shadow-sm group-hover:opacity-90 transition-opacity"
                />
              ) : (
                <div className="size-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl ring-2 ring-border/50 shadow-sm group-hover:opacity-90 transition-opacity">
                  {(form.state.values.name || displayName || "U")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
              )}
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
            />

            <Button
              type="button"
              size="icon"
              variant="default"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 size-7 rounded-full shadow-md ring-2 ring-background"
              title="Change avatar"
              aria-label="Change avatar"
              disabled={updateUserMutation.isPending}
            >
              <EditIcon className="size-3.5" />
            </Button>
          </div>

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
