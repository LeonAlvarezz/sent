import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { CreateSenderIdentitySchema } from "@z3/types";
import {
  Button,
  Checkbox,
  Field,
  FieldError,
  FieldLabel,
  Input,
  InputPassword,
  Modal,
  ModalBody,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  SpinnerIcon,
  toast,
} from "@z3/admin-core";
import {
  useCreateSenderMutation,
  useTestSenderMutation,
} from "../outreach.api";

import type { CreateSenderIdentity } from "@z3/types";

export interface ConnectSenderModalProps {
  open: boolean;
  onClose: () => void;
}

export function ConnectSenderModal({ open, onClose }: ConnectSenderModalProps) {
  const createSenderMutation = useCreateSenderMutation();
  const testSenderMutation = useTestSenderMutation();

  const defaultValues: CreateSenderIdentity = {
    name: "",
    email: "",
    host: "",
    port: 587,
    secure: false,
    username: "",
    password: "",
    isDefault: false,
  };

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: CreateSenderIdentitySchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await createSenderMutation.mutateAsync({
          name: value.name.trim(),
          email: value.email.trim(),
          host: value.host.trim(),
          port: Number(value.port),
          secure: Boolean(value.secure),
          username: value.username.trim(),
          password: value.password,
          isDefault: Boolean(value.isDefault),
        });
        toast.success("Sender mailbox connected successfully!");
        form.reset();
        onClose();
      } catch (err: any) {
        toast.error(err.message || "Failed to save sender");
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open]);

  const handleTestConnection = async () => {
    const values = form.state.values;
    if (!values.host || !values.username || !values.password) {
      toast.error("Please fill in SMTP Host, Username, and Password");
      return;
    }
    try {
      const res = await testSenderMutation.mutateAsync({
        name: values.name || "Test",
        email: values.email || "test@domain.com",
        host: values.host,
        port: Number(values.port) || 587,
        secure: Boolean(values.secure),
        username: values.username,
        password: values.password,
        isDefault: Boolean(values.isDefault),
      });
      toast.success(res.message || "SMTP connection verified successfully!");
    } catch (err: any) {
      toast.error(err.message || "SMTP connection failed");
    }
  };

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
          <ModalTitle>Connect Sender Mailbox (SMTP)</ModalTitle>
          <ModalDescription>
            Enter your email provider SMTP credentials. For Gmail / Google
            Workspace, use an App Password.
          </ModalDescription>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field name="name">
              {(field) => {
                const hasErrors = field.state.meta.errors.length > 0;
                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Sender Name</FieldLabel>
                    <Input
                      id={field.name}
                      placeholder="Leon Alvarez"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {hasErrors && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="email">
              {(field) => {
                const hasErrors = field.state.meta.errors.length > 0;
                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Sender Email</FieldLabel>
                    <Input
                      id={field.name}
                      type="email"
                      placeholder="leon@domain.com"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {hasErrors && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <form.Field name="host">
                {(field) => {
                  const hasErrors = field.state.meta.errors.length > 0;
                  return (
                    <Field>
                      <FieldLabel htmlFor={field.name}>SMTP Host</FieldLabel>
                      <Input
                        id={field.name}
                        placeholder="smtp.gmail.com"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      {hasErrors && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>
            </div>

            <form.Field name="port">
              {(field) => {
                const hasErrors = field.state.meta.errors.length > 0;
                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Port</FieldLabel>
                    <Input
                      id={field.name}
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === "" ? 0 : Number(e.target.value),
                        )
                      }
                    />
                    {hasErrors && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field name="username">
              {(field) => {
                const hasErrors = field.state.meta.errors.length > 0;
                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                    <Input
                      id={field.name}
                      placeholder="leon@domain.com"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {hasErrors && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="password">
              {(field) => {
                const hasErrors = field.state.meta.errors.length > 0;
                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Password / App Password
                    </FieldLabel>
                    <InputPassword
                      id={field.name}
                      placeholder="••••••••••••••••"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {hasErrors && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <form.Field name="secure">
              {(field) => (
                <Checkbox
                  checked={Boolean(field.state.value)}
                  onChange={(checked) => field.handleChange(checked)}
                  label="Use SSL/TLS (Port 465)"
                />
              )}
            </form.Field>

            <form.Field name="isDefault">
              {(field) => (
                <Checkbox
                  checked={Boolean(field.state.value)}
                  onChange={(checked) => field.handleChange(checked)}
                  label="Set as Default Sender"
                />
              )}
            </form.Field>
          </div>
        </ModalBody>
        <ModalFooter className="flex justify-between items-center">
          <Button
            variant="secondary"
            type="button"
            onClick={handleTestConnection}
            disabled={testSenderMutation.isPending}
          >
            {testSenderMutation.isPending ? <SpinnerIcon /> : "Test Connection"}
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="default"
              type="submit"
              disabled={createSenderMutation.isPending}
            >
              {createSenderMutation.isPending
                ? "Connecting..."
                : "Save & Connect"}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default ConnectSenderModal;
