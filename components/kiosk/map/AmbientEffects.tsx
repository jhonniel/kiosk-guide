"use client";

import { memo } from "react";

type Props = {
  nightMode?: boolean;
};

/** Paper grain, sun rays, and soft watercolor shimmer — map stage only. */
export const AmbientEffects = memo(function AmbientEffects({ nightMode = false }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden>
      <div
        className={`map-ocean-sheen absolute inset-0 ${nightMode ? "opacity-[0.08]" : "opacity-[0.14]"}`}
      />
      <div
        className={`map-sun-rays absolute -right-[8%] -top-[6%] h-[42%] w-[42%] rounded-full ${
          nightMode ? "opacity-20" : "opacity-35"
        }`}
      />
      <div
        className={`map-watercolor-paper absolute inset-0 ${nightMode ? "opacity-[0.14]" : "opacity-[0.22]"}`}
      />
      <div
        className={`map-watercolor-vignette absolute inset-0 ${nightMode ? "opacity-50" : "opacity-70"}`}
        style={{
          background:
            "radial-gradient(ellipse at 50% 48%, transparent 55%, rgba(12, 74, 110, 0.22) 100%)",
        }}
      />
    </div>
  );
});
