"use client";

import { useEffect, useState, type CSSProperties } from "react";

/**
 * Optional large-screen readability bump via root font-size only.
 * No CSS transform scale — fills the live window and keeps tap coords correct.
 */
const LARGE_MIN_WIDTH = 1600;
const LARGE_MIN_HEIGHT = 900;
const BASE_FONT_PX = 16;
const LARGE_FONT_PX = 18;

function readViewport() {
  const vv = window.visualViewport;
  return {
    w: Math.max(1, Math.round(vv?.width ?? window.innerWidth)),
    h: Math.max(1, Math.round(vv?.height ?? window.innerHeight)),
  };
}

function readScreen() {
  return {
    w: Math.max(0, Math.round(window.screen?.availWidth || window.screen?.width || 0)),
    h: Math.max(0, Math.round(window.screen?.availHeight || window.screen?.height || 0)),
  };
}

function computeFit(autoZoomEnabled: boolean) {
  const viewport = readViewport();
  const screen = readScreen();

  const isLarge =
    autoZoomEnabled &&
    Math.max(screen.w, viewport.w) >= LARGE_MIN_WIDTH &&
    Math.max(screen.h, viewport.h) >= LARGE_MIN_HEIGHT;

  return {
    width: viewport.w,
    height: viewport.h,
    fontSizePx: isLarge ? LARGE_FONT_PX : BASE_FONT_PX,
  };
}

/** Measure the window and size the kiosk shell to fill it. */
export function useKioskUiScale(enabled = true): {
  viewportStyle: CSSProperties;
  stageStyle: CSSProperties;
  scale: number;
} {
  const [, setState] = useState({ width: 1920, height: 1080, fontSizePx: BASE_FONT_PX });

  useEffect(() => {
    const root = document.documentElement;

    const update = () => {
      const next = computeFit(enabled);
      setState(next);
      root.style.setProperty("--kiosk-ui-scale", "1");
      root.style.fontSize = `${next.fontSizePx}px`;
    };

    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
      root.style.setProperty("--kiosk-ui-scale", "1");
      root.style.fontSize = "";
    };
  }, [enabled]);

  return {
    scale: 1,
    viewportStyle: {
      width: "100vw",
      height: "100dvh",
      maxWidth: "100vw",
      maxHeight: "100dvh",
      overflow: "hidden",
      position: "relative" as const,
      background: "var(--kiosk-bg, #f7f9fc)",
    },
    stageStyle: {
      width: "100%",
      height: "100%",
      transform: "none",
      ["--kiosk-ui-scale" as string]: "1",
    },
  };
}
