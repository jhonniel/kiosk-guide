"use client";

import { useEffect } from "react";

const RIPPLE_MS = 520;
const RIPPLE_SIZE = 40;

/**
 * Draw ripples on document.body at raw clientX/Y.
 * Must NOT live inside `.kiosk-ui-scale-stage` (transform breaks fixed coords).
 */
export function KioskTapFeedback() {
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      const el = document.createElement("span");
      el.className = "kiosk-tap-ripple";
      el.setAttribute("aria-hidden", "true");
      el.style.cssText = [
        "position:fixed",
        `left:${event.clientX}px`,
        `top:${event.clientY}px`,
        `width:${RIPPLE_SIZE}px`,
        `height:${RIPPLE_SIZE}px`,
        `margin-left:-${RIPPLE_SIZE / 2}px`,
        `margin-top:-${RIPPLE_SIZE / 2}px`,
        "border-radius:9999px",
        "pointer-events:none",
        "z-index:2147483646",
        "background:rgba(255,255,255,0.35)",
        "box-shadow:0 0 0 2px rgba(255,255,255,0.5)",
      ].join(";");

      document.body.appendChild(el);
      window.setTimeout(() => el.remove(), RIPPLE_MS);
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return null;
}
