import * as XLSX from "xlsx";
import type { ParsedSpreadsheetData } from "./types";

// Locate the header row by searching for standard email/contact keywords and checking cell counts
export function findHeaderRowIndex(rawRows: any[][]): number {
  if (rawRows.length === 0) return -1;
  const maxSearch = Math.min(rawRows.length, 10);
  const headerKeywords = [
    "email",
    "mail",
    "first name",
    "firstname",
    "last name",
    "lastname",
    "name",
    "contact",
    "domain",
    "company",
    "title",
  ];

  // Strategy 1: Look for a row with standard header keywords and at least 2 non-empty cells
  for (let i = 0; i < maxSearch; i++) {
    const row = rawRows[i];
    if (!Array.isArray(row)) continue;
    const matchesKeyword = row.some((cell) => {
      const s = String(cell || "")
        .toLowerCase()
        .trim();
      return headerKeywords.some((kw) => s.includes(kw));
    });
    const nonEmptyCells = row.filter(
      (cell) => String(cell || "").trim().length > 0,
    );
    if (matchesKeyword && nonEmptyCells.length >= 2) {
      return i;
    }
  }

  // Strategy 2: Fall back to row with maximum non-empty cells in the first 10 rows
  let bestIndex = 0;
  let maxCols = 0;
  for (let i = 0; i < maxSearch; i++) {
    const count = (rawRows[i] || []).filter(
      (cell) => String(cell || "").trim().length > 0,
    ).length;
    if (count > maxCols) {
      maxCols = count;
      bestIndex = i;
    }
  }

  return bestIndex;
}

// Automatically detect key columns from headers
export function autoDetectColumns(
  headers: string[],
  rows: Record<string, string>[],
): {
  emailCol: string;
  firstNameCol: string;
  lastNameCol: string;
  domainUrlCol: string;
  titleCol: string;
  personLinkedinCol: string;
  companyCol: string;
  countryCol: string;
  typeCol: string;
  companyLinkedinCol: string;
} {
  const normalized = headers.map((h) =>
    h.toLowerCase().replace(/[_\s-]+/g, ""),
  );

  // 1. Email
  let emailCol = "";
  const emailKeywords = [
    "email",
    "mail",
    "recipient",
    "contactemail",
    "emailaddress",
    "primaryemail",
  ];
  for (const kw of emailKeywords) {
    const idx = normalized.findIndex((h) => h.includes(kw));
    if (idx !== -1) {
      emailCol = headers[idx];
      break;
    }
  }
  // Fallback: check first 5 rows to see which column values contain "@"
  if (!emailCol && rows.length > 0) {
    const sample = rows.slice(0, 5);
    for (const h of headers) {
      const count = sample.filter(
        (r) => r[h] && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r[h]),
      ).length;
      if (count >= 1) {
        emailCol = h;
        break;
      }
    }
  }

  // 2. First Name
  let firstNameCol = "";
  const firstNameKeywords = [
    "firstname",
    "first",
    "fname",
    "givenname",
    "forename",
  ];
  for (const kw of firstNameKeywords) {
    const idx = normalized.findIndex((h) => h === kw || h.includes(kw));
    if (idx !== -1) {
      firstNameCol = headers[idx];
      break;
    }
  }
  if (!firstNameCol) {
    const idx = normalized.findIndex((h) => h === "name");
    if (idx !== -1) {
      firstNameCol = headers[idx];
    }
  }

  // 3. Last Name
  let lastNameCol = "";
  const lastNameKeywords = [
    "lastname",
    "last",
    "lname",
    "surname",
    "familyname",
  ];
  for (const kw of lastNameKeywords) {
    const idx = normalized.findIndex((h) => h === kw || h.includes(kw));
    if (idx !== -1) {
      lastNameCol = headers[idx];
      break;
    }
  }

  // 4. Domain URL
  let domainUrlCol = "";
  const domainKeywords = ["domainurl", "domain", "website", "url"];
  for (const kw of domainKeywords) {
    const idx = normalized.findIndex((h) => h === kw || h.includes(kw));
    if (idx !== -1) {
      domainUrlCol = headers[idx];
      break;
    }
  }

  // 5. Title
  let titleCol = "";
  const titleKeywords = ["title", "jobtitle", "position", "role", "occupation"];
  for (const kw of titleKeywords) {
    const idx = normalized.findIndex((h) => h === kw || h.includes(kw));
    if (idx !== -1) {
      titleCol = headers[idx];
      break;
    }
  }

  // 6. Person Linkedin
  let personLinkedinCol = "";
  const personLinkedinKeywords = [
    "personlinkedin",
    "personallinkedin",
    "userlinkedin",
  ];
  for (const kw of personLinkedinKeywords) {
    const idx = normalized.findIndex((h) => h.includes(kw));
    if (idx !== -1) {
      personLinkedinCol = headers[idx];
      break;
    }
  }

  // 7. Company Name
  let companyCol = "";
  const companyKeywords = [
    "companyname",
    "company",
    "organization",
    "org",
    "business",
  ];
  for (const kw of companyKeywords) {
    const idx = normalized.findIndex((h) => h === kw || h.includes(kw));
    if (idx !== -1) {
      companyCol = headers[idx];
      break;
    }
  }

  // 8. Country
  let countryCol = "";
  const countryKeywords = ["country", "nation", "location"];
  for (const kw of countryKeywords) {
    const idx = normalized.findIndex((h) => h === kw || h.includes(kw));
    if (idx !== -1) {
      countryCol = headers[idx];
      break;
    }
  }

  // 9. Type
  let typeCol = "";
  const typeKeywords = ["type", "industry", "category"];
  for (const kw of typeKeywords) {
    const idx = normalized.findIndex((h) => h === kw || h.includes(kw));
    if (idx !== -1) {
      typeCol = headers[idx];
      break;
    }
  }

  // 10. Company Linkedin
  let companyLinkedinCol = "";
  const companyLinkedinKeywords = [
    "companylinkedin",
    "orglinkedin",
    "businesslinkedin",
  ];
  for (const kw of companyLinkedinKeywords) {
    const idx = normalized.findIndex((h) => h.includes(kw));
    if (idx !== -1) {
      companyLinkedinCol = headers[idx];
      break;
    }
  }
  // Fallback for generic linkedin if only one exists
  if (!personLinkedinCol && !companyLinkedinCol) {
    const idx = normalized.findIndex((h) => h.includes("linkedin"));
    if (idx !== -1) {
      personLinkedinCol = headers[idx];
    }
  }

  return {
    emailCol,
    firstNameCol,
    lastNameCol,
    domainUrlCol,
    titleCol,
    personLinkedinCol,
    companyCol,
    countryCol,
    typeCol,
    companyLinkedinCol,
  };
}

// Extract rows from worksheet and ignore trailing empty formatted rows
export function extractSheetData(
  worksheet: XLSX.WorkSheet,
): ParsedSpreadsheetData {
  const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, {
    header: 1,
    defval: "",
  });
  if (rawRows.length === 0) return { headers: [], rows: [] };

  const headerIndex = findHeaderRowIndex(rawRows);
  if (headerIndex === -1) return { headers: [], rows: [] };

  const headers = rawRows[headerIndex].map((h: any, idx: number) => {
    const str = String(h || "").trim();
    return str || `Column_${idx + 1}`;
  });

  const rows: Record<string, string>[] = [];
  for (let i = headerIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row.some((cell: any) => String(cell).trim().length > 0)) {
      continue;
    }
    const rowObj: Record<string, string> = {};
    headers.forEach((h, colIdx) => {
      rowObj[h] = row[colIdx] !== undefined ? String(row[colIdx]).trim() : "";
    });

    // Ignore completely empty rows
    if (Object.values(rowObj).some((v) => v.length > 0)) {
      rows.push(rowObj);
    }
  }

  return { headers, rows };
}

// --- DUPLICATE DETECTION HELPERS ---
export interface ContactLookup {
  emails: Set<string>;
  companyTitles: Set<string>;
}

export function createContactLookup(
  contacts?: Array<{
    email: string;
    companyName?: string | null;
    title?: string | null;
  }>,
): ContactLookup {
  const emails = new Set<string>();
  const companyTitles = new Set<string>();

  if (contacts) {
    for (const c of contacts) {
      if (c.email) {
        emails.add(c.email.trim().toLowerCase());
      }
      const company = (c.companyName || "").trim().toLowerCase();
      const title = (c.title || "").trim().toLowerCase();
      if (company && title) {
        companyTitles.add(`${company}:::${title}`);
      }
    }
  }

  return { emails, companyTitles };
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  reason: "email" | "company_title" | "both" | null;
  source: "file" | "database" | null;
}

export function checkContactDuplicate(
  item: { email?: string; companyName?: string; title?: string },
  seenInFile: ContactLookup,
  dbLookup?: ContactLookup,
): DuplicateCheckResult {
  const normEmail = (item.email || "").trim().toLowerCase();
  const normCompany = (item.companyName || "").trim().toLowerCase();
  const normTitle = (item.title || "").trim().toLowerCase();
  const companyTitleKey =
    normCompany && normTitle ? `${normCompany}:::${normTitle}` : null;

  // 1. Check against Database
  const dbEmailMatch = Boolean(normEmail && dbLookup?.emails.has(normEmail));
  const dbCompanyTitleMatch = Boolean(
    companyTitleKey && dbLookup?.companyTitles.has(companyTitleKey),
  );

  if (dbEmailMatch && dbCompanyTitleMatch) {
    return { isDuplicate: true, reason: "both", source: "database" };
  }
  if (dbEmailMatch) {
    return { isDuplicate: true, reason: "email", source: "database" };
  }
  if (dbCompanyTitleMatch) {
    return { isDuplicate: true, reason: "company_title", source: "database" };
  }

  // 2. Check against seen items in the file
  const fileEmailMatch = Boolean(normEmail && seenInFile.emails.has(normEmail));
  const fileCompanyTitleMatch = Boolean(
    companyTitleKey && seenInFile.companyTitles.has(companyTitleKey),
  );

  if (fileEmailMatch && fileCompanyTitleMatch) {
    return { isDuplicate: true, reason: "both", source: "file" };
  }
  if (fileEmailMatch) {
    return { isDuplicate: true, reason: "email", source: "file" };
  }
  if (fileCompanyTitleMatch) {
    return { isDuplicate: true, reason: "company_title", source: "file" };
  }

  return { isDuplicate: false, reason: null, source: null };
}
