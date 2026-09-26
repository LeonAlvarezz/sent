import React, { useEffect, useState } from "react";
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
  NativeSelect,
  Textarea,
  toast,
} from "@z3/admin-core";
import { EMAIL_STATUS } from "@z3/types";
import type { Email, EmailList } from "@z3/types";

export interface ContactModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  contact?: Email | null;
  emailItem?: Email | null;
  contactLists?: EmailList[];
  emailLists?: EmailList[];
  defaultListId?: number;
  onSave: (data: {
    email: string;
    firstName?: string;
    lastName?: string;
    domainUrl?: string;
    title?: string;
    personLinkedin?: string;
    companyName?: string;
    country?: string;
    type?: string;
    companyLinkedin?: string;
    listId?: number | null;
    status?: EMAIL_STATUS;
    attributes?: Record<string, any>;
  }) => Promise<void>;
}

export function ContactModal({
  isOpen,
  setIsOpen,
  contact,
  emailItem,
  contactLists,
  emailLists,
  defaultListId,
  onSave,
}: ContactModalProps) {
  const currentItem = emailItem || contact;
  const lists = emailLists || contactLists || [];
  const isEdit = Boolean(currentItem);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [title, setTitle] = useState("");
  const [domainUrl, setDomainUrl] = useState("");
  const [country, setCountry] = useState("");
  const [type, setType] = useState("");
  const [personLinkedin, setPersonLinkedin] = useState("");
  const [companyLinkedin, setCompanyLinkedin] = useState("");
  const [listId, setListId] = useState<string>("");
  const [status, setStatus] = useState<EMAIL_STATUS>(EMAIL_STATUS.ACTIVE);
  const [attributesJson, setAttributesJson] = useState("{}");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentItem) {
      setEmail(currentItem.email);
      setFirstName(currentItem.firstName ?? "");
      setLastName(currentItem.lastName ?? "");
      setCompanyName(currentItem.companyName ?? "");
      setTitle(currentItem.title ?? "");
      setDomainUrl(currentItem.domainUrl ?? "");
      setCountry(currentItem.country ?? "");
      setType(currentItem.type ?? "");
      setPersonLinkedin(currentItem.personLinkedin ?? "");
      setCompanyLinkedin(currentItem.companyLinkedin ?? "");
      setListId(currentItem.listId ? String(currentItem.listId) : "");
      setStatus(currentItem.status);
      setAttributesJson(
        Object.keys(currentItem.attributes).length > 0
          ? JSON.stringify(currentItem.attributes, null, 2)
          : "{}"
      );
    } else {
      setEmail("");
      setFirstName("");
      setLastName("");
      setCompanyName("");
      setTitle("");
      setDomainUrl("");
      setCountry("");
      setType("");
      setPersonLinkedin("");
      setCompanyLinkedin("");
      setListId(defaultListId ? String(defaultListId) : "");
      setStatus(EMAIL_STATUS.ACTIVE);
      setAttributesJson("{}");
    }
  }, [currentItem, defaultListId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    let parsedAttributes: Record<string, any> = {};
    if (attributesJson.trim()) {
      try {
        const parsed: unknown = JSON.parse(attributesJson.trim());
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          toast.error("Custom attributes must be a valid JSON object");
          return;
        }
        parsedAttributes = parsed as Record<string, any>;
      } catch {
        toast.error("Invalid JSON format in custom attributes");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onSave({
        email: trimmedEmail,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        companyName: companyName.trim() || undefined,
        title: title.trim() || undefined,
        domainUrl: domainUrl.trim() || undefined,
        country: country.trim() || undefined,
        type: type.trim() || undefined,
        personLinkedin: personLinkedin.trim() || undefined,
        companyLinkedin: companyLinkedin.trim() || undefined,
        listId: listId ? Number(listId) : null,
        status,
        attributes: parsedAttributes,
      });
      setIsOpen(false);
    } catch {
      // Error handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} size="lg">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>{isEdit ? "Edit Email" : "Add New Email"}</ModalTitle>
          <ModalDescription>
            {isEdit
              ? "Update email recipient details, audience list, or metadata."
              : "Add a single recipient or partner to your email directory."}
          </ModalDescription>
        </ModalHeader>

        <ModalBody className="space-y-4">
          <Field>
            <FieldLabel>Email Address *</FieldLabel>
            <Input
              type="email"
              placeholder="editor@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field>
              <FieldLabel>First Name</FieldLabel>
              <Input
                placeholder="Sarah"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Last Name</FieldLabel>
              <Input
                placeholder="Connor"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Company Name</FieldLabel>
              <Input
                placeholder="Audley Travel"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Job Title</FieldLabel>
              <Input
                placeholder="Solution Owner"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Domain URL</FieldLabel>
              <Input
                placeholder="audleytravel.com"
                value={domainUrl}
                onChange={(e) => setDomainUrl(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Country</FieldLabel>
              <Input
                placeholder="United Kingdom"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Audience List</FieldLabel>
              <NativeSelect
                value={listId}
                onChange={(e) => setListId(e.target.value)}
              >
                <option value="">General (No List)</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field>
              <FieldLabel>Status</FieldLabel>
              <NativeSelect
                value={status}
                onChange={(e) => setStatus(e.target.value as EMAIL_STATUS)}
              >
                <option value={EMAIL_STATUS.ACTIVE}>Active</option>
                <option value={EMAIL_STATUS.REPLIED}>Replied</option>
                <option value={EMAIL_STATUS.BOUNCED}>Bounced</option>
                <option value={EMAIL_STATUS.UNSUBSCRIBED}>Unsubscribed</option>
              </NativeSelect>
            </Field>
          </div>

          <Field>
            <FieldLabel>Custom Attributes (JSON)</FieldLabel>
            <Textarea
              rows={3}
              value={attributesJson}
              onChange={(e) => setAttributesJson(e.target.value)}
              placeholder='{\n  "dr": 65,\n  "target_url": "https://example.com/post"\n}'
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Custom attributes are accessible as email template variables (e.g. &#123;&#123;dr&#125;&#125;).
            </p>
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
            {isSubmitting
              ? "Saving..."
              : isEdit
                ? "Save Changes"
                : "Create Email"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export const EmailModal = ContactModal;
