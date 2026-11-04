"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

/** Matches --kiosk-lowered-top in globals.css. */
const LOWERED_SHARE = 0.32;
const SLIDE_MS = 460;
const SLIDE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Wheelchair mode moves the stage down. The layout switches in one step and the stage then
 * glides from where it was (transform only), so cards and the 3D map never re-lay out mid-animation.
 * The banner stays mounted while it slides out.
 */
export function useLoweredStage(lowered: boolean, stageRef: RefObject<HTMLDivElement | null>) {
  const [bannerMounted, setBannerMounted] = useState(lowered);
  const [bannerLeaving, setBannerLeaving] = useState(false);
  const firstRun = useRef(true);

  useLayoutEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const stage = stageRef.current;
    if (!stage || prefersReducedMotion()) return;
    const offset = window.innerHeight * LOWERED_SHARE;
    stage.animate(
      [
        { transform: `translateY(${lowered ? -offset : offset}px)` },
        { transform: "translateY(0)" },
      ],
      { duration: SLIDE_MS, easing: SLIDE_EASING }
    );
  }, [lowered, stageRef]);

  useEffect(() => {
    if (lowered) {
      setBannerMounted(true);
      setBannerLeaving(false);
      return;
    }
    if (!bannerMounted) return;
    setBannerLeaving(true);
    const timer = window.setTimeout(
      () => {
        setBannerMounted(false);
        setBannerLeaving(false);
      },
      prefersReducedMotion() ? 0 : SLIDE_MS
    );
    return () => window.clearTimeout(timer);
  }, [lowered, bannerMounted]);

  return { bannerMounted, bannerLeaving };
}
