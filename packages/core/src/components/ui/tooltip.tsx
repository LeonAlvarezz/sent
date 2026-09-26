import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../../libs/cn";

type OverflowElement = Pick<HTMLElement, "clientWidth" | "scrollWidth">;

export function isElementOverflowing(element: OverflowElement) {
  return element.scrollWidth > element.clientWidth;
}

export interface TooltipProps extends Omit<
  React.ComponentPropsWithoutRef<"span">,
  "content"
> {
  content: React.ReactNode;
  disabled?: boolean;
  showWhenTruncated?: boolean;
  delay?: number;
  tooltipClassName?: string;
}

type TooltipPosition = {
  left: number;
  top: number;
  side: "top" | "bottom";
};

export function Tooltip({
  children,
  content,
  disabled = false,
  showWhenTruncated = false,
  delay = 250,
  className,
  tooltipClassName,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  tabIndex,
  ...props
}: TooltipProps) {
  const tooltipId = React.useId();
  const triggerRef = React.useRef<HTMLSpanElement>(null);
  const openTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isTruncated, setIsTruncated] = React.useState(!showWhenTruncated);
  const [position, setPosition] = React.useState<TooltipPosition | null>(null);

  const clearOpenTimer = React.useCallback(() => {
    if (openTimerRef.current == null) return;
    clearTimeout(openTimerRef.current);
    openTimerRef.current = null;
  }, []);

  const measureOverflow = React.useCallback(() => {
    const trigger = triggerRef.current;
    const overflowing = trigger ? isElementOverflowing(trigger) : false;
    setIsTruncated(overflowing);
    return overflowing;
  }, []);

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const side = rect.top < 56 ? "bottom" : "top";
    setPosition({
      left: rect.left + rect.width / 2,
      top: side === "top" ? rect.top : rect.bottom,
      side,
    });
  }, []);

  const canOpen = React.useCallback(() => {
    if (disabled || content == null) return false;
    return !showWhenTruncated || measureOverflow();
  }, [content, disabled, measureOverflow, showWhenTruncated]);

  const openTooltip = React.useCallback(() => {
    if (!canOpen()) return;
    updatePosition();
    setIsOpen(true);
  }, [canOpen, updatePosition]);

  React.useLayoutEffect(() => {
    if (!showWhenTruncated) return;

    measureOverflow();
    const trigger = triggerRef.current;
    if (!trigger || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measureOverflow);
    observer.observe(trigger);
    return () => observer.disconnect();
  }, [children, measureOverflow, showWhenTruncated]);

  React.useEffect(() => clearOpenTimer, [clearOpenTimer]);

  React.useEffect(() => {
    if (!isOpen) return;

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  const handleMouseEnter = (event: React.MouseEvent<HTMLSpanElement>) => {
    onMouseEnter?.(event);
    if (event.defaultPrevented || !canOpen()) return;

    clearOpenTimer();
    openTimerRef.current = setTimeout(openTooltip, delay);
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLSpanElement>) => {
    onMouseLeave?.(event);
    clearOpenTimer();
    setIsOpen(false);
  };

  const handleFocus = (event: React.FocusEvent<HTMLSpanElement>) => {
    onFocus?.(event);
    if (event.defaultPrevented) return;
    openTooltip();
  };

  const handleBlur = (event: React.FocusEvent<HTMLSpanElement>) => {
    onBlur?.(event);
    clearOpenTimer();
    setIsOpen(false);
  };

  const isAvailable =
    !disabled && content != null && (!showWhenTruncated || isTruncated);

  return (
    <>
      <span
        {...props}
        ref={triggerRef}
        data-slot="tooltip-trigger"
        data-tooltip-overflow={showWhenTruncated ? "true" : undefined}
        className={cn(className)}
        tabIndex={tabIndex ?? (isAvailable ? 0 : undefined)}
        aria-describedby={isOpen ? tooltipId : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {children}
      </span>

      {isOpen && position && typeof document !== "undefined"
        ? createPortal(
            <span
              id={tooltipId}
              role="tooltip"
              data-slot="tooltip-content"
              data-side={position.side}
              className={cn(
                "pointer-events-none fixed z-50 max-w-sm rounded-lg border border-border bg-popover px-3 py-2 text-xs font-medium leading-relaxed whitespace-normal text-popover-foreground shadow-xl",
                tooltipClassName,
              )}
              style={{
                left: position.left,
                top: position.top,
                transform:
                  position.side === "top"
                    ? "translate(-50%, calc(-100% - 8px))"
                    : "translate(-50%, 8px)",
              }}
            >
              {content}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute size-2 rotate-45 bg-popover",
                  position.side === "top"
                    ? "-bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-border"
                    : "-top-1 left-1/2 -translate-x-1/2 border-t border-l border-border",
                )}
              />
            </span>,
            document.body,
          )
        : null}
    </>
  );
}

export default Tooltip;
