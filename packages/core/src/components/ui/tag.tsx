import * as React from "react";
import { cn } from "../../utils/cn";

export const TAILWIND_COLORS = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const;

export type Color = (typeof TAILWIND_COLORS)[number];

export const colorVariants: Record<Color, { badge: string; dot: string }> = {
  slate: {
    badge:
      "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
    dot: "bg-slate-500",
  },
  gray: {
    badge: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
    dot: "bg-gray-500",
  },
  zinc: {
    badge: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20",
    dot: "bg-zinc-500",
  },
  neutral: {
    badge:
      "bg-neutral-500/10 text-neutral-700 dark:text-neutral-400 border-neutral-500/20",
    dot: "bg-neutral-500",
  },
  stone: {
    badge:
      "bg-stone-500/10 text-stone-700 dark:text-stone-400 border-stone-500/20",
    dot: "bg-stone-500",
  },
  red: {
    badge: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    dot: "bg-red-500",
  },
  orange: {
    badge:
      "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
    dot: "bg-orange-500",
  },
  amber: {
    badge:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    dot: "bg-amber-500",
  },
  yellow: {
    badge:
      "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
    dot: "bg-yellow-500",
  },
  lime: {
    badge: "bg-lime-500/10 text-lime-700 dark:text-lime-400 border-lime-500/20",
    dot: "bg-lime-500",
  },
  green: {
    badge:
      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    dot: "bg-green-500",
  },
  emerald: {
    badge:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  teal: {
    badge: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
    dot: "bg-teal-500",
  },
  cyan: {
    badge: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
    dot: "bg-cyan-500",
  },
  sky: {
    badge: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
    dot: "bg-sky-500",
  },
  blue: {
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    dot: "bg-blue-500",
  },
  indigo: {
    badge:
      "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
    dot: "bg-indigo-500",
  },
  violet: {
    badge:
      "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
    dot: "bg-violet-500",
  },
  purple: {
    badge:
      "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    dot: "bg-purple-500",
  },
  fuchsia: {
    badge:
      "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-500/20",
    dot: "bg-fuchsia-500",
  },
  pink: {
    badge: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
    dot: "bg-pink-500",
  },
  rose: {
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    dot: "bg-rose-500",
  },
};

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  label?: React.ReactNode;
  children?: React.ReactNode;
  color?: Color;
  dot?: boolean;
  className?: string;
}

export function Tag({
  label,
  children,
  color = "gray",
  dot = true,
  className,
  ...props
}: TagProps) {
  const content = children ?? label;
  const style = colorVariants[color];

  return (
    <span
      className={cn(
        "inline-flex capitalize items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border",
        style.badge,
        className,
      )}
      {...props}
    >
      {dot && (
        <span className={cn("size-1 rounded-full shrink-0", style.dot)} />
      )}
      {content}
    </span>
  );
}

export default Tag;
