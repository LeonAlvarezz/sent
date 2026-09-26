import React, { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { cn } from "../../libs/cn";

export interface RouteProgressBarProps {
  className?: string;
}

export function RouteProgressBar({ className }: RouteProgressBarProps) {
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;
    let finishTimer: ReturnType<typeof setTimeout>;

    if (isLoading) {
      setVisible(true);
      setProgress(20);
      t1 = setTimeout(() => setProgress(50), 100);
      t2 = setTimeout(() => setProgress(75), 250);
      t3 = setTimeout(() => setProgress(90), 500);
    } else {
      setProgress(100);
      finishTimer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(finishTimer);
    };
  }, [isLoading]);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] h-[2.5px] pointer-events-none overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "h-full bg-primary transition-all shadow-[0_0_10px_var(--color-primary)]",
          progress === 100
            ? "duration-200 opacity-0"
            : "duration-300 ease-out opacity-100",
        )}
        style={{
          width: `${progress}%`,
          transitionProperty: "width, opacity",
        }}
      />
    </div>
  );
}

export default RouteProgressBar;
