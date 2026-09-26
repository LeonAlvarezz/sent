import { Checkbox as HeadlessCheckbox } from "@headlessui/react";
import type { CheckboxProps as HeadlessCheckboxProps } from "@headlessui/react";
import type { ReactNode } from "react";
import { CheckIcon } from "./icons";
import { cn } from "../../libs/cn";

export interface CheckboxProps extends Omit<HeadlessCheckboxProps, "children"> {
  label?: ReactNode;
  children?: ReactNode;
  containerClassName?: string;
}

export function Checkbox({
  checked,
  onChange,
  className,
  containerClassName,
  label,
  children,
  ...props
}: CheckboxProps) {
  const content = label ?? children;

  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 cursor-pointer select-none text-sm text-foreground",
        containerClassName,
      )}
    >
      <HeadlessCheckbox
        checked={checked}
        onChange={onChange}
        className={cn(
          "group size-4 flex items-center justify-center rounded border border-border bg-background transition-colors data-checked:bg-primary data-checked:border-primary focus:outline-none shrink-0",
          className,
        )}
        {...props}
      >
        <CheckIcon className="hidden size-3.5 text-primary-foreground group-data-checked:block" />
      </HeadlessCheckbox>
      {content && <span>{content}</span>}
    </label>
  );
}

export default Checkbox;
