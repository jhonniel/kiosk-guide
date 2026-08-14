"use client";

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type KioskFitPanelProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** Re-measure when this value changes (e.g. browse tab or search). */
  measureKey?: string | number;
  /** Height-only keeps full width; both axes shrink uniformly (default). */
  fit?: "both" | "height";
};

type FitState = {
  scale: number;
  contentW: number;
  contentH: number;
};

/**
 * Scales content down (never up) so it fits the available panel height/width.
 * Re-checks on resize and browser zoom (visualViewport).
 */
export function KioskFitPanel({
  children,
  className,
  contentClassName,
  measureKey,
  fit = "both",
}: KioskFitPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [{ scale, contentW, contentH }, setFit] = useState<FitState>({
    scale: 1,
    contentW: 0,
    contentH: 0,
  });

  const update = useCallback(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const availableW = container.clientWidth;
    const availableH = container.clientHeight;
    const neededW = content.scrollWidth;
    const neededH = content.scrollHeight;

    if (availableW <= 0 || availableH <= 0 || neededW <= 0 || neededH <= 0) {
      return;
    }

    const nextScale =
      fit === "height"
        ? Math.min(1, availableH / neededH)
        : Math.min(1, availableW / neededW, availableH / neededH);

    setFit((prev) => {
      if (
        Math.abs(prev.scale - nextScale) < 0.001 &&
        prev.contentW === neededW &&
        prev.contentH === neededH
      ) {
        return prev;
      }
      return { scale: nextScale, contentW: neededW, contentH: neededH };
    });
  }, [fit]);

  useLayoutEffect(() => {
    setFit({ scale: 1, contentW: 0, contentH: 0 });
  }, [measureKey, fit]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    update();

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(container);
    resizeObserver.observe(content);

    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, [update, measureKey, fit]);

  useLayoutEffect(() => {
    update();
  });

  const scaled = scale < 0.999 && contentH > 0;
  const heightOnly = fit === "height";

  return (
    <div ref={containerRef} className={cn("relative min-h-0 flex-1 overflow-hidden", className)}>
      <div
        className={cn(
          "w-full overflow-hidden",
          scaled ? "h-auto" : "flex h-full min-h-0 items-start"
        )}
        style={
          scaled
            ? {
                width: heightOnly ? "100%" : Math.ceil(contentW * scale),
                height: Math.ceil(contentH * scale),
              }
            : undefined
        }
      >
        <div
          ref={contentRef}
          className={contentClassName}
          style={
            scaled
              ? heightOnly
                ? {
                    width: `${100 / scale}%`,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }
                : {
                    width: contentW,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }
              : { width: "100%" }
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
