import React, { useState, useRef } from "react";
import type { ReactNode, TouchEvent } from "react";
import { Dialog, DialogBackdrop, DialogPanel, Transition } from "@headlessui/react";
import { cn } from "../../libs/cn";
import Button from "./button";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: "bottom" | "left" | "right" | "top";
  showDragHandle?: boolean;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Drawer({
  open,
  onClose,
  side = "bottom",
  showDragHandle = true,
  title,
  children,
  className,
}: DrawerProps) {
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (side !== "bottom") return;
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging || side !== "bottom") return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      setOffsetY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || side !== "bottom") return;
    setIsDragging(false);
    if (offsetY > 100) {
      onClose();
      setOffsetY(0);
    } else {
      setOffsetY(0);
    }
  };

  const positionClasses = {
    bottom:
      "bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl border-t border-border data-closed:translate-y-full",
    left: "top-0 bottom-0 left-0 w-80 rounded-r-3xl border-r border-border data-closed:-translate-x-full",
    right:
      "top-0 bottom-0 right-0 w-80 rounded-l-3xl border-l border-border data-closed:translate-x-full",
    top: "top-0 left-0 right-0 max-h-[85vh] rounded-b-3xl border-b border-border data-closed:-translate-y-full",
  };

  return (
    <Transition appear show={open}>
      <Dialog onClose={onClose} className="relative z-50">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition duration-200 ease-out data-closed:opacity-0"
        />

        <div className="fixed inset-0 flex overflow-hidden">
          <DialogPanel
            transition
            style={
              side === "bottom" && offsetY > 0
                ? {
                    transform: `translateY(${offsetY}px)`,
                    opacity: Math.max(0.3, 1 - offsetY / 300),
                    transition: isDragging
                      ? "none"
                      : "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  }
                : undefined
            }
            className={cn(
              "fixed bg-card p-4 shadow-2xl transition duration-300 ease-out flex flex-col focus:outline-none",
              positionClasses[side],
              className,
            )}
          >
            {/* Swipe-to-close Touch Target (Top Nudge Bar & Header) */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="w-full flex flex-col items-center cursor-grab active:cursor-grabbing select-none shrink-0 py-1 touch-none"
            >
              {side === "bottom" && showDragHandle && (
                <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-2 shrink-0 hover:bg-muted-foreground/40 transition-colors" />
              )}

              {title && (
                <div className="w-full flex items-center justify-between pb-3 border-b border-border shrink-0">
                  <span className="font-bold text-sm text-foreground">
                    {title}
                  </span>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={onClose}
                    className="text-xs font-semibold text-primary cursor-pointer hover:underline"
                  >
                    Done
                  </Button>
                </div>
              )}
            </div>

            {children}
          </DialogPanel>
        </div>
      </Dialog>
    </Transition>
  );
}

export default Drawer;
