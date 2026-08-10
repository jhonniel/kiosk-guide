"use client";

import { useEffect, useState, type CSSProperties } from "react";

/**
 * Design reference for kiosk chrome. Larger viewports scale the whole UI up
 * so touch targets and type don't look "zoomed out" on big panels / TVs.
 */
const REF_WIDTH = 1280;
const REF_HEIGHT = 800;
const MIN_SCALE = 1;
const MAX_SCALE = 1.65;

function computeKioskUiScale(width: number, height: number) {
  const next = Math.min(width / REF_WIDTH, height / REF_HEIGHT);
  return Math.round(Math.min(Math.max(next, MIN_SCALE), MAX_SCALE) * 1000) / 1000;
}

/** Returns CSS vars for the kiosk scale stage (see `.kiosk-ui-scale-*` in globals.css). */
export function useKioskUiScale(): CSSProperties {
  const [scale, setScale] = useState(() =>
    typeof window === "undefined" ? 1 : computeKioskUiScale(window.innerWidth, window.innerHeight)
  );

  useEffect(() => {
    const update = () => {
      setScale(computeKioskUiScale(window.innerWidth, window.innerHeight));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return {
    ["--kiosk-ui-scale" as string]: String(scale),
  };
}
