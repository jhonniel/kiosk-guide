"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type TapRipple = {
  id: number;
  x: number;
  y: number;
};

const MAX_RIPPLES = 8;
const RIPPLE_MS = 520;

export function KioskTapFeedback() {
  const [ripples, setRipples] = useState<TapRipple[]>([]);

  useEffect(() => {
    let nextId = 1;

    const onPointerDown = (event: PointerEvent) => {
      // Only show feedback for primary touch / mouse / pen presses.
      if (event.pointerType === "mouse" && event.button !== 0) return;

      const id = nextId++;
      const ripple: TapRipple = { id, x: event.clientX, y: event.clientY };

      setRipples((prev) => [...prev.slice(-(MAX_RIPPLES - 1)), ripple]);
      window.setTimeout(() => {
        setRipples((prev) => prev.filter((item) => item.id !== id));
      }, RIPPLE_MS);
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  if (!ripples.length) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[200]" aria-hidden="true">
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className={cn(
            "kiosk-tap-ripple absolute block size-10 rounded-full",
            "bg-white/35 ring-2 ring-white/50"
          )}
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}
    </div>
  );
}
