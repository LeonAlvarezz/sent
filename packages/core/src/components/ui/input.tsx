import { Input as HeadlessInput } from "@headlessui/react";
import type { InputProps as HeadlessInputProps } from "@headlessui/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "../../libs/cn";

import { EyeIcon, EyeOffIcon as EyeClosedIcon } from "./icons";

export interface InputProps extends HeadlessInputProps<"input"> {
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  containerClassName?: string;
}

function InputRoot({
  className,
  containerClassName,
  startIcon,
  endIcon,
  placeholder = "Type here...",
  ...props
}: InputProps) {
  return (
    <div
      className={cn(
        "flex h-9 items-center gap-2 rounded-md border border-border px-3 py-1.5 text-foreground transition-all input-focus",
        containerClassName,
      )}
    >
      {startIcon && (
        <span className="flex items-center text-foreground/50 shrink-0">
          {startIcon}
        </span>
      )}
      <HeadlessInput
        className={cn(
          "w-full bg-transparent text-sm text-foreground placeholder:text-foreground/40 outline-none border-0 p-0 focus:outline-none focus:ring-0",
          className,
        )}
        placeholder={placeholder}
        {...props}
      />
      {endIcon && (
        <span className="flex items-center text-foreground/50 shrink-0">
          {endIcon}
        </span>
      )}
    </div>
  );
}

export interface InputPasswordProps extends Omit<InputProps, "type"> {}

export function InputPassword({
  placeholder = "Enter password...",
  endIcon,
  ...props
}: InputPasswordProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <InputRoot
      type={isVisible ? "text" : "password"}
      placeholder={placeholder}
      endIcon={
        <div className="flex items-center gap-1.5">
          {endIcon}
          <button
            type="button"
            onClick={() => setIsVisible((prev) => !prev)}
            className="flex items-center text-foreground/50 hover:text-foreground cursor-pointer focus:outline-none transition-colors"
            tabIndex={-1}
            aria-label={isVisible ? "Hide password" : "Show password"}
          >
            {isVisible ? (
              <EyeClosedIcon className="size-4 shrink-0" />
            ) : (
              <EyeIcon className="size-4 shrink-0" />
            )}
          </button>
        </div>
      }
      {...props}
    />
  );
}

export const Input = Object.assign(InputRoot, {
  Password: InputPassword,
});

export default Input;
