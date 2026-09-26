import { Button as HeadlessButton } from "@headlessui/react";
import type { ButtonProps as HeadlessButtonProps } from "@headlessui/react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

export type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "ghost"
  | "secondary"
  | "barebone";
export type ButtonSize = "icon" | "sm" | "base" | "md" | "lg" | "xl";

export type ButtonProps = HeadlessButtonProps<"button"> &
  VariantProps<typeof buttonVariants>;

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-foreground cursor-pointer data-active:translate-y-px transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground data-hover:opacity-90",
        destructive:
          "bg-destructive text-destructive-foreground data-hover:opacity-90",
        outline: "border data-hover:border-primary data-hover:text-primary",
        ghost: "data-hover:bg-muted/30 data-hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground data-hover:bg-accent data-hover:text-accent-foreground",
        barebone: "bg-transparent text-inherit data-active:translate-y-0",
      },
      size: {
        icon: "size-5 p-0 text-xs",
        sm: "px-2.5 py-1 text-xs",
        base: "px-3 py-1.5 text-sm",
        md: "px-3.5 py-2 text-sm",
        lg: "px-4 py-2.5 text-base",
        xl: "px-5 py-3 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "base",
    },
  },
);

function Button({ variant, className, size, ...props }: ButtonProps) {
  return (
    <HeadlessButton
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
export default Button;
