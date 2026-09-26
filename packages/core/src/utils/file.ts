export const FILE_PRESETS = {
  IMAGE: "image/*",
  VIDEO: "video/*",
  AUDIO: "audio/*",
  PDF: ".pdf,application/pdf",
  DOCUMENT:
    ".pdf,.doc,.docx,.txt,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  SPREADSHEET:
    ".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ARCHIVE:
    ".zip,.rar,.tar,.gz,.7z,application/zip,application/x-tar,application/gzip",
  CSV: ".csv,text/csv",
} as const;

export type FilePresetKey =
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "document"
  | "spreadsheet"
  | "archive"
  | "csv";

export type UploadAcceptItem =
  | FilePresetKey
  | (typeof FILE_PRESETS)[keyof typeof FILE_PRESETS]
  | `.${string}`
  | `${string}/*`
  | (string & {});

export type UploadAccept = UploadAcceptItem | UploadAcceptItem[];

/**
 * Normalizes an UploadAccept prop (preset key, extension, MIME, or array)
 * into a single comma-separated string suitable for native `<input accept="..." />`
 * and file validation.
 */
export function normalizeAccept(accept?: UploadAccept): string | undefined {
  if (!accept) return undefined;

  const list = Array.isArray(accept) ? accept : [accept];
  const tokens = list.flatMap((item) => {
    const upper = item.toUpperCase() as keyof typeof FILE_PRESETS;
    if (upper in FILE_PRESETS) {
      return FILE_PRESETS[upper].split(",");
    }
    return item.split(",");
  });

  return Array.from(new Set(tokens.map((t) => t.trim()).filter(Boolean))).join(
    ",",
  );
}
