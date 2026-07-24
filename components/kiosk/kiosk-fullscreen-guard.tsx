"use client";

import { useEffect, useRef } from "react";

function getFullscreenElement() {
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? doc.msFullscreenElement ?? null;
}

function enterFullscreenNow() {
  if (getFullscreenElement()) return;

  const el = document.documentElement as HTMLElement & {
    requestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
    webkitRequestFullscreen?: () => void;
    webkitRequestFullScreen?: () => void;
    msRequestFullscreen?: () => void;
  };

  try {
    if (typeof el.requestFullscreen === "function") {
      // Must stay synchronous from the user gesture — do not await before calling.
      return el.requestFullscreen({ navigationUI: "hide" }).catch(() => {
        return el.requestFullscreen?.();
      });
    }
    if (typeof el.webkitRequestFullscreen === "function") {
      el.webkitRequestFullscreen();
      return;
    }
    if (typeof el.webkitRequestFullScreen === "function") {
      el.webkitRequestFullScreen();
      return;
    }
    if (typeof el.msRequestFullscreen === "function") {
      el.msRequestFullscreen();
    }
  } catch {
    // Ignore gesture/policy rejections; next tap will retry.
  }
}

/**
 * Any kiosk tap/click enters fullscreen.
 * After the user exits (Esc / gesture), the next tap re-enters.
 */
export function KioskFullscreenGuard() {
  const enteringRef = useRef(false);
  const cooldownUntilRef = useRef(0);

  useEffect(() => {
    const onPointerDown = () => {
      if (Date.now() < cooldownUntilRef.current) return;
      if (getFullscreenElement() || enteringRef.current) return;

      enteringRef.current = true;
      const result = enterFullscreenNow();

      if (result && typeof (result as Promise<void>).finally === "function") {
        void (result as Promise<void>).finally(() => {
          enteringRef.current = false;
          // Brief cooldown so a trailing click from the same gesture
          // cannot cancel a pending/re-entered fullscreen request.
          cooldownUntilRef.current = Date.now() + 400;
        });
        return;
      }

      // Sync webkit/ms path — release lock after the same-gesture window.
      window.setTimeout(() => {
        enteringRef.current = false;
        cooldownUntilRef.current = Date.now() + 400;
      }, 400);
    };

    const onFullscreenChange = () => {
      enteringRef.current = false;
      if (!getFullscreenElement()) {
        // Ignore residual clicks that often fire right as Esc exits fullscreen.
        cooldownUntilRef.current = Date.now() + 350;
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange as EventListener);
    document.addEventListener("MSFullscreenChange", onFullscreenChange as EventListener);

    // One listener only — pointerdown + click both firing requestFullscreen
    // races and cancels re-entry after the first Esc exit.
    window.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true });

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange as EventListener);
      document.removeEventListener("MSFullscreenChange", onFullscreenChange as EventListener);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  return null;
}
