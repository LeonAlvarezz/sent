import React, { useState } from "react";
import {
  Button,
  Field,
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

export interface CreateListModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (data: { name: string; description?: string }) => Promise<void>;
}

export function CreateListModal({
  isOpen,
  setIsOpen,
  onSave,
}: CreateListModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Please enter a list name");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        name: trimmedName,
        description: description.trim() || undefined,
      });
      setName("");
      setDescription("");
      setIsOpen(false);
    } catch {
      // Error handled by caller
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>Create Audience List</ModalTitle>
          <ModalDescription>
            Organize prospects into target segments (e.g. SaaS Founders, Guest Post Targets).
          </ModalDescription>
        </ModalHeader>

        <ModalBody className="space-y-4">
          <Field>
            <FieldLabel>List Name *</FieldLabel>
            <Input
              placeholder="e.g. Fintech Guest Post Targets"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </Field>

          <Field>
            <FieldLabel>Description (Optional)</FieldLabel>
            <Textarea
              rows={3}
              placeholder="High DR blog editors in personal finance & crypto"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create List"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
