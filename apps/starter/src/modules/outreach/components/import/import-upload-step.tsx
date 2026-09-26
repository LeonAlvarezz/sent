import React, { useState } from "react";
import {
  Button,
  CheckIcon,
  FieldLabel,
  Input,
  NativeSelect,
  PlusIcon,
  SpinnerIcon,
  Tag,
  Upload,
} from "@z3/admin-core";
import type { UploadFileItem } from "@z3/admin-core";
import type { EmailList } from "@z3/types";

export interface ImportUploadStepProps {
  uploadItems: UploadFileItem[];
  setUploadItems: (items: UploadFileItem[]) => void;
  isParsing: boolean;
  onFileProcess: (file: File) => void;
  onClearData: () => void;
  targetListId: string;
  setTargetListId: (id: string) => void;
  emailLists: EmailList[];
  onCreateList?: (data: {
    name: string;
    description?: string;
  }) => Promise<EmailList>;
  detectedSheetName: string;
  totalEmails: number;
  validEmailsCount: number;
}

export function ImportUploadStep({
  uploadItems,
  setUploadItems,
  isParsing,
  onFileProcess,
  onClearData,
  targetListId,
  setTargetListId,
  emailLists,
  onCreateList,
  detectedSheetName,
  totalEmails,
  validEmailsCount,
}: ImportUploadStepProps) {
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isSubmittingNewList, setIsSubmittingNewList] = useState(false);

  const handleQuickCreateList = async () => {
    if (!newListName.trim() || !onCreateList) return;
    try {
      setIsSubmittingNewList(true);
      const created = await onCreateList({ name: newListName.trim() });
      setTargetListId(String(created.id));
      setNewListName("");
      setIsCreatingList(false);
    } catch {
      // Handled by parent toast
    } finally {
      setIsSubmittingNewList(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* File Upload Zone */}
      <div className="space-y-2">
        <Upload
          accept="spreadsheet"
          multiple={false}
          showLinkInput={false}
          value={uploadItems}
          onChange={(items) => {
            setUploadItems(items);
            if (items.length === 0) {
              onClearData();
            }
          }}
          onDropAccepted={(files) => {
            if (files[0]) onFileProcess(files[0]);
          }}
        >
          <Upload.Area
            title={
              <span>
                <span className="font-semibold text-primary">
                  Click to browse
                </span>{" "}
                or drop your Excel / CSV file
              </span>
            }
            description="Supports .xlsx, .xls, and .csv files with automatic formatting"
          />
          <Upload.FileList />
        </Upload>

        {isParsing && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-2.5 bg-muted/40 rounded border border-border">
            <SpinnerIcon className="size-3.5 text-primary animate-spin" />
            <span>
              Reading spreadsheet and auto-detecting email columns...
            </span>
          </div>
        )}
      </div>

      {/* Target Audience List */}
      <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
        <div className="flex items-center justify-between">
          <FieldLabel className="mb-0 text-xs font-semibold">
            Target Audience List
          </FieldLabel>
          {onCreateList && !isCreatingList && (
            <button
              type="button"
              onClick={() => setIsCreatingList(true)}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <PlusIcon className="size-3" />
              <span>Create New List</span>
            </button>
          )}
        </div>

        {isCreatingList ? (
          <div className="flex items-center gap-2">
            <Input
              placeholder="List name (e.g. Travel Advisors)..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              containerClassName="flex-1 h-8"
              className="text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleQuickCreateList();
                }
              }}
            />
            <Button
              size="sm"
              variant="default"
              className="h-8 text-xs"
              onClick={handleQuickCreateList}
              disabled={isSubmittingNewList || !newListName.trim()}
            >
              {isSubmittingNewList ? "Saving..." : "Save List"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setIsCreatingList(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <NativeSelect
            value={targetListId}
            onChange={(e) => setTargetListId(e.target.value)}
            className="h-9 text-xs"
          >
            <option value="">General Emails (No List)</option>
            {emailLists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.emailCount} emails)
              </option>
            ))}
          </NativeSelect>
        )}
      </div>

      {/* Auto-detected Confirmation Card */}
      {totalEmails > 0 && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Successfully detected {validEmailsCount} emails
                {detectedSheetName ? ` in "${detectedSheetName}"` : ""}!
              </span>
            </div>
            <Tag color="emerald" className="text-[11px] py-0.5 px-2">
              Ready for Review
            </Tag>
          </div>
          <p className="text-xs text-muted-foreground">
            Names, emails, companies, and custom attributes have been
            automatically mapped. Click below to review the emails before
            adding them to your list.
          </p>
        </div>
      )}
    </div>
  );
}
