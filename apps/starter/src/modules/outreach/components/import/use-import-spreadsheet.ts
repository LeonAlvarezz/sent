import { useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "@z3/admin-core";
import type { UploadFileItem } from "@z3/admin-core";
import type { ParsedSpreadsheetData, ReviewEmail } from "./types";
import type { ContactLookup } from "./spreadsheet-parser";
import {
  autoDetectColumns,
  checkContactDuplicate,
  createContactLookup,
  extractSheetData,
} from "./spreadsheet-parser";

export * from "./spreadsheet-parser";

export interface UseImportSpreadsheetOptions {
  existingEmails?: Array<{
    email: string;
    companyName?: string | null;
    title?: string | null;
  }>;
}

export function useImportSpreadsheet(options?: UseImportSpreadsheetOptions) {
  const existingEmails = options?.existingEmails;
  const [uploadItems, setUploadItems] = useState<UploadFileItem[]>([]);
  const [parsedData, setParsedData] = useState<ParsedSpreadsheetData>({
    headers: [],
    rows: [],
  });
  const [detectedSheetName, setDetectedSheetName] = useState<string>("");
  const [isParsing, setIsParsing] = useState(false);
  const [reviewEmails, setReviewEmails] = useState<ReviewEmail[]>([]);

  const resetSpreadsheetState = () => {
    setUploadItems([]);
    setParsedData({ headers: [], rows: [] });
    setDetectedSheetName("");
    setReviewEmails([]);
  };

  const handleFileProcess = async (file: File) => {
    try {
      setIsParsing(true);
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      const wb = XLSX.read(data, { type: "array" });

      // If a sheet is named "Contacts" or "Emails", prioritize it, otherwise pick the first sheet
      const preferredSheet =
        wb.SheetNames.find(
          (s) =>
            s.toLowerCase() === "emails" || s.toLowerCase() === "contacts",
        ) ||
        wb.SheetNames[0] ||
        "";

      setDetectedSheetName(preferredSheet);

      if (preferredSheet) {
        const extracted = extractSheetData(wb.Sheets[preferredSheet]);
        setParsedData(extracted);

        if (extracted.rows.length === 0) {
          toast.warning("No email rows found in this file.");
          return;
        }

        // Auto-detect columns
        const auto = autoDetectColumns(extracted.headers, extracted.rows);

        if (!auto.emailCol) {
          toast.error(
            "Could not automatically locate an Email column in this file.",
          );
          return;
        }

        // Build review emails directly
        const knownCols = new Set(
          [
            auto.emailCol,
            auto.firstNameCol,
            auto.lastNameCol,
            auto.domainUrlCol,
            auto.titleCol,
            auto.personLinkedinCol,
            auto.companyCol,
            auto.countryCol,
            auto.typeCol,
            auto.companyLinkedinCol,
          ].filter(Boolean),
        );

        const dbLookup = createContactLookup(existingEmails);
        const seenInFile: ContactLookup = {
          emails: new Set<string>(),
          companyTitles: new Set<string>(),
        };

        const items: ReviewEmail[] = extracted.rows.map((row, idx) => {
          const rawEmail = String(row[auto.emailCol] || "")
            .trim()
            .toLowerCase();
          const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail);
          const firstName = auto.firstNameCol
            ? String(row[auto.firstNameCol] || "").trim()
            : undefined;
          const lastName = auto.lastNameCol
            ? String(row[auto.lastNameCol] || "").trim()
            : undefined;
          const domainUrl = auto.domainUrlCol
            ? String(row[auto.domainUrlCol] || "").trim()
            : undefined;
          const title = auto.titleCol
            ? String(row[auto.titleCol] || "").trim()
            : undefined;
          const personLinkedin = auto.personLinkedinCol
            ? String(row[auto.personLinkedinCol] || "").trim()
            : undefined;
          const companyName = auto.companyCol
            ? String(row[auto.companyCol] || "").trim()
            : undefined;
          const country = auto.countryCol
            ? String(row[auto.countryCol] || "").trim()
            : undefined;
          const type = auto.typeCol
            ? String(row[auto.typeCol] || "").trim()
            : undefined;
          const companyLinkedin = auto.companyLinkedinCol
            ? String(row[auto.companyLinkedinCol] || "").trim()
            : undefined;

          // Remaining columns into dynamic attributes
          const attributes: Record<string, any> = {};
          Object.entries(row).forEach(([k, val]) => {
            if (!knownCols.has(k) && String(val).trim() !== "") {
              attributes[k] = String(val).trim();
            }
          });

          const dupCheck = checkContactDuplicate(
            { email: rawEmail, companyName, title },
            seenInFile,
            dbLookup,
          );

          // Track in seenInFile for subsequent rows
          if (rawEmail) seenInFile.emails.add(rawEmail);
          const normCompany = (companyName || "").trim().toLowerCase();
          const normTitle = (title || "").trim().toLowerCase();
          if (normCompany && normTitle) {
            seenInFile.companyTitles.add(`${normCompany}:::${normTitle}`);
          }

          // Pre-select ONLY if valid email AND not a duplicate
          const shouldSelect = isValid && !dupCheck.isDuplicate;

          return {
            id: idx + 1,
            email: rawEmail,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            domainUrl: domainUrl || undefined,
            title: title || undefined,
            personLinkedin: personLinkedin || undefined,
            companyName: companyName || undefined,
            country: country || undefined,
            type: type || undefined,
            companyLinkedin: companyLinkedin || undefined,
            attributes,
            isValidEmail: isValid,
            selected: shouldSelect,
            isDuplicate: dupCheck.isDuplicate,
            duplicateReason: dupCheck.reason,
            duplicateSource: dupCheck.source,
          };
        });

        setReviewEmails(items);

        const validCount = items.filter((i) => i.isValidEmail).length;
        const duplicateCount = items.filter((i) => i.isDuplicate).length;

        if (duplicateCount > 0) {
          toast.success(
            `Detected ${validCount} valid emails (${duplicateCount} duplicate${
              duplicateCount > 1 ? "s" : ""
            } unselected by default)`,
          );
        } else {
          toast.success(`Detected ${validCount} valid emails!`);
        }
      }
    } catch (err: any) {
      toast.error(
        `Failed to parse spreadsheet: ${err.message || "Invalid file"}`,
      );
    } finally {
      setIsParsing(false);
    }
  };

  return {
    uploadItems,
    setUploadItems,
    parsedData,
    detectedSheetName,
    isParsing,
    reviewEmails,
    setReviewEmails,
    // Aliases for compatibility if needed
    reviewContacts: reviewEmails,
    setReviewContacts: setReviewEmails,
    resetSpreadsheetState,
    handleFileProcess,
  };
}
