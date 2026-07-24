"use client";

import { useEffect } from "react";

const VIEWPORT_LOCKED =
  "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";

function ensureViewportMeta() {
  let meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "viewport";
    document.head.appendChild(meta);
  }
  return meta;
}

function isZoomSurfaceTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("canvas") ||
      target.closest("[data-kiosk-zoom-surface]")
  );
}

/**
 * Locks browser/page pinch-zoom everywhere.
 * Pinch/wheel zoom is only allowed on marked surfaces (3D canvas, island map).
 */
export function KioskZoomGuard() {
  useEffect(() => {
    const meta = ensureViewportMeta();
    meta.setAttribute("content", VIEWPORT_LOCKED);
    document.documentElement.classList.add("kiosk-zoom-locked");
    document.documentElement.classList.remove("kiosk-zoom-allowed", "kiosk-interactive-zoom");

    const preventGesture = (event: Event) => {
      if (isZoomSurfaceTarget(event.target)) return;
      event.preventDefault();
    };

    const preventCtrlWheelZoom = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      if (isZoomSurfaceTarget(event.target)) return;
      event.preventDefault();
    };

    const preventTouchPinch = (event: TouchEvent) => {
      if (event.touches.length < 2) return;
      if (isZoomSurfaceTarget(event.target)) return;
      event.preventDefault();
    };

    document.addEventListener("gesturestart", preventGesture, { passive: false });
    document.addEventListener("gesturechange", preventGesture, { passive: false });
    document.addEventListener("gestureend", preventGesture, { passive: false });
    document.addEventListener("wheel", preventCtrlWheelZoom, { passive: false });
    document.addEventListener("touchmove", preventTouchPinch, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      document.removeEventListener("wheel", preventCtrlWheelZoom);
      document.removeEventListener("touchmove", preventTouchPinch);
    };
  }, []);

  return null;
}
