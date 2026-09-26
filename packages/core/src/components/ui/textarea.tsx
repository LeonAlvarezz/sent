import { Textarea as HeadlessTextarea } from "@headlessui/react";
import type { TextareaProps as HeadlessTextareaProps } from "@headlessui/react";
import type { ChangeEvent, ReactNode } from "react";
import { useCallback, useId, useState } from "react";
import { cn } from "../../libs/cn";
import { countWords, trimToWordCount } from "../../utils/string";

export interface TextareaProps extends HeadlessTextareaProps<"textarea"> {
  /** Maximum number of words allowed */
  maxWordCount?: number;
  /** Whether to show the word count indicator (defaults to true if maxWordCount is set) */
  showWordCount?: boolean;
  /** Whether to strictly enforce and block typing/pasting beyond maxWordCount (defaults to false) */
  enforceMaxWordCount?: boolean;
  /** Custom formatter for the word count indicator */
  formatWordCount?: (count: number, max?: number) => ReactNode;
  /** Container outer wrapper class names */
  containerClassName?: string;
  /** Indicates invalid/error state */
  invalid?: boolean;
  /** Accessible description identifier */
  "aria-describedby"?: string;
}

export function Textarea({
  className,
  containerClassName,
  maxWordCount,
  showWordCount,
  enforceMaxWordCount = false,
  formatWordCount,
  invalid = false,
  placeholder = "Type here...",
  rows = 3,
  value,
  defaultValue,
  onChange,
  disabled,
  id: propId,
  "aria-describedby": ariaDescribedBy,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const id = propId ?? generatedId;
  const wordCountId = `${id}-word-count`;

  const isControlled = value !== undefined;
  const initialValue = (value ?? defaultValue ?? "") as string;
  const [uncontrolledValue, setUncontrolledValue] = useState<string>(
    String(initialValue),
  );

  const currentValue = isControlled ? String(value) : uncontrolledValue;
  const wordCount = countWords(currentValue);
  const isOverLimit = maxWordCount !== undefined && wordCount > maxWordCount;
  const shouldShowCounter =
    showWordCount !== undefined ? showWordCount : maxWordCount !== undefined;

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      let nextValue = e.target.value;

      if (enforceMaxWordCount && maxWordCount !== undefined) {
        const nextWordCount = countWords(nextValue);
        if (nextWordCount > maxWordCount) {
          nextValue = trimToWordCount(nextValue, maxWordCount);
          e.target.value = nextValue;
        }
      }

      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }

      onChange?.(e);
    },
    [enforceMaxWordCount, maxWordCount, isControlled, onChange],
  );

  const isInvalid = invalid || isOverLimit;

  const combinedDescribedBy =
    [ariaDescribedBy, shouldShowCounter ? wordCountId : undefined]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div
      data-slot="textarea-container"
      data-invalid={isInvalid ? "true" : undefined}
      data-over-limit={isOverLimit ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      className={cn(
        "group/textarea flex flex-col rounded-md border border-border bg-transparent p-2.5 text-foreground transition-all input-focus",
        isInvalid &&
          "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
        disabled && "opacity-50 cursor-not-allowed bg-muted/20",
        containerClassName,
      )}
    >
      <HeadlessTextarea
        id={id}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        aria-invalid={isInvalid ? true : undefined}
        aria-describedby={combinedDescribedBy}
        className={cn(
          "w-full resize-y bg-transparent text-sm text-foreground placeholder:text-foreground/40 outline-none border-0 p-0 focus:outline-none focus:ring-0 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      />

      {shouldShowCounter && (
        <div
          id={wordCountId}
          aria-live="polite"
          data-slot="word-count"
          data-over-limit={isOverLimit ? "true" : undefined}
          className={cn(
            "mt-1.5 flex items-center justify-end text-xs tabular-nums text-foreground/50 transition-colors select-none",
            isOverLimit && "text-destructive font-medium",
          )}
        >
          {formatWordCount
            ? formatWordCount(wordCount, maxWordCount)
            : maxWordCount !== undefined
              ? `${wordCount} / ${maxWordCount} words`
              : `${wordCount} ${wordCount === 1 ? "word" : "words"}`}
        </div>
      )}
    </div>
  );
}

export default Textarea;
