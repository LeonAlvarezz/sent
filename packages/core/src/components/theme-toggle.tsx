import {
  SunIcon,
  MoonIcon,
  ChevronLeftIcon as LeftIcon,
  ChevronRightIcon as RightIcon,
  ComputerIcon,
} from "./ui/icons";
import { useState } from "react";
import { useTheme } from "../hooks/theme";

const themes = ["dark", "light", "system"] as const;

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const currentIndex = themes.indexOf(theme);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;


  const [startX, setStartX] = useState<number | null>(null);

  const handleLeft = () => {
    const nextIndex = (safeIndex - 1 + themes.length) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const handleRight = () => {
    const nextIndex = (safeIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setStartX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (startX === null) return;
    console.log({ startX });
    console.log({ clientX: e.clientX });

    const diffX = startX - e.clientX;
    const threshold = 15; // minimum swipe distance in pixels

    if (diffX > threshold) {
      handleRight();
    } else if (diffX < -threshold) {
      handleLeft();
    }
    setStartX(null);
  };

  return (
    <div className="flex items-center justify-between min-w-22 h-8 rounded-full border border-black/10 px-1 select-none">
      {/* Left Button */}
      <button onClick={handleLeft} className="z-10 cursor-pointer">
        <LeftIcon />
      </button>

      {/* Center Viewport with Swipe Gesture */}
      <div
        className="relative w-6 h-6 overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {/* Sliding Track */}
        <div
          className="flex w-full transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${safeIndex * 100}%)` }}
        >
          <div className="size-6 shrink-0 flex items-center justify-center">
            <MoonIcon />
          </div>
          <div className="size-6 shrink-0 flex items-center justify-center">
            <SunIcon />
          </div>
          <div className="size-6 shrink-0 flex items-center justify-center">
            <ComputerIcon />
          </div>
        </div>
      </div>

      {/* Right Button */}
      <button onClick={handleRight} className="z-10 cursor-pointer">
        <RightIcon />
      </button>
    </div>
  );
}

export default ThemeToggle;
