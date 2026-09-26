import * as React from "react";
import { useTheme } from "../../hooks/theme";
import {
  Toaster as ReactToast,
  toast as reactToast,
  resolveValue,
} from "react-hot-toast";
import type {
  Toast,
  ToasterProps,
  ToastOptions,
  Renderable,
} from "react-hot-toast";
import {
  SuccessIcon,
  ErrorIcon,
  InfoAltIcon as InfoIcon,
  WarningIcon,
  CloseIcon,
  SpinnerIcon,
} from "./icons";

const TOAST_EDGE_GAP = 16;
const WARNING_ICON_KEY = "__TOAST_WARNING__";
const INFO_ICON_KEY = "__TOAST_INFO__";

export type ViewportBounds = {
  width: number;
  height: number;
  offsetTop: number;
  offsetLeft: number;
};

type ViewportSize = {
  width: number;
  height: number;
};

function getViewportToastOffset(
  viewport: ViewportBounds | null | undefined = null,
  layoutViewport: ViewportSize = { width: 0, height: 0 },
  gap = TOAST_EDGE_GAP,
) {
  if (!viewport) {
    return {
      top: gap,
      right: gap,
      bottom: gap,
      left: gap,
    };
  }

  const topInset = Math.max(0, viewport.offsetTop);
  const leftInset = Math.max(0, viewport.offsetLeft);
  const rightInset = Math.max(
    0,
    layoutViewport.width - viewport.width - viewport.offsetLeft,
  );
  const bottomInset = Math.max(
    0,
    layoutViewport.height - viewport.height - viewport.offsetTop,
  );

  return {
    top: topInset + gap,
    right: rightInset + gap,
    bottom: bottomInset + gap,
    left: leftInset + gap,
  };
}

function SplitHeroToast({ t }: { t: Toast }) {
  const getPillarConfig = () => {
    if (t.icon === WARNING_ICON_KEY) {
      return {
        icon: <WarningIcon className="w-5 h-5" />,
        pillarClass:
          "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
      };
    }
    if (t.icon === INFO_ICON_KEY) {
      return {
        icon: <InfoIcon className="w-5 h-5" />,
        pillarClass:
          "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
      };
    }

    switch (t.type) {
      case "success":
        return {
          icon: <SuccessIcon className="w-5 h-5" />,
          pillarClass:
            "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        };
      case "error":
        return {
          icon: <ErrorIcon className="w-5 h-5" />,
          pillarClass:
            "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30",
        };
      case "loading":
        return {
          icon: <SpinnerIcon className="w-5 h-5" />,
          pillarClass: "bg-primary/20 text-primary border-primary/30",
        };
      default:
        return {
          icon: <InfoIcon className="w-5 h-5" />,
          pillarClass:
            "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
        };
    }
  };

  const config = getPillarConfig();
  const renderCustomIcon =
    typeof t.icon === "string" &&
    t.icon !== WARNING_ICON_KEY &&
    t.icon !== INFO_ICON_KEY;

  return (
    <div
      style={{
        animation: t.visible
          ? "toastEnter 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards"
          : "toastExit 0.25s cubic-bezier(0.06, 0.71, 0.55, 1) forwards",
        ...t.style,
      }}
      className="w-full max-w-sm rounded-2xl border border-border bg-popover/95 shadow-2xl backdrop-blur-xl flex items-stretch overflow-hidden"
    >
      <div
        className={`w-12 border-r flex items-center justify-center shrink-0 ${config.pillarClass}`}
      >
        {renderCustomIcon ? (
          <span className="text-base">{t.icon}</span>
        ) : (
          config.icon
        )}
      </div>
      <div className="flex-1 p-3.5 min-w-0 flex flex-col justify-center">
        <div className="text-sm font-semibold text-foreground leading-snug break-words">
          {resolveValue(t.message, t)}
        </div>
      </div>
      {t.type !== "loading" && (
        <button
          onClick={() => reactToast.dismiss(t.id)}
          className="p-3 text-muted-foreground hover:text-foreground transition-colors self-center"
          aria-label="Close toast"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

const Toaster = ({ position = "top-right", ...props }: ToasterProps) => {
  const { theme = "dark" } = useTheme();
  const [viewportOffset, setViewportOffset] = React.useState(() =>
    getViewportToastOffset(),
  );

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncViewportOffset = () => {
      const viewport = window.visualViewport;

      setViewportOffset(
        getViewportToastOffset(
          viewport
            ? {
                width: viewport.width,
                height: viewport.height,
                offsetTop: viewport.offsetTop,
                offsetLeft: viewport.offsetLeft,
              }
            : null,
          {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        ),
      );
    };

    syncViewportOffset();

    const viewport = window.visualViewport;

    window.addEventListener("resize", syncViewportOffset);
    viewport?.addEventListener("resize", syncViewportOffset);
    viewport?.addEventListener("scroll", syncViewportOffset);

    return () => {
      window.removeEventListener("resize", syncViewportOffset);
      viewport?.removeEventListener("resize", syncViewportOffset);
      viewport?.removeEventListener("scroll", syncViewportOffset);
    };
  }, []);

  return (
    <ReactToast
      position={position}
      containerStyle={{
        top: viewportOffset.top,
        right: viewportOffset.right,
        bottom: viewportOffset.bottom,
        left: viewportOffset.left,
      }}
      {...props}
    >
      {(t) => <SplitHeroToast t={t} />}
    </ReactToast>
  );
};

export type ExtendedToast = typeof reactToast & {
  warning: (message: Renderable, options?: ToastOptions) => string;
  info: (message: Renderable, options?: ToastOptions) => string;
};

const toast = reactToast as ExtendedToast;

toast.warning = (message: Renderable, options?: ToastOptions) => {
  return reactToast(message, {
    ...options,
    icon: WARNING_ICON_KEY,
  });
};

toast.info = (message: Renderable, options?: ToastOptions) => {
  return reactToast(message, {
    ...options,
    icon: INFO_ICON_KEY,
  });
};

export { Toaster, toast };
