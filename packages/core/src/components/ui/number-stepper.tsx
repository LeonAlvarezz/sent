import React, { useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "../../utils/cn";
import Button from "./button";
import Input from "./input";

export interface NumberStepperProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "onChange" | "defaultValue"
> {
  /**
   * The current numeric value (controlled mode).
   */
  value?: number;
  /**
   * The initial numeric value (uncontrolled mode). Defaults to `min ?? 0`.
   */
  defaultValue?: number;
  /**
   * Callback fired when value changes.
   */
  onChange?: (value: number) => void;
  /**
   * Minimum allowed value.
   */
  min?: number;
  /**
   * Maximum allowed value.
   */
  max?: number;
  /**
   * Step increment/decrement amount. Defaults to 1.
   */
  step?: number;
  /**
   * Whether the stepper is completely disabled.
   */
  disabled?: boolean;
  /**
   * Whether the stepper is read-only (buttons disabled, no edits).
   */
  readOnly?: boolean;
  /**
   * Size variant: "sm" (32px / h-8), "md" (36px / h-9), "lg" (40px / h-10).
   * Defaults to "sm".
   */
  size?: "sm" | "md" | "lg";
  /**
   * Whether the center value allows direct typing/input. Defaults to false.
   */
  allowInput?: boolean;
  /**
   * Explicit override to disable decrement button.
   */
  decrementDisabled?: boolean;
  /**
   * Explicit override to disable increment button.
   */
  incrementDisabled?: boolean;
  /**
   * Accessible aria-label for decrement button. Defaults to "Decrease value".
   */
  decrementAriaLabel?: string;
  /**
   * Accessible aria-label for increment button. Defaults to "Increase value".
   */
  incrementAriaLabel?: string;
  /**
   * Custom icon/element for the decrement button.
   */
  decrementIcon?: ReactNode;
  /**
   * Custom icon/element for the increment button.
   */
  incrementIcon?: ReactNode;
  /**
   * Custom formatter for displaying the current value.
   */
  formatValue?: (value: number) => ReactNode;
}

const sizeConfig = {
  sm: {
    container: "h-8",
    button: "h-8 w-8",
    iconSize: "size-3.5",
    valueText: "w-10 text-sm",
  },
  md: {
    container: "h-9",
    button: "h-9 w-9",
    iconSize: "size-4",
    valueText: "w-12 text-sm",
  },
  lg: {
    container: "h-10",
    button: "h-10 w-10",
    iconSize: "size-4.5",
    valueText: "w-14 text-base",
  },
};

function DefaultMinusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function DefaultPlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

export function NumberStepper({
  value: controlledValue,
  defaultValue,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  readOnly = false,
  size = "sm",
  allowInput = false,
  decrementDisabled: customDecrementDisabled,
  incrementDisabled: customIncrementDisabled,
  decrementAriaLabel = "Decrease value",
  incrementAriaLabel = "Increase value",
  decrementIcon,
  incrementIcon,
  formatValue,
  className,
  ...props
}: NumberStepperProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<number>(
    defaultValue ?? min ?? 0,
  );
  const currentValue = isControlled ? controlledValue : internalValue;

  const config = sizeConfig[size];

  const isDecrementDisabled =
    disabled ||
    readOnly ||
    customDecrementDisabled ||
    (min !== undefined && currentValue <= min);

  const isIncrementDisabled =
    disabled ||
    readOnly ||
    customIncrementDisabled ||
    (max !== undefined && currentValue >= max);

  const handleDecrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isDecrementDisabled) return;
    const raw = currentValue - step;
    const clamped = min !== undefined ? Math.max(min, raw) : raw;
    const rounded = parseFloat(clamped.toFixed(10));
    if (!isControlled) {
      setInternalValue(rounded);
    }
    onChange?.(rounded);
  };

  const handleIncrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isIncrementDisabled) return;
    const raw = currentValue + step;
    const clamped = max !== undefined ? Math.min(max, raw) : raw;
    const rounded = parseFloat(clamped.toFixed(10));
    if (!isControlled) {
      setInternalValue(rounded);
    }
    onChange?.(rounded);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (rawVal === "" || rawVal === "-") return;
    const parsed = parseFloat(rawVal);
    if (!isNaN(parsed)) {
      let clamped = parsed;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      const rounded = parseFloat(clamped.toFixed(10));
      if (!isControlled) {
        setInternalValue(rounded);
      }
      onChange?.(rounded);
    }
  };

  return (
    <div
      role="group"
      aria-label="Number stepper"
      className={cn(
        "inline-flex items-center border border-border rounded-md bg-card shadow-2xs select-none",
        config.container,
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className,
      )}
      {...props}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "p-0 rounded-r-none text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed",
          config.button,
        )}
        onClick={handleDecrement}
        disabled={isDecrementDisabled}
        aria-label={decrementAriaLabel}
      >
        {decrementIcon || <DefaultMinusIcon className={config.iconSize} />}
      </Button>

      {allowInput ? (
        <Input
          type="number"
          value={currentValue}
          min={min}
          max={max}
          step={step}
          disabled={disabled || readOnly}
          onChange={handleInputChange}
          className={cn(
            "text-center font-semibold text-foreground bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            config.valueText,
          )}
        />
      ) : (
        <span
          className={cn(
            "text-center font-semibold text-foreground select-none",
            config.valueText,
          )}
          aria-live="polite"
        >
          {formatValue ? formatValue(currentValue) : currentValue}
        </span>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "p-0 rounded-l-none text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed",
          config.button,
        )}
        onClick={handleIncrement}
        disabled={isIncrementDisabled}
        aria-label={incrementAriaLabel}
      >
        {incrementIcon || <DefaultPlusIcon className={config.iconSize} />}
      </Button>
    </div>
  );
}

export const Stepper = NumberStepper;
export type StepperProps = NumberStepperProps;

export default NumberStepper;
