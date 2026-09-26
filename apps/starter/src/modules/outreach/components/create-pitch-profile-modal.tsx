import React, { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { CreatePitchProfileSchema } from "@z3/types";
import {
  Button,
  Field,
  FieldError,
  FieldLabel,
  Input,
  Modal,
  ModalBody,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Textarea,
  toast,
} from "@z3/admin-core";
import { useCreatePitchProfileMutation } from "../outreach.api";
import type { CreatePitchProfile } from "@z3/types";

export interface CreatePitchProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreatePitchProfileModal({
  open,
  onClose,
}: CreatePitchProfileModalProps) {
  const createPitchProfileMutation = useCreatePitchProfileMutation();

  const defaultValues: CreatePitchProfile = {
    name: "",
    targetUrl: "",
    valueProposition: "",
    toneInstructions: "",
    examples: "",
  };

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: CreatePitchProfileSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await createPitchProfileMutation.mutateAsync({
          name: value.name.trim(),
          targetUrl: value.targetUrl?.trim() || undefined,
          valueProposition: value.valueProposition.trim(),
          toneInstructions: value.toneInstructions?.trim() || undefined,
          examples: value.examples?.trim() || undefined,
        });
        toast.success("Pitch profile saved!");
        form.reset();
        onClose();
      } catch (err: any) {
        toast.error(err.message || "Failed to save pitch profile");
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} size="2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <ModalHeader>
          <ModalTitle>Create Pitch Profile</ModalTitle>
          <ModalDescription>
            Define reusable pitch angles, target assets, and tone rules for AI drafting.
          </ModalDescription>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <form.Field name="name">
            {(field) => {
              const hasErrors = field.state.meta.errors.length > 0;
              return (
                <Field>
                  <FieldLabel htmlFor={field.name}>Profile Name</FieldLabel>
                  <Input
                    id={field.name}
                    placeholder="e.g. Backlink Exchange / Broken Link Replacement"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {hasErrors && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="targetUrl">
            {(field) => {
              const hasErrors = field.state.meta.errors.length > 0;
              return (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Target Link / Asset URL (Optional)
                  </FieldLabel>
                  <Input
                    id={field.name}
                    placeholder="https://yoursite.com/resource"
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {hasErrors && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="valueProposition">
            {(field) => {
              const hasErrors = field.state.meta.errors.length > 0;
              return (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Value Proposition & Pitch Angle
                  </FieldLabel>
                  <Textarea
                    id={field.name}
                    rows={3}
                    placeholder="We published a comprehensive benchmark of 50 tools with interactive charts that would be a high-value addition to your post."
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {hasErrors && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="toneInstructions">
            {(field) => {
              const hasErrors = field.state.meta.errors.length > 0;
              return (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Tone & Formatting Rules
                  </FieldLabel>
                  <Input
                    id={field.name}
                    placeholder="e.g. Casual, friendly, under 100 words, no pushy sales talk"
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {hasErrors && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="examples">
            {(field) => {
              const hasErrors = field.state.meta.errors.length > 0;
              return (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Few-Shot Example Drafts (Optional)
                  </FieldLabel>
                  <Textarea
                    id={field.name}
                    rows={3}
                    placeholder="Paste 1-2 examples of successful emails you've sent before to guide the AI..."
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {hasErrors && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="default"
            type="submit"
            disabled={createPitchProfileMutation.isPending}
          >
            {createPitchProfileMutation.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default CreatePitchProfileModal;
