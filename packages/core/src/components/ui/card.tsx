import React, { forwardRef } from "react";
import type {
  ComponentPropsWithRef,
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode,
} from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

export const cardVariants = cva(
  "rounded-xl border border-border text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-card shadow-xs",
        outline: "bg-transparent shadow-none",
        ghost: "border-transparent bg-transparent shadow-none",
        elevated: "bg-card shadow-md",
        muted: "bg-muted/40 shadow-xs",
      },
      padding: {
        none: "p-0",
        sm: "p-4 sm:p-5",
        md: "p-5 sm:p-6",
        lg: "p-6 sm:p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "none",
    },
  },
);

export type CardVariant =
  "default" | "outline" | "ghost" | "elevated" | "muted";
export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardTitleProps extends ComponentPropsWithoutRef<"h3"> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div";
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = "h3", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn("text-base font-semibold text-foreground", className)}
        {...props}
      />
    );
  },
);
CardTitle.displayName = "CardTitle";

export interface CardDescriptionProps extends ComponentPropsWithoutRef<"p"> {}

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-xs sm:text-sm text-muted-foreground mt-1", className)}
      {...props}
    />
  );
});
CardDescription.displayName = "CardDescription";

export interface CardActionProps extends ComponentPropsWithoutRef<"div"> {}

export const CardAction = forwardRef<HTMLDivElement, CardActionProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2 shrink-0 ml-auto", className)}
        {...props}
      />
    );
  },
);
CardAction.displayName = "CardAction";

export interface CardHeaderProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "title"
> {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, action, children, ...props }, ref) => {
    const hasConvenienceContent =
      title !== undefined || description !== undefined || action !== undefined;

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start justify-between gap-4 p-5 sm:p-6 pb-2 sm:pb-3",
          className,
        )}
        {...props}
      >
        {children ? (
          children
        ) : hasConvenienceContent ? (
          <>
            <div className="space-y-1.5 min-w-0 flex-1">
              {title &&
                (typeof title === "string" ? (
                  <CardTitle>{title}</CardTitle>
                ) : (
                  title
                ))}
              {description &&
                (typeof description === "string" ? (
                  <CardDescription>{description}</CardDescription>
                ) : (
                  description
                ))}
            </div>
            {action && <CardAction>{action}</CardAction>}
          </>
        ) : null}
      </div>
    );
  },
);
CardHeader.displayName = "CardHeader";

export interface CardContentProps extends ComponentPropsWithoutRef<"div"> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("p-5 sm:p-6 pt-0 sm:pt-0", className)}
        {...props}
      />
    );
  },
);
CardContent.displayName = "CardContent";

export const CardBody = CardContent;

export interface CardFooterProps extends ComponentPropsWithoutRef<"div"> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 p-5 sm:p-6 pt-0 sm:pt-0",
          className,
        )}
        {...props}
      />
    );
  },
);
CardFooter.displayName = "CardFooter";

interface CardOwnProps extends VariantProps<typeof cardVariants> {
  className?: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}

export type CardProps<T extends ElementType = "div"> = CardOwnProps & {
  as?: T;
} & Omit<ComponentPropsWithRef<T>, keyof CardOwnProps | "as">;

const CardRootComponent = <T extends ElementType = "div">({
  as,
  className,
  variant,
  padding,
  title,
  description,
  action,
  children,
  ...props
}: CardProps<T>) => {
  const Component: ElementType = as ?? "div";
  const hasHeaderProps =
    title !== undefined || description !== undefined || action !== undefined;

  return (
    <Component
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    >
      {hasHeaderProps && (
        <CardHeader title={title} description={description} action={action} />
      )}
      {children}
    </Component>
  );
};

export const CardRoot = Object.assign(CardRootComponent, {
  displayName: "Card",
});

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Action: CardAction,
  Content: CardContent,
  Body: CardBody,
  Footer: CardFooter,
});

export default Card;
