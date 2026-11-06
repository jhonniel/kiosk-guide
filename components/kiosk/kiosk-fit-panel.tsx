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
  // Height-only scaling widens the content, which re-wraps text and changes its height, so the
  // scale can flip between two values. Count changes per available size and lock to the smallest.
  const settleRef = useRef({ availableW: 0, availableH: 0, changes: 0, minScale: 1, lastScale: 1 });

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

    let nextScale =
      fit === "height"
        ? Math.min(1, availableH / neededH)
        : Math.min(1, availableW / neededW, availableH / neededH);

    const settle = settleRef.current;
    if (settle.availableW !== availableW || settle.availableH !== availableH) {
      settleRef.current = { availableW, availableH, changes: 0, minScale: 1, lastScale: settle.lastScale };
    }
    const tracker = settleRef.current;
    if (Math.abs(tracker.lastScale - nextScale) >= 0.001) {
      tracker.changes += 1;
      tracker.minScale = Math.min(tracker.minScale, nextScale);
    }
    if (tracker.changes > 6) nextScale = tracker.minScale;
    tracker.lastScale = nextScale;

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
    settleRef.current = { availableW: 0, availableH: 0, changes: 0, minScale: 1, lastScale: 1 };
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
