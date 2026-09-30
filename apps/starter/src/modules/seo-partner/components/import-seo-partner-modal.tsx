import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Button,
  DataTable,
  Modal,
  ModalBody,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Tag,
  toast,
  UploadCloudIcon,
} from "@z3/admin-core";
import { SEO_PARTNER_STATUS } from "@z3/types";
import type { CreateSeoPartner } from "@z3/types";
import type { ColumnDef } from "@tanstack/react-table";
import type { DefaultDataTableFeatures } from "@z3/admin-core";

export interface ImportSeoPartnerModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onImport: (partners: CreateSeoPartner[]) => Promise<void>;
}

function normalizeStatus(val: any): SEO_PARTNER_STATUS {
  if (!val) return SEO_PARTNER_STATUS.NOT_STARTED;
  const s = String(val).trim().toLowerCase().replace(/[\s-_]+/g, "_");
  if (s.includes("outreach")) return SEO_PARTNER_STATUS.OUTREACHED;
  if (s.includes("overbudget") || s.includes("over_budget")) return SEO_PARTNER_STATUS.OVERBUDGET;
  if (s.includes("progress")) return SEO_PARTNER_STATUS.IN_PROGRESS;
  if (s.includes("accept") || s.includes("live") || s.includes("placed")) return SEO_PARTNER_STATUS.ACCEPTED;
  if (s.includes("reject")) return SEO_PARTNER_STATUS.REJECTED;
  if (
    s.includes("do_not_contact") ||
    s.includes("not_contact") ||
    s.includes("dnc") ||
    s.includes("blacklist") ||
    s.includes("not_work") ||
    s.includes("wont_work") ||
    s.includes("blocked")
  ) {
    return SEO_PARTNER_STATUS.DO_NOT_CONTACT;
  }
  return SEO_PARTNER_STATUS.NOT_STARTED;
}

function parseNumber(val: any): number | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return isNaN(val) ? null : val;
  const cleaned = String(val).replace(/,/g, "").trim();
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

export function ImportSeoPartnerModal({
  isOpen,
  setIsOpen,
  onImport,
}: ImportSeoPartnerModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [parsedData, setParsedData] = useState<CreateSeoPartner[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetState = () => {
    setFileName("");
    setParsedData([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

      if (rows.length === 0) {
        toast.error("The spreadsheet is empty");
        setIsProcessing(false);
        return;
      }

      const partners: CreateSeoPartner[] = [];

      for (const row of rows) {
        // Map dynamic column names case-insensitively
        const keys = Object.keys(row);
        const findKey = (...patterns: string[]) =>
          keys.find((k) =>
            patterns.some((p) => k.toLowerCase().replace(/[^a-z0-9]/g, "").includes(p)),
          );

        const websiteKey = findKey("website", "site", "blog", "partner", "domain");
        const urlKey = findKey("url", "link", "contact", "web");
        const drKey = findKey("dr", "domainrating", "rating", "da");
        const backlinksKey = findKey("backlink", "links", "inbound");
        const backlinkForKey = findKey("backlinkfor", "client", "target", "brand", "project");
        const statusKey = findKey("outreachstatus", "status", "stage");
        const outreachDateKey = findKey("outreachdate", "datesent", "sentat");
        const followUpDateKey = findKey("followupdate", "followup", "nextfollow");
        const priceKey = findKey("quotedprice", "price", "cost", "fee", "rate");

        const website = String(row[websiteKey || ""] || "").trim();
        const url = String(row[urlKey || ""] || "").trim();

        // Skip rows without website or url
        if (!website && !url) continue;

        const partner: CreateSeoPartner = {
          website: website || url,
          url: url || website,
          dr: parseNumber(drKey ? row[drKey] : null),
          backlinks: parseNumber(backlinksKey ? row[backlinksKey] : null),
          backlinkFor: backlinkForKey ? String(row[backlinkForKey] || "").trim() || null : null,
          outreachStatus: normalizeStatus(statusKey ? row[statusKey] : null),
          outreachDate: outreachDateKey && row[outreachDateKey]
            ? new Date(row[outreachDateKey]).toISOString()
            : null,
          followUpDate: followUpDateKey && row[followUpDateKey]
            ? new Date(row[followUpDateKey]).toISOString()
            : null,
          quotedPrice: priceKey ? String(row[priceKey] || "").trim() || null : null,
        };

        partners.push(partner);
      }

      setParsedData(partners);
      toast.success(`Parsed ${partners.length} partners from spreadsheet`);
    } catch (err: any) {
      toast.error(err.message || "Failed to parse spreadsheet");
      resetState();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommit = async () => {
    if (parsedData.length === 0) return;

    try {
      setIsSubmitting(true);
      await onImport(parsedData);
      toast.success(`Successfully imported ${parsedData.length} SEO partners`);
      setIsOpen(false);
      resetState();
    } catch (err: any) {
      toast.error(err.message || "Failed to import partners");
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewColumns: ColumnDef<DefaultDataTableFeatures, CreateSeoPartner>[] = [
    {
      accessorKey: "website",
      header: "Website",
      cell: ({ row }) => (
        <span className="font-semibold text-foreground text-xs">
          {row.original.website}
        </span>
      ),
      size: 160,
    },
    {
      accessorKey: "url",
      header: "URL",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground truncate max-w-[180px] inline-block">
          {row.original.url}
        </span>
      ),
      size: 180,
    },
    {
      accessorKey: "dr",
      header: "DR",
      cell: ({ row }) => (
        <Tag color="sky">
          {row.original.dr ?? "—"}
        </Tag>
      ),
      size: 60,
    },
    {
      accessorKey: "backlinks",
      header: "Backlinks",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.backlinks?.toLocaleString() ?? "—"}
        </span>
      ),
      size: 90,
    },
    {
      accessorKey: "backlinkFor",
      header: "Client",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.backlinkFor || "—"}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: "outreachStatus",
      header: "Status",
      cell: ({ row }) => (
        <Tag color="amber" className="capitalize">
          {row.original.outreachStatus?.replace("_", " ")}
        </Tag>
      ),
      size: 100,
    },
    {
      accessorKey: "quotedPrice",
      header: "Quoted Price",
      cell: ({ row }) => (
        <span className="text-xs truncate max-w-[120px] inline-block">
          {row.original.quotedPrice || "—"}
        </span>
      ),
      size: 120,
    },
  ];

  return (
    <Modal
      open={isOpen}
      onClose={() => {
        setIsOpen(false);
        resetState();
      }}
      size="xl"
    >
      <ModalHeader className="pb-3">
        <ModalTitle>Import SEO Partners</ModalTitle>
        <ModalDescription>
          Upload your existing SEO partner spreadsheet (.xlsx, .xls, .csv).
        </ModalDescription>
      </ModalHeader>

      <ModalBody className="py-4 space-y-4">
        {parsedData.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-primary/50 bg-accent/30 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors text-center"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
              <UploadCloudIcon className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">
              Click to upload or drag & drop spreadsheet
            </p>
            <p className="text-xs text-muted-foreground">
              Supports .xlsx, .xls, and .csv with columns: Website, URL, # DR, # Backlinks, Backlink for, Outreach Status, Quoted Price.
            </p>
            {isProcessing && (
              <p className="text-xs text-primary font-medium mt-3 animate-pulse">
                Parsing spreadsheet rows...
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-foreground">
                  File: {fileName}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({parsedData.length} partners found)
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetState}
                disabled={isSubmitting}
              >
                Choose Another File
              </Button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto border border-border rounded-lg">
              <DataTable
                columns={previewColumns}
                data={parsedData}
              />
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter className="pt-3 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsOpen(false);
            resetState();
          }}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleCommit}
          disabled={parsedData.length === 0 || isSubmitting}
        >
          {isSubmitting
            ? "Importing..."
            : `Import ${parsedData.length > 0 ? parsedData.length : ""} Partners`}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
