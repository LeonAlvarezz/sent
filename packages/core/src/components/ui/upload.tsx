import type {
  ChangeEvent,
  ClipboardEvent,
  DragEvent,
  KeyboardEvent,
  ReactNode,
} from "react";
import { createContext, useContext, useId, useRef, useState } from "react";
import { cn } from "../../libs/cn";
import { formatFileSize } from "../../utils/formatters";
import { FILE_PRESETS, normalizeAccept } from "../../utils/file";
import type {
  FilePresetKey,
  UploadAccept,
  UploadAcceptItem,
} from "../../utils/file";
import Button from "./button";
import Input from "./input";
import { CloseIcon, FileTextIcon, LinkIcon, UploadIcon } from "./icons";

export { FILE_PRESETS, normalizeAccept };
export type { FilePresetKey, UploadAccept, UploadAcceptItem };

export interface UploadFileItem {
  /** Unique ID for the uploaded item */
  id: string;
  /** File or resource name */
  name: string;
  /** File size in bytes (optional for URL links) */
  size?: number;
  /** MIME type or file extension (optional) */
  type?: string;
  /** Preview or download URL (e.g. object URL, remote URL, or base64) */
  url: string;
  /** The underlying native File object if uploaded locally */
  file?: File;
  /** Error message if validation failed */
  error?: string;
}

export interface UploadContextValue {
  items: UploadFileItem[];
  addItem: (item: UploadFileItem) => void;
  removeItem: (id: string) => void;
  disabled?: boolean;
  multiple?: boolean;
  accept?: UploadAccept;
  normalizedAccept?: string;
  maxSize?: number;
  maxFiles?: number;
  isDragging: boolean;
  openFileDialog: () => void;
  processFiles: (files: FileList | File[]) => void;
  onLinkSubmit?: (url: string) => void;
}

const UploadContext = createContext<UploadContextValue | null>(null);

export function useUploadContext() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error(
      "Upload compound components must be used within a <Upload> or <Upload.Root>",
    );
  }
  return context;
}

export interface UploadLinkInputProps {
  className?: string;
  placeholder?: string;
  buttonText?: string;
  disabled?: boolean;
  onLinkSubmit?: (url: string) => void;
}

export function UploadLinkInput({
  className,
  placeholder = "Paste image or file link (e.g. https://...)",
  buttonText = "Upload",
  disabled,
  onLinkSubmit,
}: UploadLinkInputProps) {
  const context = useContext(UploadContext);
  const [urlInput, setUrlInput] = useState("");
  const isDisabled = disabled ?? context?.disabled ?? false;
  const isLink = urlInput.startsWith("https://");

  const handleSubmit = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    // Trigger explicit callback if provided
    if (onLinkSubmit) {
      onLinkSubmit(trimmed);
    } else if (context?.onLinkSubmit) {
      context.onLinkSubmit(trimmed);
    } else if (context) {
      // Default: create a new item from link
      let inferredName = "remote-file";
      try {
        const parsed = new URL(trimmed);
        const segments = parsed.pathname.split("/").filter(Boolean);
        if (segments.length > 0) {
          inferredName = decodeURIComponent(segments[segments.length - 1]);
        }
      } catch {
        inferredName = trimmed.split("/").pop() || "remote-file";
      }

      context.addItem({
        id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: inferredName,
        url: trimmed,
      });
    }

    setUrlInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    const clipboardData = e.clipboardData;

    // If user copied an image file / screenshot and pastes it into the link input
    if (clipboardData.files.length > 0) {
      const hasImageOrFile = Array.from(clipboardData.files).some(
        (f) => f.size > 0,
      );
      if (hasImageOrFile && context) {
        e.preventDefault();
        context.processFiles(clipboardData.files);
        return;
      }
    }
  };

  return (
    <div
      data-slot="upload-link-input"
      className={cn("flex items-center gap-2", className)}
    >
      <Input
        containerClassName="flex-1"
        placeholder={placeholder}
        value={urlInput}
        onChange={(e) => setUrlInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        disabled={isDisabled}
        startIcon={<LinkIcon className="size-4 shrink-0" />}
      />
      <Button
        type="button"
        variant="ghost"
        disabled={!isLink || isDisabled || !urlInput.trim()}
        onClick={handleSubmit}
      >
        {buttonText}
      </Button>
    </div>
  );
}

export interface UploadAreaProps {
  className?: string;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
}

export function UploadArea({
  className,
  title,
  description,
  icon,
  children,
  disabled,
}: UploadAreaProps) {
  const context = useUploadContext();
  const isDisabled = disabled ?? context.disabled ?? false;
  const isDragging = context.isDragging;

  const defaultTitle = (
    <span>
      <span className="font-semibold text-primary">Click to upload</span>, drag
      and drop, or paste
    </span>
  );

  const defaultDescription = context.accept
    ? `${
        Array.isArray(context.accept)
          ? context.accept.join(", ")
          : context.accept.replace(/\/\*/g, " (any)")
      }${context.maxSize ? ` up to ${formatFileSize(context.maxSize)}` : ""}`
    : context.maxSize
      ? `Up to ${formatFileSize(context.maxSize)}`
      : "Any supported files";

  // const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
  //   if (isDisabled) return;
  //   const clipboardData = e.clipboardData;
  //   if (!clipboardData) return;

  //   // Check for clipboard files (e.g. copied image or screenshot)
  //   if (clipboardData.files.length > 0) {
  //     e.preventDefault();
  //     context.processFiles(clipboardData.files);
  //     return;
  //   }

  //   // Check for text/URL in clipboard
  //   const text = clipboardData.getData("text").trim();
  //   if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
  //     e.preventDefault();
  //     if (context.onLinkSubmit) {
  //       context.onLinkSubmit(text);
  //     } else {
  //       let inferredName = "remote-file";
  //       try {
  //         const parsed = new URL(text);
  //         inferredName = parsed.pathname.split("/").pop() || "remote-file";
  //       } catch {
  //         inferredName = text.split("/").pop() || "remote-file";
  //       }
  //       context.addItem({
  //         id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  //         name: inferredName,
  //         url: text,
  //       });
  //     }
  //   }
  // };

  return (
    <div
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      data-slot="upload-area"
      aria-disabled={isDisabled}
      onClick={() => {
        if (!isDisabled) context.openFileDialog();
      }}
      onKeyDown={(e) => {
        if (!isDisabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          context.openFileDialog();
        }
      }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border px-6 py-8 text-center transition-colors cursor-pointer select-none",
        "hover:border-primary/60 hover:bg-muted/10",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isDragging && "border-primary bg-primary/5 ring-2 ring-primary/20",
        isDisabled &&
          "pointer-events-none opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent",
        className,
      )}
    >
      {children ?? (
        <>
          <div className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground mb-3 transition-transform group-hover:scale-105">
            {icon ?? <UploadIcon className="size-6 text-primary" />}
          </div>
          <div className="text-sm font-medium text-foreground">
            {title ?? defaultTitle}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {description ?? defaultDescription}
          </div>
        </>
      )}
    </div>
  );
}

export interface UploadFileListProps {
  className?: string;
  items?: UploadFileItem[];
  onRemove?: (id: string) => void;
  renderItem?: (item: UploadFileItem) => ReactNode;
}

export function UploadFileList({
  className,
  items: propItems,
  onRemove: propOnRemove,
  renderItem,
}: UploadFileListProps) {
  const context = useContext(UploadContext);
  const items = propItems ?? context?.items ?? [];
  const handleRemove =
    propOnRemove ?? (context ? context.removeItem : undefined);

  if (items.length === 0) {
    return null;
  }

  return (
    <ul
      data-slot="upload-file-list"
      className={cn("flex flex-col gap-2 mt-3", className)}
    >
      {items.map((item) =>
        renderItem ? (
          <li key={item.id}>{renderItem(item)}</li>
        ) : (
          <UploadItem
            key={item.id}
            item={item}
            onRemove={handleRemove ? () => handleRemove(item.id) : undefined}
          />
        ),
      )}
    </ul>
  );
}

export interface UploadItemProps {
  item: UploadFileItem;
  className?: string;
  onRemove?: () => void;
}

export function UploadItem({ item, className, onRemove }: UploadItemProps) {
  const context = useContext(UploadContext);
  const [imageFailed, setImageFailed] = useState(false);

  // Check if item is an image:
  // 1. Explicit MIME type starting with image/
  // 2. Data URL or Blob URL
  // 3. Known image extension in URL or name (stripping query parameters)
  // 4. Known image hosts (e.g. Unsplash, Cloudinary, Imgur)
  // 5. Or the parent Upload component accepts images
  const urlWithoutQuery = item.url.split("?")[0] || "";
  const nameWithoutQuery = item.name.split("?")[0] || "";
  const hasImageExtension = /\.(jpg|jpeg|png|webp|svg|gif|avif|bmp|ico)$/i.test(
    urlWithoutQuery || nameWithoutQuery,
  );
  const isImageCdn =
    /(images\.unsplash\.com|unsplash\.com|cloudinary\.com|imgur\.com|picsum\.photos)/i.test(
      item.url,
    );
  const isParentImageAccept =
    context?.normalizedAccept?.includes("image/") ||
    (Array.isArray(context?.accept) && context.accept.includes("image")) ||
    context?.accept === "image";

  const isImage =
    !imageFailed &&
    (item.type?.startsWith("image/") ||
      item.url.startsWith("data:image/") ||
      item.url.startsWith("blob:") ||
      hasImageExtension ||
      isImageCdn ||
      isParentImageAccept);

  return (
    <li
      data-slot="upload-item"
      className={cn(
        "flex items-center justify-between gap-3 p-2.5 rounded-md border border-border bg-card text-foreground transition-colors",
        item.error && "border-destructive/60 bg-destructive/5",
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {isImage && item.url ? (
          <div className="relative size-10 shrink-0 overflow-hidden rounded border border-border bg-muted/20">
            <img
              src={item.url}
              alt={item.name}
              className="size-full object-cover"
              onError={() => setImageFailed(true)}
            />
          </div>
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded border border-border bg-accent text-accent-foreground">
            <FileTextIcon className="size-5 text-muted-foreground" />
          </div>
        )}

        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium truncate text-foreground">
            {item.name}
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {item.size !== undefined && (
              <span>{formatFileSize(item.size)}</span>
            )}
            {item.error ? (
              <span className="text-destructive font-medium">{item.error}</span>
            ) : (
              item.url.startsWith("http") && (
                <span className="truncate max-w-50 opacity-75">{item.url}</span>
              )
            )}
          </div>
        </div>
      </div>

      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground shrink-0 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${item.name}`}
        >
          <CloseIcon className="size-4" />
        </Button>
      )}
    </li>
  );
}

export interface UploadProps {
  id?: string;
  className?: string;
  /** Array of uploaded items (controlled) */
  value?: UploadFileItem[];
  /** Default uploaded items (uncontrolled) */
  defaultValue?: UploadFileItem[];
  /** Callback fired when items list changes */
  onChange?: (items: UploadFileItem[]) => void;
  /** Optional custom handler when link is submitted */
  onLinkSubmit?: (url: string) => void;
  /** Callback fired when native files are accepted */
  onDropAccepted?: (files: File[]) => void;
  /** Callback fired when files are rejected (e.g. size/type validation) */
  onDropRejected?: (rejections: { file: File; error: string }[]) => void;
  /** Accepted file presets, extensions, or MIME types (string, preset name, or array) */
  accept?: UploadAccept;
  /** Maximum file size in bytes (e.g. 5 * 1024 * 1024 for 5MB) */
  maxSize?: number;
  /** Maximum number of files allowed */
  maxFiles?: number;
  /** Allow multiple files selection */
  multiple?: boolean;
  /** Disable the Upload and link input */
  disabled?: boolean;
  /** Whether to render the URL link input on top (default: true) */
  showLinkInput?: boolean;
  /** Placeholder for the top link input */
  linkInputPlaceholder?: string;
  /** Button text for the top link input */
  linkButtonText?: string;
  /** Whether to render the uploaded items list below (default: true) */
  showFileList?: boolean;
  /** Custom children to override default layout and use compound composition */
  children?: ReactNode;
}

function UploadRoot({
  id: propId,
  className,
  value,
  defaultValue = [],
  onChange,
  onLinkSubmit,
  onDropAccepted,
  onDropRejected,
  accept,
  maxSize,
  maxFiles,
  multiple = false,
  disabled = false,
  showLinkInput = true,
  linkInputPlaceholder,
  linkButtonText,
  showFileList = true,
  children,
}: UploadProps) {
  const generatedId = useId();
  const id = propId ?? generatedId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uncontrolledItems, setUncontrolledItems] =
    useState<UploadFileItem[]>(defaultValue);
  const [isDragging, setIsDragging] = useState(false);

  const isControlled = value !== undefined;
  const items = isControlled ? value : uncontrolledItems;
  const normalizedAccept = normalizeAccept(accept);

  const updateItems = (newItems: UploadFileItem[]) => {
    if (!isControlled) {
      setUncontrolledItems(newItems);
    }
    onChange?.(newItems);
  };

  const addItem = (item: UploadFileItem) => {
    const nextItems = multiple ? [...items, item] : [item];
    if (maxFiles && nextItems.length > maxFiles) {
      return;
    }
    updateItems(nextItems);
  };

  const removeItem = (itemId: string) => {
    const target = items.find((i) => i.id === itemId);
    if (target?.file && target.url.startsWith("blob:")) {
      URL.revokeObjectURL(target.url);
    }
    const nextItems = items.filter((i) => i.id !== itemId);
    updateItems(nextItems);
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const processFiles = (fileList: FileList | File[]) => {
    if (disabled) return;

    const rawFiles = Array.from(fileList);
    const filesToProcess = multiple
      ? maxFiles
        ? rawFiles.slice(0, maxFiles - items.length)
        : rawFiles
      : rawFiles.slice(0, 1);

    const accepted: File[] = [];
    const rejected: { file: File; error: string }[] = [];
    const newItems: UploadFileItem[] = [];

    for (const file of filesToProcess) {
      // Validate Max Size
      if (maxSize && file.size > maxSize) {
        rejected.push({
          file,
          error: `File size exceeds ${formatFileSize(maxSize)}`,
        });
        continue;
      }

      // Validate Accept Type
      if (normalizedAccept) {
        const acceptedTypes = normalizedAccept
          .split(",")
          .map((t) => t.trim().toLowerCase());
        const fileType = file.type.toLowerCase();
        const fileName = file.name.toLowerCase();

        const matches = acceptedTypes.some((type) => {
          if (type.endsWith("/*")) {
            const prefix = type.replace("/*", "");
            return fileType.startsWith(prefix);
          }
          if (type.startsWith(".")) {
            return fileName.endsWith(type);
          }
          return fileType === type;
        });

        if (!matches) {
          const displayAccept = Array.isArray(accept)
            ? accept.join(", ")
            : accept;
          rejected.push({
            file,
            error: `File type not supported (expected ${displayAccept})`,
          });
          continue;
        }
      }

      accepted.push(file);
      newItems.push({
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        file,
      });
    }

    if (rejected.length > 0) {
      onDropRejected?.(rejected);
    }

    if (accepted.length > 0) {
      onDropAccepted?.(accepted);
      const nextItems = multiple ? [...items, ...newItems] : newItems;
      updateItems(nextItems);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Verify target is outside current Upload boundary
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const contextValue: UploadContextValue = {
    items,
    addItem,
    removeItem,
    disabled,
    multiple,
    accept,
    normalizedAccept,
    maxSize,
    maxFiles,
    isDragging,
    openFileDialog,
    processFiles,
    onLinkSubmit,
  };

  return (
    <UploadContext.Provider value={contextValue}>
      <div
        id={id}
        data-slot="upload"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn("flex flex-col gap-3", className)}
      >
        {/* Hidden Native File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={normalizedAccept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleFileInputChange}
          className="hidden"
          tabIndex={-1}
        />

        {children ?? (
          <>
            <UploadArea />
            {showLinkInput && (
              <>
                <p>Or upload via</p>
                <UploadLinkInput
                  placeholder={linkInputPlaceholder}
                  buttonText={linkButtonText}
                />
              </>
            )}
            {showFileList && <UploadFileList />}
          </>
        )}
      </div>
    </UploadContext.Provider>
  );
}

export const Upload = Object.assign(UploadRoot, {
  Root: UploadRoot,
  LinkInput: UploadLinkInput,
  Area: UploadArea,
  FileList: UploadFileList,
  Item: UploadItem,
});

export const FileUpload = Upload;
export default Upload;
