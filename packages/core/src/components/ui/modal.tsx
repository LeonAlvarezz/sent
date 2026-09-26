import React, { useEffect, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Transition,
} from "@headlessui/react";
import { cn } from "../../utils/cn";
import { CloseIcon, MaximizeIcon, MinimizeIcon } from "./icons";
import Button from "./button";

export interface ModalProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  open?: boolean;
  onClose?: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  showCloseButton?: boolean;
  showFullscreen?: boolean;
  isFullscreen?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export interface ModalHeaderProps extends ComponentPropsWithoutRef<"div"> {}
export interface ModalBodyProps extends ComponentPropsWithoutRef<"div"> {}
export interface ModalFooterProps extends ComponentPropsWithoutRef<"div"> {}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  full: "w-full max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-4rem)] h-[calc(100vh-2rem)] sm:h-[calc(100vh-4rem)] max-h-none flex flex-col my-0",
};

export function ModalHeader({ className, ...props }: ModalHeaderProps) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 pt-6 text-left", className)}
      {...props}
    />
  );
}

export function ModalTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DialogTitle>) {
  return (
    <DialogTitle
      className={cn(
        "text-lg sm:text-xl font-bold tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function ModalDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Description>) {
  return (
    <Description
      className={cn("text-xs mt-2 text-muted-foreground", className)}
      {...props}
    />
  );
}

export function ModalBody({ className, ...props }: ModalBodyProps) {
  return <div className={cn("py-2", className)} {...props} />;
}

export function ModalFooter({ className, ...props }: ModalFooterProps) {
  return (
    <div
      className={cn("flex sm:items-center justify-end gap-3 pt-4", className)}
      {...props}
    />
  );
}

function ModalRoot({
  isOpen,
  setIsOpen,
  open,
  onClose,
  title,
  description,
  children,
  className,
  size = "lg",
  showCloseButton = true,
  showFullscreen,
  isFullscreen: controlledIsFullscreen,
  onFullscreenChange,
}: ModalProps) {
  const isModalOpen = open ?? isOpen ?? false;
  const [internalIsFullscreen, setInternalIsFullscreen] = useState(false);
  const isFullscreen = controlledIsFullscreen ?? internalIsFullscreen;
  const shouldShowFullscreen = showFullscreen ?? false;

  const handleToggleFullscreen = () => {
    const next = !isFullscreen;
    if (controlledIsFullscreen === undefined) {
      setInternalIsFullscreen(next);
    }
    onFullscreenChange?.(next);
  };

  const handleClose = () => {
    if (onClose) onClose();
    if (setIsOpen) setIsOpen(false);
  };

  return (
    <Transition appear show={isModalOpen}>
      <Dialog onClose={handleClose} className="relative z-50">
        {/* Backdrop with fade transition */}
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200 ease-out data-closed:opacity-0"
        />

        {/* Centered modal container */}
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6">
          <div className="flex min-h-full items-center justify-center">
            <DialogPanel
              transition
              className={cn(
                "relative w-full space-y-4 border border-border bg-popover rounded-xl text-foreground p-6 sm:p-8 shadow-2xl transition-all duration-200 ease-in-out data-closed:scale-95 data-closed:opacity-0 focus:outline-none my-auto",
                sizeClasses[isFullscreen ? "full" : size],
                className,
              )}
            >
              {(showCloseButton || shouldShowFullscreen) && (
                <div className="flex items-center gap-1 absolute top-4 right-4 sm:top-5 sm:right-5 z-20">
                  {shouldShowFullscreen && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      onClick={handleToggleFullscreen}
                      title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                      {isFullscreen ? (
                        <MinimizeIcon className="size-4" />
                      ) : (
                        <MaximizeIcon className="size-4" />
                      )}
                    </Button>
                  )}

                  {showCloseButton && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      onClick={handleClose}
                      title="Close"
                    >
                      <CloseIcon className="size-4" />
                    </Button>
                  )}
                </div>
              )}

              {children ? (
                children
              ) : (
                <>
                  {(title || description) && (
                    <ModalHeader>
                      {title && <ModalTitle>{title}</ModalTitle>}
                      {description && (
                        <ModalDescription>{description}</ModalDescription>
                      )}
                    </ModalHeader>
                  )}
                  <ModalBody
                    className={
                      isFullscreen ? "flex-1 overflow-y-auto min-h-0 pr-1" : ""
                    }
                  >
                    <p className="text-sm text-muted-foreground">
                      Are you sure you want to proceed with this action?
                    </p>
                  </ModalBody>
                  <ModalFooter>
                    <Button variant="outline" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button variant="default" onClick={handleClose}>
                      Confirm
                    </Button>
                  </ModalFooter>
                </>
              )}
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Title: ModalTitle,
  Description: ModalDescription,
  Body: ModalBody,
  Footer: ModalFooter,
  Panel: DialogPanel,
});

export default Modal;
