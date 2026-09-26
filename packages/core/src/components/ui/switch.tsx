import React from "react";
import { Switch as HeadlessSwitch } from "@headlessui/react";
import type { SwitchProps as HeadlessSwitchProps } from "@headlessui/react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

export type SwitchSize = "sm" | "md" | "lg";

const trackVariants = cva(
  "group inline-flex items-center shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary bg-input",
  {
    variants: {
      size: {
        sm: "h-5 w-9 p-0.5",
        md: "h-6 w-11 p-0.5",
        lg: "h-7 w-14 p-1",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const thumbVariants = cva(
  "pointer-events-none block rounded-full bg-background shadow-md ring-0 transition-transform duration-200 ease-in-out translate-x-0",
  {
    variants: {
      size: {
        sm: "size-4 data-[checked]:translate-x-4",
        md: "size-5 data-[checked]:translate-x-5",
        lg: "size-5 data-[checked]:translate-x-7",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export interface SwitchProps
  extends Omit<HeadlessSwitchProps<"button">, "className" | "children">,
    VariantProps<typeof trackVariants> {
  className?: string;
  thumbClassName?: string;
}

export function Switch({
  size = "md",
  className,
  thumbClassName,
  ...props
}: SwitchProps) {
  return (
    <HeadlessSwitch
      className={cn(trackVariants({ size }), className)}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(thumbVariants({ size }), thumbClassName)}
      />
    </HeadlessSwitch>
  );
}

export default Switch;
