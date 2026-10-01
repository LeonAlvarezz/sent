import React, { useMemo, useState } from "react";
import {
  Button,
  ChevronLeftIcon,
  ChevronRightIcon,
  Modal,
  ModalBody,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  SpinnerIcon,
  toast,
} from "@z3/admin-core";
import type { ImportEmailsPayload } from "@z3/types";
import { useEmailsQuery } from "../outreach.api";
import {
  ImportReviewStep,
  ImportUploadStep,
  useImportSpreadsheet,
} from "./import";
import type { ImportEmailModalProps, ReviewEmail } from "./import";

export function ImportEmailModal({
  isOpen,
  setIsOpen,
  emailLists = [],
  defaultListId,
  existingEmails,
  onImport,
  onCreateList,
}: ImportEmailModalProps & { contactLists?: any }) {
  // Step navigation: 1 = Upload, 2 = Review & Add
  const [step, setStep] = useState<1 | 2>(1);

  // Target audience list
  const [targetListId, setTargetListId] = useState<string>(
    defaultListId ? String(defaultListId) : "",
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default to querying all existing emails from backend if not explicitly provided
  const { data: dbEmailsData } = useEmailsQuery();
  const dbEmails = dbEmailsData?.emails ?? [];
  const effectiveExistingEmails = existingEmails ?? dbEmails;

  const {
    uploadItems,
    setUploadItems,
    detectedSheetName,
    isParsing,
    reviewEmails,
    setReviewEmails,
    resetSpreadsheetState,
    handleFileProcess,
  } = useImportSpreadsheet({ existingEmails: effectiveExistingEmails });

  // Sync defaultListId if targetListId not yet set
  React.useEffect(() => {
    if (defaultListId && !targetListId) {
      setTargetListId(String(defaultListId));
    }
  }, [defaultListId, targetListId]);

  const handleReset = () => {
    setStep(1);
    resetSpreadsheetState();
  };

  const handleClose = () => {
    handleReset();
    setIsOpen(false);
  };

  const validEmails = useMemo(
    () => reviewEmails.filter((c) => c.isValidEmail),
    [reviewEmails],
  );

  const selectedValidCount = useMemo(
    () => reviewEmails.filter((c) => c.selected && c.isValidEmail).length,
    [reviewEmails],
  );

  const targetListName = useMemo(() => {
    if (!targetListId) return "General Emails (No List)";
    const found = emailLists.find((l) => String(l.id) === targetListId);
    return found ? found.name : "Selected List";
  }, [targetListId, emailLists]);

  // Execute Import
  const handleExecuteImport = async () => {
    const toImport = reviewEmails.filter((c) => c.selected && c.isValidEmail);
    if (toImport.length === 0) {
      toast.error("No valid emails selected to import");
      return;
    }

    const payload: ImportEmailsPayload = {
      listId: targetListId ? Number(targetListId) : null,
      emails: toImport.map((c) => ({
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        domainUrl: c.domainUrl,
        title: c.title,
        personLinkedin: c.personLinkedin,
        companyName: c.companyName,
        country: c.country,
        type: c.type,
        companyLinkedin: c.companyLinkedin,
        attributes: c.attributes,
      })),
    };

    try {
      setIsSubmitting(true);
      await onImport(payload);
      handleReset();
      setIsOpen(false);
    } catch {
      // Handled by caller toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={(open) => {
        if (!open) handleReset();
        setIsOpen(open);
      }}
      size={step === 1 ? "2xl" : "4xl"}
    >
      <ModalHeader>
        <div className="flex items-center justify-between pr-8">
          <div>
            <ModalTitle>Import Emails</ModalTitle>
            <ModalDescription>
              {step === 1
                ? "Upload your Excel or CSV file. We'll automatically process the emails for you."
                : `Review and verify emails before adding them to "${targetListName}".`}
            </ModalDescription>
          </div>
        </div>
      </ModalHeader>

      <ModalBody className="space-y-4">
        {step === 1 ? (
          <ImportUploadStep
            uploadItems={uploadItems}
            setUploadItems={setUploadItems}
            isParsing={isParsing}
            onFileProcess={handleFileProcess}
            onClearData={resetSpreadsheetState}
            targetListId={targetListId}
            setTargetListId={setTargetListId}
            emailLists={emailLists}
            onCreateList={onCreateList}
            detectedSheetName={detectedSheetName}
            totalEmails={reviewEmails.length}
            validEmailsCount={validEmails.length}
          />
        ) : (
          <ImportReviewStep
            reviewEmails={reviewEmails}
            setReviewEmails={setReviewEmails}
            targetListName={targetListName}
          />
        )}
      </ModalBody>

      <ModalFooter className="flex items-center justify-between">
        {step === 1 ? (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={() => setStep(2)}
              disabled={reviewEmails.length === 0 || isParsing}
              className="flex items-center gap-1.5"
            >
              <span>Review Emails ({validEmails.length})</span>
              <ChevronRightIcon className="size-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(1)}
              disabled={isSubmitting}
              className="flex items-center gap-1"
            >
              <ChevronLeftIcon className="size-4" />
              <span>Change File</span>
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={handleExecuteImport}
                disabled={isSubmitting || selectedValidCount === 0}
                className="flex items-center gap-1.5 min-w-[180px] justify-center"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerIcon className="size-4 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <span>
                    Add {selectedValidCount} Email
                    {selectedValidCount === 1 ? "" : "s"} to List
                  </span>
                )}
              </Button>
            </div>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}

export default ImportEmailModal;
export type { ImportEmailModalProps, ReviewEmail };
