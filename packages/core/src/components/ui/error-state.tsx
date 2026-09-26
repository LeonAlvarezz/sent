import type { ReactNode } from "react";
import React, { useState } from "react";
import { cn } from "../../libs/cn";
import Button from "./button";
import { HomeIcon, RefreshIcon } from "./icons";

export interface ErrorStateProps {
  /**
   * Main heading for the error page.
   * @default "Something went wrong"
   */
  title?: string;
  /**
   * Description explaining the error.
   * @default "An unexpected error occurred while loading this page. Please try again or return to the dashboard."
   */
  description?: string;
  /**
   * Optional error object or message to display in expandable details.
   */
  error?: unknown;
  /**
   * Whether to display the "Try Again" button.
   * @default true
   */
  showRetryButton?: boolean;
  /**
   * Text for the retry button.
   * @default "Try Again"
   */
  retryButtonText?: string;
  /**
   * Callback invoked when the retry button is clicked.
   */
  onRetry?: () => void;
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
   * @default false
   */
  fullScreen?: boolean;
  /**
   * Optional custom action buttons slot (overrides default retry & home buttons).
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

export function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred while loading this page. Please try again or return to the dashboard.",
  error,
  showRetryButton = true,
  retryButtonText = "Try Again",
  onRetry,
  showHomeButton = true,
  homeButtonText = "Back to Dashboard",
  homeHref = "/",
  onHome,
  fullScreen = false,
  actions,
  children,
  className,
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = useState(false);

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : error && typeof error === "object"
          ? JSON.stringify(error, null, 2)
          : null;

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
          <span className="text-xl font-bold">!</span>
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
            {showRetryButton && onRetry && (
              <Button
                variant="outline"
                size="md"
                onClick={onRetry}
                className="gap-2 cursor-pointer"
              >
                <RefreshIcon className="size-4" />
                <span>{retryButtonText}</span>
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
                <a href={homeHref}>
                  <Button
                    variant="default"
                    size="md"
                    className="gap-2 cursor-pointer"
                  >
                    <HomeIcon className="size-4" />
                    <span>{homeButtonText}</span>
                  </Button>
                </a>
              ))}
          </div>
        )}

        {errorMessage && (
          <div className="w-full mt-6 text-left">
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="text-xs text-muted-foreground hover:text-foreground underline transition-colors cursor-pointer"
            >
              {showDetails
                ? "Hide technical details"
                : "Show technical details"}
            </button>

            {showDetails && (
              <pre className="mt-2 p-3 text-[11px] font-mono text-destructive bg-destructive/5 rounded-md border border-destructive/20 overflow-x-auto max-h-48 whitespace-pre-wrap select-text">
                {errorMessage}
              </pre>
            )}
          </div>
        )}

        {children && <div className="mt-6 w-full">{children}</div>}
      </div>
    </div>
  );
}

export default ErrorState;
