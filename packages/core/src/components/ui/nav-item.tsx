import React, { useState, useEffect } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { cn } from "../../libs/cn";
import type { NavItemConfig } from "../../types";
import { useSidebarContext } from "../sidebar";
import { useActiveUrl } from "../../hooks/active-url";

import { ChevronDownIcon } from "./icons";

const SUB_NAV_ITEM_STEP_PX = 32;
const SUB_NAV_ITEM_CENTER_PX = 14;

export interface NavItemProps extends Omit<
  ComponentPropsWithoutRef<"a">,
  "children"
> {
  icon?: ReactNode;
  label?: ReactNode;
  active?: boolean;
  action?: ReactNode;
  badge?: ReactNode;
  items?: NavItemConfig[];
  defaultOpen?: boolean;
  level?: number;
  children?: ReactNode;
  as?: React.ElementType;
}

function NavItemRoot({
  icon,
  label,
  active,
  action,
  badge,
  items,
  defaultOpen,
  level = 1,
  children,
  className,
  as,
  onClick,
  href,
  ...props
}: NavItemProps) {
  const sidebarContext = useSidebarContext();
  const isCollapsed = sidebarContext?.isCollapsed ?? false;

  const { isItemActive } = useActiveUrl();

  const hasSubItems = Boolean(items && items.length > 0);

  const activeChildIndex = hasSubItems
    ? items!.findIndex((item) => isItemActive([item]))
    : -1;
  const isChildActive = activeChildIndex >= 0;

  const [isOpen, setIsOpen] = useState(defaultOpen || isChildActive);

  // Auto-expand if a child route becomes active
  useEffect(() => {
    if (isChildActive) {
      setIsOpen(true);
    }
  }, [isChildActive]);

  const hasAction = Boolean(children || action);
  const Component = as || (hasSubItems ? "button" : href ? "a" : "div");

  const isLevel2 = level === 2;

  const navClassNames = cn(
    "flex w-full opacity-50 items-center gap-3 rounded-md transition-colors text-foreground/80 group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:px-2",
    hasAction && "opacity-100",
    isLevel2
      ? "px-3 py-1.5 text-xs text-muted-foreground font-medium data-[active=true]:bg-accent data-[active=true]:opacity-100 data-[active=true]:text-accent-foreground data-[active=true]:font-bold data-[status=active]:opacity-100 data-[status=active]:text-accent-foreground data-[status=active]:font-bold"
      : "px-3 py-2 text-sm font-medium data-[active=true]:bg-accent data-[active=true]:opacity-100 data-[active=true]:text-accent-foreground data-[active=true]:font-bold data-[status=active]:bg-accent data-[status=active]:opacity-100 data-[status=active]:text-accent-foreground data-[status=active]:font-bold",
    !hasAction && "hover:bg-accent hover:text-accent-foreground cursor-pointer",
    !hasAction && isLevel2 && "hover:text-foreground",
    className,
  );

  const innerContent = (
    <>
      {icon && (
        <span className="shrink-0 text-base flex items-center justify-center">
          {icon}
        </span>
      )}
      {label && (
        <span className="truncate whitespace-nowrap transition-all duration-150 group-data-[collapsed=true]:w-0 group-data-[collapsed=true]:opacity-0 group-data-[collapsed=true]:hidden flex-1 text-left">
          {label}
        </span>
      )}
      {badge && (
        <span className="ml-auto shrink-0 group-data-[collapsed=true]:hidden">
          {badge}
        </span>
      )}
      {hasSubItems && (
        <ChevronDownIcon
          className={cn(
            "ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[collapsed=true]:hidden",
            isOpen && "rotate-180",
          )}
        />
      )}
      {action && (
        <span
          className="ml-auto shrink-0 group-data-[collapsed=true]:hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {action}
        </span>
      )}
      {children}
    </>
  );

  // --- COLLAPSED MODE WITH SUB-ITEMS: FLYOUT POPOVER MENU ---
  if (isCollapsed && hasSubItems) {
    return (
      <li className="list-none">
        <Menu as="div" className="relative w-full flex justify-center">
          <MenuButton
            data-active={active || isChildActive}
            className={navClassNames}
          >
            {icon && (
              <span className="shrink-0 text-base flex items-center justify-center">
                {icon}
              </span>
            )}
          </MenuButton>
          <MenuItems
            transition
            anchor={{ to: "right start", gap: 10 }}
            className="z-50 min-w-44 rounded-lg border border-border/40 bg-card p-2 shadow-lg text-popover-foreground transition duration-150 ease-out data-closed:scale-95 data-closed:opacity-0 origin-left"
          >
            {label && (
              <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border/40 mb-1">
                {label}
              </div>
            )}
            <div className="flex gap-1 flex-col my-2">
              {items!.map((child) => (
                <MenuItem key={child.id}>
                  {child.path ? (
                    <Link
                      to={child.path}
                      className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-foreground hover:bg-accent whitespace-nowrap"
                      activeProps={{
                        className:
                          "bg-accent text-accent-foreground font-semibold",
                      }}
                    >
                      {child.icon && (
                        <span className="size-4 flex items-center justify-center shrink-0">
                          {child.icon}
                        </span>
                      )}
                      <span>{child.label}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-foreground">
                      {child.icon}
                      <span>{child.label}</span>
                    </div>
                  )}
                </MenuItem>
              ))}
            </div>
          </MenuItems>
        </Menu>
      </li>
    );
  }

  // --- EXPANDED MODE WITH SUB-ITEMS: ACCORDION LIST ---
  if (hasSubItems) {
    return (
      <li className="list-none flex flex-col">
        <button
          type="button"
          data-active={active || isChildActive}
          onClick={(e) => {
            setIsOpen(!isOpen);
            onClick?.(e as unknown as React.MouseEvent<HTMLAnchorElement>);
          }}
          className={navClassNames}
        >
          {innerContent}
        </button>
        {isOpen && (
          <ul className="relative flex flex-col gap-1 mt-1 pl-2.5 ml-5">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -left-px top-0 w-px bg-foreground/20"
              style={{
                height: `${(items!.length - 1) * SUB_NAV_ITEM_STEP_PX + SUB_NAV_ITEM_CENTER_PX}px`,
              }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -left-px top-0 w-px bg-foreground/70 transition-[height] duration-200 ease-out motion-reduce:transition-none"
              style={{
                height: isChildActive
                  ? `${activeChildIndex * SUB_NAV_ITEM_STEP_PX + SUB_NAV_ITEM_CENTER_PX}px`
                  : "0px",
              }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute z-10 left-[-2.5px] top-3 size-1  rounded-full bg-foreground ring-2 ring-sidebar transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none"
              style={{
                opacity: isChildActive ? 1 : 0,
                transform: isChildActive
                  ? `translateY(${activeChildIndex * SUB_NAV_ITEM_STEP_PX}px) scale(1)`
                  : `translateY(-${SUB_NAV_ITEM_CENTER_PX}px) scale(0.75)`,
              }}
            />
            {items!.map((child) => (
              <NavItemRoot
                key={child.id}
                id={child.id}
                icon={child.icon}
                label={child.label}
                href={child.path}
                active={child.active}
                action={child.action}
                badge={child.badge}
                items={child.items}
                onClick={onClick}
                level={2}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  // --- STANDARD SINGLE LINK (NO SUB-ITEMS) ---
  if (href && !hasAction) {
    return (
      <li className="list-none">
        <Link
          to={href}
          data-active={active}
          className={navClassNames}
          onClick={onClick}
          activeProps={{
            className: cn(
              "text-foreground opacity-100 font-bold",
              !isLevel2 && "bg-accent",
            ),
          }}
        >
          {innerContent}
        </Link>
      </li>
    );
  }

  return (
    <li className="list-none">
      <Component
        data-active={active}
        onClick={onClick}
        href={href}
        className={navClassNames}
        {...props}
      >
        {innerContent}
      </Component>
    </li>
  );
}

function NavItemAction({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={cn(
        "ml-auto shrink-0 group-data-[collapsed=true]:hidden",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </span>
  );
}

export const NavItem = Object.assign(NavItemRoot, {
  Action: NavItemAction,
});

export default NavItem;
