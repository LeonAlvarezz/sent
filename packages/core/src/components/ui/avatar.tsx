import React, { useState, useEffect } from "react";
import { cn } from "../../utils/cn";

export const AVATAR_1 = "avatar-1";
export const AVATAR_2 = "avatar-2";
export const DEFAULT_AVATAR = AVATAR_1;

export function SimpleAvatar1({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-full object-cover", className)}
    >
      <mask
        id="simple_avatar_1_mask"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="36"
        height="36"
      >
        <rect width="36" height="36" rx="72" fill="#FFFFFF" />
      </mask>
      <g mask="url(#simple_avatar_1_mask)">
        <rect width="36" height="36" fill="#e76f51" />
        <rect
          x="0"
          y="0"
          width="36"
          height="36"
          transform="translate(6 6) rotate(356 18 18) scale(1.2)"
          fill="#2a9d8f"
          rx="6"
        />
        <g transform="translate(4 6) rotate(6 18 18)">
          <path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF" />
          <rect
            x="13"
            y="14"
            width="1.5"
            height="2"
            rx="1"
            stroke="none"
            fill="#FFFFFF"
          />
          <rect
            x="21"
            y="14"
            width="1.5"
            height="2"
            rx="1"
            stroke="none"
            fill="#FFFFFF"
          />
        </g>
      </g>
    </svg>
  );
}

export function SimpleAvatar2({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-full object-cover", className)}
    >
      <mask
        id="simple_avatar_2_mask"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="36"
        height="36"
      >
        <rect width="36" height="36" rx="72" fill="#FFFFFF" />
      </mask>
      <g mask="url(#simple_avatar_2_mask)">
        <rect width="36" height="36" fill="#264653" />
        <rect
          x="0"
          y="0"
          width="36"
          height="36"
          transform="translate(2 2) rotate(182 18 18) scale(1.2)"
          fill="#e9c46a"
          rx="36"
        />
        <g transform="translate(-6 -2) rotate(2 18 18)">
          <path
            d="M15 21c2 1 4 1 6 0"
            stroke="#000000"
            fill="none"
            strokeLinecap="round"
          />
          <rect
            x="12"
            y="14"
            width="1.5"
            height="2"
            rx="1"
            stroke="none"
            fill="#000000"
          />
          <rect
            x="22"
            y="14"
            width="1.5"
            height="2"
            rx="1"
            stroke="none"
            fill="#000000"
          />
        </g>
      </g>
    </svg>
  );
}

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  fallback?: React.ReactNode;
  variant?: 1 | 2 | "1" | "2" | "avatar-1" | "avatar-2";
  alt?: string;
  className?: string;
}

function Avatar({ src, name, fallback, variant, alt, className }: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const isAvatar1 =
    variant === 1 ||
    variant === "avatar-1" ||
    variant === "1" ||
    src === "avatar-1" ||
    src === "1" ||
    src === AVATAR_1 ||
    src?.endsWith("simple-avatar-1.svg");

  const isAvatar2 =
    variant === 2 ||
    variant === "avatar-2" ||
    variant === "2" ||
    src === "avatar-2" ||
    src === "2" ||
    src === AVATAR_2 ||
    src?.endsWith("simple-avatar-2.svg");

  const renderContent = () => {
    if (isAvatar1) {
      return <SimpleAvatar1 />;
    }

    if (isAvatar2) {
      return <SimpleAvatar2 />;
    }

    if (src && !imageError) {
      return (
        <img
          src={src}
          alt={alt || name || "Avatar"}
          className="size-full object-cover"
          onError={() => setImageError(true)}
        />
      );
    }

    if (fallback) {
      return fallback;
    }

    if (name && name.trim().length > 0) {
      const initials = name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();

      return (
        <span className="font-semibold text-xs text-accent-foreground select-none">
          {initials || "U"}
        </span>
      );
    }

    return <SimpleAvatar1 />;
  };

  return (
    <div
      className={cn(
        "aspect-square shrink-0 size-8 overflow-hidden rounded-full flex items-center justify-center bg-accent/40",
        className,
      )}
    >
      {renderContent()}
    </div>
  );
}

Avatar.Simple1 = SimpleAvatar1;
Avatar.Simple2 = SimpleAvatar2;

export default Avatar;
