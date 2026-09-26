import type { EmailList, ImportEmailsPayload } from "@z3/types";

export interface ImportEmailModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  emailLists?: EmailList[];
  defaultListId?: number;
  existingEmails?: Array<{
    email: string;
    companyName?: string | null;
    title?: string | null;
  }>;
  onImport: (data: ImportEmailsPayload) => Promise<void>;
  onCreateList?: (data: {
    name: string;
    description?: string;
  }) => Promise<EmailList>;
}

export interface ReviewEmail {
  id: number;
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
  attributes: Record<string, any>;
  isValidEmail: boolean;
  selected: boolean;
  isDuplicate?: boolean;
  duplicateReason?: "email" | "company_title" | "both" | null;
  duplicateSource?: "file" | "database" | null;
}

export interface ParsedSpreadsheetData {
  headers: string[];
  rows: Record<string, string>[];
}
