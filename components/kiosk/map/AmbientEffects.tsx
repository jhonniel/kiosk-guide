"use client";

import { memo } from "react";

type Props = {
  nightMode?: boolean;
};

/** Very light ambient — map art already carries atmosphere. */
export const AmbientEffects = memo(function AmbientEffects({ nightMode = false }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className={`map-ocean-sheen absolute inset-0 ${nightMode ? "opacity-10" : "opacity-15"}`} />
    </div>
  );
});
