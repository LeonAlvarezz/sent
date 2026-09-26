import { Select as HeadlessSelect } from "@headlessui/react";
import type { SelectProps as HeadlessSelectProps } from "@headlessui/react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "../../libs/cn";
import { ChevronDownIcon as DefaultChevronIcon } from "./icons";

export interface NativeSelectOption {
  label: ReactNode;
  value: string | number;
  disabled?: boolean;
}

export interface NativeSelectProps extends HeadlessSelectProps<"select"> {
  /** Leading icon displayed inside the select box on the left */
  startIcon?: ReactNode;
  /** Trailing icon displayed on the right (defaults to ChevronDown) */
  endIcon?: ReactNode;
  /** Container outer wrapper class names */
  containerClassName?: string;
  /** Options array to render automatically */
  options?: Array<NativeSelectOption | string | number>;
  /** Placeholder text shown when no value is selected */
  placeholder?: string;
  /** Size variant of the select input */
  sizeVariant?: "sm" | "md" | "lg";
  /** Indicates invalid/error state */
  invalid?: boolean;
}

function NativeSelectRoot({
  className,
  containerClassName,
  startIcon,
  endIcon,
  options,
  placeholder,
  sizeVariant = "md",
  invalid = false,
  disabled,
  children,
  ...props
}: NativeSelectProps) {
  const sizeClasses = {
    sm: "h-8 py-1 text-xs",
    md: "h-9 py-1.5 text-sm",
    lg: "h-10 py-2 text-base",
  };

  const iconSizeClasses = {
    sm: "size-3.5",
    md: "size-4",
    lg: "size-4.5",
  };

  return (
    <div
      className={cn(
        "relative flex items-center gap-2 rounded-md border border-border px-3 text-foreground transition-all input-focus",
        invalid &&
          "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
        disabled && "opacity-50 cursor-not-allowed",
        sizeClasses[sizeVariant],
        containerClassName,
      )}
    >
      {startIcon && (
        <span className="flex items-center text-foreground/50 shrink-0 pointer-events-none">
          {startIcon}
        </span>
      )}

      <HeadlessSelect
        disabled={disabled}
        className={cn(
          "w-full bg-transparent text-foreground placeholder:text-foreground/40 outline-none border-0 p-0 pr-5 focus:outline-none focus:ring-0 appearance-none cursor-pointer disabled:cursor-not-allowed",
          "[&>option]:bg-popover [&>option]:text-popover-foreground [&>optgroup]:bg-popover [&>optgroup]:text-popover-foreground",
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}

        {options
          ? options.map((opt) => {
              if (typeof opt === "object") {
                return (
                  <option
                    key={String(opt.value)}
                    value={opt.value}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </option>
                );
              }
              return (
                <option key={String(opt)} value={opt}>
                  {opt}
                </option>
              );
            })
          : typeof children === "function"
            ? null
            : children}
      </HeadlessSelect>

      <span className="absolute right-3 flex items-center text-foreground/50 shrink-0 pointer-events-none">
        {endIcon ?? (
          <DefaultChevronIcon
            className={cn("shrink-0", iconSizeClasses[sizeVariant])}
          />
        )}
      </span>
    </div>
  );
}

function NativeSelectOptionItem({
  className,
  ...props
}: ComponentPropsWithoutRef<"option">) {
  return (
    <option
      className={cn("bg-popover text-popover-foreground py-1", className)}
      {...props}
    />
  );
}

function NativeSelectOptGroup({
  className,
  ...props
}: ComponentPropsWithoutRef<"optgroup">) {
  return (
    <optgroup
      className={cn(
        "bg-popover text-popover-foreground font-semibold",
        className,
      )}
      {...props}
    />
  );
}

export const NativeSelect = Object.assign(NativeSelectRoot, {
  Option: NativeSelectOptionItem,
  OptGroup: NativeSelectOptGroup,
});

export default NativeSelect;
