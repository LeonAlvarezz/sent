import React, { useState } from "react";
import type { ReactNode } from "react";
import { Modal } from "./modal";
import Button from "./button";
import type { ButtonVariant } from "./button";
import { AlertTriangleIcon, AlertCircleIcon, InfoIcon } from "./icons";
import { cn } from "../../utils/cn";

export interface ConfirmModalProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  open?: boolean;
  onClose?: () => void;
  title?: ReactNode;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "warning" | "default";
  icon?: ReactNode | false;
  children?: ReactNode;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const variantStyles = {
  destructive: {
    confirmVariant: "destructive" as ButtonVariant,
    defaultIcon: <AlertCircleIcon className="size-6" />,
  },
  warning: {
    confirmVariant: "default" as ButtonVariant,
    defaultIcon: <AlertTriangleIcon className="size-6" />,
  },
  default: {
    confirmVariant: "default" as ButtonVariant,
    defaultIcon: <InfoIcon className="size-6" />,
  },
};

export function ConfirmModal({
  isOpen,
  setIsOpen,
  open,
  onClose,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  icon,
  children,
  isLoading = false,
  onConfirm,
  onCancel,
  className,
  size = "md",
}: ConfirmModalProps) {
  const isModalOpen = open ?? isOpen ?? false;
  const [internalLoading, setInternalLoading] = useState(false);

  const handleClose = () => {
    if (onClose) onClose();
    if (setIsOpen) setIsOpen(false);
    if (onCancel) onCancel();
  };

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
      if (onClose) onClose();
      if (setIsOpen) setIsOpen(false);
    } finally {
      setInternalLoading(false);
    }
  };

  const currentVariant = variantStyles[variant];
  const renderedIcon =
    icon === false ? null : (icon ?? currentVariant.defaultIcon);
  const loadingState = isLoading || internalLoading;

  return (
    <Modal
      isOpen={isModalOpen}
      setIsOpen={setIsOpen}
      open={open}
      onClose={handleClose}
      size={size}
      showCloseButton={false}
      className={cn("sm:min-w-150", className)}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-1 pt-0.5">
          <Modal.Title className="text-lg font-semibold text-foreground">
            {title}
          </Modal.Title>
          {description && (
            <Modal.Description className="text-sm text-muted-foreground">
              {description}
            </Modal.Description>
          )}
          {children && <div className="pt-2">{children}</div>}
        </div>
      </div>

      <Modal.Footer className="mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={loadingState}
        >
          {cancelText}
        </Button>
        <Button
          type="button"
          variant={currentVariant.confirmVariant}
          onClick={handleConfirm}
          disabled={loadingState}
        >
          {loadingState ? "Processing..." : confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfirmModal;
