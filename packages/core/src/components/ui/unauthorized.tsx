import type { ReactNode } from "react";
import React from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "../../libs/cn";
import Button from "./button";
import { ArrowLeftIcon, HomeIcon, ShieldIcon } from "./icons";

export interface UnauthorizedProps {
  /**
   * Main heading for the unauthorized / access restricted page.
   * @default "Access Restricted"
   */
  title?: string;
  /**
   * Description explaining why access was restricted.
   * @default "You do not have administrator permissions to view or access this page. Please contact a system administrator or return to the dashboard."
   */
  description?: string;
  /**
   * Optional custom icon to replace the default shield icon.
   */
  icon?: ReactNode;
  /**
   * Whether to display the "Go Back" button.
   * @default true
   */
  showBackButton?: boolean;
  /**
   * Text for the back button.
   * @default "Go Back"
   */
  backButtonText?: string;
  /**
   * Callback invoked when the back button is clicked.
   * Defaults to `window.history.back()`.
   */
  onBack?: () => void;
  /**
   * Whether to display the home / dashboard button.
   * @default true
   */
  showHomeButton?: boolean;
  /**
   * Text for the home button.
   * @default "Back to Dashboard"
   */
  homeButtonText?: string;
  /**
   * Target path for the home button link when `onHome` is not provided.
   * @default "/"
   */
  homeHref?: string;
  /**
   * Optional custom click callback for the home button.
   */
  onHome?: () => void;
  /**
   * When true, takes up the full screen (viewport height and width).
   * When false, renders in embedded container mode (ideal for AdminLayout).
   * @default false
   */
  fullScreen?: boolean;
  /**
   * Optional custom action buttons slot (overrides default back & home buttons).
   */
  actions?: ReactNode;
  /**
   * Optional additional content rendered below the actions.
   */
  children?: ReactNode;
  /**
   * Additional container CSS classes.
   */
  className?: string;
}

export function Unauthorized({
  title = "Access Restricted",
  description = "You do not have administrator permissions to view or access this page. Please contact a system administrator or return to the dashboard.",
  icon,
  showBackButton = true,
  backButtonText = "Go Back",
  onBack,
  showHomeButton = true,
  homeButtonText = "Back to Dashboard",
  homeHref = "/",
  onHome,
  fullScreen = false,
  actions,
  children,
  className,
}: UnauthorizedProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center text-center select-none overflow-hidden p-6",
        fullScreen
          ? "h-dvh w-full bg-background text-foreground"
          : "h-full flex-1 w-full min-h-[360px]",
        className,
      )}
    >
      <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto">
        <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          {icon ?? <ShieldIcon className="size-6" />}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2 font-sans">
          {title}
        </h1>

        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md">
            {description}
          </p>
        )}

        {actions ?? (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            {showBackButton && (
              <Button
                variant="outline"
                size="md"
                onClick={handleBack}
                className="gap-2 cursor-pointer"
              >
                <ArrowLeftIcon className="size-4" />
                <span>{backButtonText}</span>
              </Button>
            )}

            {showHomeButton &&
              (onHome ? (
                <Button
                  variant="default"
                  size="md"
                  onClick={onHome}
                  className="gap-2 cursor-pointer"
                >
                  <HomeIcon className="size-4" />
                  <span>{homeButtonText}</span>
                </Button>
              ) : (
                <Link to={homeHref}>
                  <Button
                    variant="default"
                    size="md"
                    className="gap-2 cursor-pointer"
                  >
                    <HomeIcon className="size-4" />
                    <span>{homeButtonText}</span>
                  </Button>
                </Link>
              ))}
          </div>
        )}

        {children && <div className="mt-6 w-full">{children}</div>}
      </div>
    </div>
  );
}

export default Unauthorized;
