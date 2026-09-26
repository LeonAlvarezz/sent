import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "../../libs/cn";

export type ModifierKey =
  "cmd" | "command" | "ctrl" | "control" | "alt" | "option" | "shift" | "meta";

export type SpecialKey =
  | "enter"
  | "escape"
  | "esc"
  | "tab"
  | "space"
  | "backspace"
  | "delete"
  | "del"
  | "up"
  | "down"
  | "left"
  | "right";

export type KbdKey = ModifierKey | SpecialKey | (string & {});

const KEY_SYMBOL_MAP: Record<string, string> = {
  cmd: "⌘",
  command: "⌘",
  meta: "⌘",
  ctrl: "⌃",
  control: "⌃",
  alt: "⌥",
  option: "⌥",
  shift: "⇧",
  enter: "↵",
  escape: "Esc",
  esc: "Esc",
  tab: "⇥",
  space: "␣",
  backspace: "⌫",
  delete: "⌦",
  del: "⌦",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

export interface KeyboardProps extends ComponentPropsWithoutRef<"kbd"> {
  keys?: KbdKey | KbdKey[];
  children?: ReactNode;
}

function formatKey(key: string): string {
  const lower = key.toLowerCase();
  if (KEY_SYMBOL_MAP[lower]) {
    return KEY_SYMBOL_MAP[lower];
  }
  return key.length === 1 ? key.toUpperCase() : key;
}

function Keyboard({ keys, children, className, ...props }: KeyboardProps) {
  const keyList = Array.isArray(keys) ? keys : keys ? [keys] : [];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 select-none pointer-events-none",
        className,
      )}
      {...props}
    >
      {keyList.map((key, index) => (
        <kbd
          key={index}
          className="flex h-5 min-w-5 items-center justify-center rounded border border-border/80 bg-accent px-1 font-mono text-[10px] font-medium text-foreground shadow-xs"
        >
          {formatKey(key)}
        </kbd>
      ))}
      {children}
    </span>
  );
}

export default Keyboard;
