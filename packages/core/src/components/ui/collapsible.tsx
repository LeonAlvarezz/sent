import React, {
  createContext,
  useContext,
  useState,
  useId,
  forwardRef,
} from "react";
import type {
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode,
  MouseEvent,
} from "react";
import { ChevronRightIcon } from "./icons";
import { cn } from "../../utils/cn";

export interface CollapsibleContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  disabled?: boolean;
  contentId: string;
}

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

export function useCollapsibleContext(): CollapsibleContextValue {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error(
      "Collapsible compound components must be used within a <Collapsible> provider",
    );
  }
  return context;
}

export interface CollapsibleProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  children?: ReactNode | ((props: { open: boolean }) => ReactNode);
  as?: ElementType;
}

export const CollapsibleRoot = forwardRef<HTMLDivElement, CollapsibleProps>(
  (
    {
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      disabled = false,
      children,
      className,
      as: Component = "div",
      ...props
    },
    ref,
  ) => {
    const isControlled = controlledOpen !== undefined;
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const open = isControlled ? controlledOpen : internalOpen;
    const contentId = useId();

    const setOpen = (nextOpen: boolean) => {
      if (disabled) return;
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    };

    const toggle = () => {
      if (disabled) return;
      setOpen(!open);
    };

    return (
      <CollapsibleContext.Provider
        value={{
          open,
          setOpen,
          toggle,
          disabled,
          contentId,
        }}
      >
        <Component
          ref={ref}
          data-state={open ? "open" : "closed"}
          data-disabled={disabled ? "" : undefined}
          className={cn("group/collapsible", className)}
          {...props}
        >
          {typeof children === "function" ? children({ open }) : children}
        </Component>
      </CollapsibleContext.Provider>
    );
  },
);

CollapsibleRoot.displayName = "Collapsible";

export interface CollapsibleTriggerProps
  extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  showChevron?: boolean;
  chevronPosition?: "left" | "right";
  chevronClassName?: string;
  children?: ReactNode | ((props: { open: boolean }) => ReactNode);
}

export const CollapsibleTrigger = forwardRef<
  HTMLButtonElement,
  CollapsibleTriggerProps
>(
  (
    {
      showChevron = true,
      chevronPosition = "left",
      chevronClassName,
      children,
      className,
      onClick,
      disabled: buttonDisabled,
      ...props
    },
    ref,
  ) => {
    const { open, toggle, disabled: contextDisabled, contentId } =
      useCollapsibleContext();
    const isDisabled = buttonDisabled ?? contextDisabled;

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
      if (!e.defaultPrevented) {
        toggle();
      }
    };

    const chevron = showChevron && (
      <ChevronRightIcon
        aria-hidden="true"
        className={cn(
          "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
          open && "rotate-90",
          chevronClassName,
        )}
      />
    );

    return (
      <button
        ref={ref}
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        disabled={isDisabled}
        onClick={handleClick}
        data-state={open ? "open" : "closed"}
        data-disabled={isDisabled ? "" : undefined}
        className={cn(
          "inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {chevronPosition === "left" && chevron}
        {typeof children === "function" ? children({ open }) : children}
        {chevronPosition === "right" && chevron}
      </button>
    );
  },
);

CollapsibleTrigger.displayName = "CollapsibleTrigger";

export interface CollapsibleContentProps
  extends ComponentPropsWithoutRef<"div"> {
  forceMount?: boolean;
  as?: ElementType;
}

export const CollapsibleContent = forwardRef<
  HTMLDivElement,
  CollapsibleContentProps
>(
  (
    {
      forceMount = false,
      children,
      className,
      as: Component = "div",
      ...props
    },
    ref,
  ) => {
    const { open, contentId } = useCollapsibleContext();

    if (!open && !forceMount) {
      return null;
    }

    return (
      <Component
        ref={ref}
        id={contentId}
        data-state={open ? "open" : "closed"}
        hidden={!open && forceMount ? true : undefined}
        className={cn(
          "transition-all duration-200 ease-in-out",
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

CollapsibleContent.displayName = "CollapsibleContent";

export const Collapsible = Object.assign(CollapsibleRoot, {
  Trigger: CollapsibleTrigger,
  Content: CollapsibleContent,
});

export default Collapsible;
