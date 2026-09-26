import type { ReactNode } from "react";
import React from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "../../libs/cn";
import Button from "./button";
import Tag from "./tag";
import { ArrowLeftIcon, HomeIcon } from "./icons";

export interface NotFoundProps {
  /**
   * Main heading for the not found page.
   * @default "Page not found"
   */
  title?: string;
  /**
   * Description explaining the missing page or error.
   * @default "Sorry, we couldn't find the page you're looking for. It might have been moved or deleted."
   */
  description?: string;
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
   * Custom icon element to replace the graphic (legacy fallback).
   */
  icon?: ReactNode;
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

export function NotFound({
  title = "Page not found",
  description = "Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.",
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
}: NotFoundProps) {
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
        "relative flex flex-col items-center justify-center text-center select-none overflow-hidden",
        fullScreen
          ? "h-dvh w-full bg-background text-foreground"
          : "h-full flex-1 w-full min-h-0",
        className,
      )}
    >
      <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto px-4">
        <div className="flex gap-4 justify-center items-center">
          <div className="gap-4 flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2 font-sans">
              {title}
            </h1>
            {description && (
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions ?? (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
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

        {children && <div className="mt-8 w-full">{children}</div>}
      </div>
    </div>
  );
}

export default NotFound;
