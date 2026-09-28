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
import { SEO_PARTNER_STATUS } from "@z3/types";
import type { CreateSeoPartner, SeoPartner, UpdateSeoPartner } from "@z3/types";

export interface SeoPartnerModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  partner?: SeoPartner | null;
  onSave: (data: CreateSeoPartner | UpdateSeoPartner) => Promise<void>;
  existingTargets?: string[];
}

export function SeoPartnerModal({
  isOpen,
  setIsOpen,
  partner,
  onSave,
}: SeoPartnerModalProps) {
  const isEdit = Boolean(partner);

  const [website, setWebsite] = useState("");
  const [url, setUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [dr, setDr] = useState<string>("");
  const [backlinks, setBacklinks] = useState<string>("");
  const [backlinkFor, setBacklinkFor] = useState("");
  const [outreachStatus, setOutreachStatus] = useState<SEO_PARTNER_STATUS>(
    SEO_PARTNER_STATUS.NOT_STARTED,
  );
  const [outreachDate, setOutreachDate] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [quotedPrice, setQuotedPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (partner) {
        setWebsite(partner.website || "");
        setUrl(partner.url || "");
        setContactEmail(partner.contactEmail || "");
        setDr(
          partner.dr !== null && partner.dr !== undefined
            ? String(partner.dr)
            : "",
        );
        setBacklinks(
          partner.backlinks !== null && partner.backlinks !== undefined
            ? String(partner.backlinks)
            : "",
        );
        setBacklinkFor(partner.backlinkFor || "");
        setOutreachStatus(partner.outreachStatus);
        setOutreachDate(
          partner.outreachDate
            ? new Date(partner.outreachDate).toISOString().split("T")[0]
            : "",
        );
        setFollowUpDate(
          partner.followUpDate
            ? new Date(partner.followUpDate).toISOString().split("T")[0]
            : "",
        );
        setQuotedPrice(partner.quotedPrice || "");
        setNotes(partner.notes || "");
      } else {
        setWebsite("");
        setUrl("");
        setContactEmail("");
        setDr("");
        setBacklinks("");
        setBacklinkFor("");
        setOutreachStatus(SEO_PARTNER_STATUS.NOT_STARTED);
        setOutreachDate("");
        setFollowUpDate("");
        setQuotedPrice("");
        setNotes("");
      }
    }
  }, [isOpen, partner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!website.trim() || !url.trim()) {
      toast.error("Website name and URL are required");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateSeoPartner = {
        website: website.trim(),
        url: url.trim(),
        contactEmail: contactEmail.trim() || null,
        dr: dr.trim() ? Number(dr.trim()) : null,
        backlinks: backlinks.trim() ? Number(backlinks.trim()) : null,
        backlinkFor: backlinkFor.trim() || null,
        outreachStatus,
        outreachDate: outreachDate
          ? new Date(outreachDate).toISOString()
          : null,
        followUpDate: followUpDate
          ? new Date(followUpDate).toISOString()
          : null,
        quotedPrice: quotedPrice.trim() || null,
        notes: notes.trim() || null,
      };

      await onSave(payload);
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save partner");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={() => setIsOpen(false)} size="2xl">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <ModalHeader className="pb-3">
          <ModalTitle>
            {isEdit ? "Edit SEO Partner" : "Add SEO Partner"}
          </ModalTitle>
          <ModalDescription>
            {isEdit
              ? "Update publisher metrics, pricing, and outreach status."
              : "Add a new website/publisher to your SEO outreach directory."}
          </ModalDescription>
        </ModalHeader>

        <ModalBody className="py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Website Name</FieldLabel>
              <Input
                placeholder="e.g. Reeves Roam"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel>Target URL</FieldLabel>
              <Input
                placeholder="e.g. https://reevesroam.com/contact/"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field>
              <FieldLabel>Domain Rating (DR)</FieldLabel>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 59"
                value={dr}
                onChange={(e) => setDr(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>Backlinks</FieldLabel>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 21000"
                value={backlinks}
                onChange={(e) => setBacklinks(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>Backlink For (Client)</FieldLabel>
              <Input
                placeholder="e.g. Realistic Asia"
                value={backlinkFor}
                onChange={(e) => setBacklinkFor(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Outreach Status</FieldLabel>
              <NativeSelect
                value={outreachStatus}
                onChange={(e) =>
                  setOutreachStatus(e.target.value as SEO_PARTNER_STATUS)
                }
              >
                <option value={SEO_PARTNER_STATUS.NOT_STARTED}>
                  Not Started
                </option>
                <option value={SEO_PARTNER_STATUS.OUTREACHED}>
                  Outreached
                </option>
                <option value={SEO_PARTNER_STATUS.OVERBUDGET}>
                  Overbudget
                </option>
                <option value={SEO_PARTNER_STATUS.IN_PROGRESS}>
                  In Progress
                </option>
                <option value={SEO_PARTNER_STATUS.ACCEPTED}>Accepted</option>
                <option value={SEO_PARTNER_STATUS.REJECTED}>Rejected</option>
                <option value={SEO_PARTNER_STATUS.DO_NOT_CONTACT}>
                  Do Not Contact
                </option>
              </NativeSelect>
            </Field>

            <Field>
              <FieldLabel>Quoted Price / Rate</FieldLabel>
              <Input
                placeholder="e.g. £650 for link placement, 700 EUR"
                value={quotedPrice}
                onChange={(e) => setQuotedPrice(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field>
              <FieldLabel>Contact Email</FieldLabel>
              <Input
                type="email"
                placeholder="editor@domain.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>Outreach Date</FieldLabel>
              <Input
                type="date"
                value={outreachDate}
                onChange={(e) => setOutreachDate(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>Follow Up Date</FieldLabel>
              <Input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel>Notes & Angles</FieldLabel>
            <Textarea
              placeholder="e.g. Prefers travel pitches on Vietnam / Southeast Asia, contact form works better than email."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </ModalBody>

        <ModalFooter className="pt-3 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEdit
                ? "Save Changes"
                : "Add Partner"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
