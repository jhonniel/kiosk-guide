"use client";

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronsDown, ChevronsUp } from "lucide-react";
import { cn } from "@/lib/utils";

type ScrollFadeContainerProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  fadeClassName?: string;
};

/** Scroll area with hidden scrollbar and hints when more content is above or below. */
export function ScrollFadeContainer({
  children,
  className,
  contentClassName,
  fadeClassName = "from-white via-white/80",
}: ScrollFadeContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight + 4;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 12;
    const atTop = el.scrollTop <= 12;
    setCanScrollDown(hasOverflow && !atBottom);
    setCanScrollUp(hasOverflow && !atTop);
  }, []);

  const scrollByPage = useCallback((direction: "up" | "down") => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = Math.max(el.clientHeight * 0.75, 160);
    el.scrollBy({
      top: direction === "down" ? distance : -distance,
      behavior: "smooth",
    });
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    update();
    el.addEventListener("scroll", update, { passive: true });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      resizeObserver.disconnect();
    };
  }, [update]);

  useLayoutEffect(() => {
    update();
  });

  return (
    <div className={cn("relative flex min-h-0 flex-col overflow-hidden", className)}>
      <div
        ref={scrollRef}
        className={cn(
          "kiosk-main-scroll h-0 min-h-0 flex-1 overflow-y-auto overscroll-contain",
          contentClassName
        )}
      >
        {children}
      </div>

      <div
        className={cn(
          "absolute inset-x-0 top-0 z-10 flex flex-col items-center justify-start pb-12 pt-2 transition-opacity duration-300",
          canScrollUp ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!canScrollUp}
      >
        <div
          className={cn("pointer-events-none absolute inset-0 bg-gradient-to-b to-transparent", fadeClassName)}
        />
        <button
          type="button"
          onClick={() => scrollByPage("up")}
          className="relative -mt-1 flex h-11 w-11 items-center justify-center rounded-lg text-[#0d9488] transition hover:scale-105 active:scale-95"
          aria-label="Scroll up"
        >
          <ChevronsUp
            className="kiosk-scroll-hint-badge-up h-7 w-7 drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)]"
            strokeWidth={2.5}
          />
        </button>
      </div>

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-10 flex flex-col items-center justify-end pb-2 pt-12 transition-opacity duration-300",
          canScrollDown ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!canScrollDown}
      >
        <div
          className={cn("pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent", fadeClassName)}
        />
        <button
          type="button"
          onClick={() => scrollByPage("down")}
          className="relative -mb-1 flex h-11 w-11 items-center justify-center rounded-lg text-[#0d9488] transition hover:scale-105 active:scale-95"
          aria-label="Scroll down"
        >
          <ChevronsDown
            className="kiosk-scroll-hint-badge h-7 w-7 drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)]"
            strokeWidth={2.5}
          />
        </button>
      </div>
    </div>
  );
}
