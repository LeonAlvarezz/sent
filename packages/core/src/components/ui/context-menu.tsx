import type { ReactNode } from "react";
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../libs/cn";
import Button from "./button";

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ContextMenuProps {
  open: boolean;
  onClose: () => void;
  position?: ContextMenuPosition;
  className?: string;
  children: ReactNode;
}

export interface ContextMenuItemProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick"
> {
  variant?: "default" | "destructive";
  icon?: ReactNode;
  shortcut?: ReactNode;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export interface ContextMenuSeparatorProps {
  className?: string;
}

export interface ContextMenuLabelProps {
  className?: string;
  children: ReactNode;
}

export const ContextMenuItem: React.FC<ContextMenuItemProps> = ({
  variant = "default",
  icon,
  shortcut,
  children,
  className,
  onClick,
  disabled = false,
  ...props
}) => {
  return (
    <Button
      variant="ghost"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full text-left px-2.5 py-1.5 text-xs rounded-sm flex items-center justify-between cursor-pointer transition-colors select-none",
        variant === "destructive"
          ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
          : "text-foreground hover:bg-accent hover:text-accent-foreground",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className,
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {shortcut && (
          <span className="text-[10px] text-muted-foreground font-mono">
            {shortcut}
          </span>
        )}
        {icon && (
          <span
            className={cn(
              "size-3 flex items-center justify-center shrink-0",
              variant === "destructive"
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {icon}
          </span>
        )}
      </div>
    </Button>
  );
};

export const ContextMenuSeparator: React.FC<ContextMenuSeparatorProps> = ({
  className,
}) => {
  return <hr className={cn("my-1 border-border/80", className)} />;
};

export const ContextMenuLabel: React.FC<ContextMenuLabelProps> = ({
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        "px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground select-none",
        className,
      )}
    >
      {children}
    </div>
  );
};

// ----------------------------------------------------------------------
// Main ContextMenu Root
// ----------------------------------------------------------------------
export interface ContextMenuComponent extends React.FC<ContextMenuProps> {
  Item: typeof ContextMenuItem;
  Separator: typeof ContextMenuSeparator;
  Label: typeof ContextMenuLabel;
}

export const ContextMenu: ContextMenuComponent = ({
  open,
  onClose,
  position,
  className,
  children,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleDismiss = () => {
      onClose();
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const menuWidth = 190;
  const menuHeight = 200;

  const style: React.CSSProperties = position
    ? {
        top:
          typeof window !== "undefined"
            ? Math.max(
                8,
                Math.min(position.y, window.innerHeight - menuHeight - 8),
              )
            : position.y,
        left:
          typeof window !== "undefined"
            ? Math.max(
                8,
                Math.min(position.x, window.innerWidth - menuWidth - 8),
              )
            : position.x,
      }
    : {};

  return createPortal(
    <div
      ref={menuRef}
      style={style}
      className={cn(
        "fixed z-50 min-w-44 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in zoom-in-95 duration-100",
        className,
      )}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </div>,
    document.body,
  );
};

ContextMenu.Item = ContextMenuItem;
ContextMenu.Separator = ContextMenuSeparator;
ContextMenu.Label = ContextMenuLabel;

export default ContextMenu;
