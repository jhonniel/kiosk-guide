"use client";

import { Compass as CompassIcon } from "lucide-react";

export function Compass() {
  return (
    <div
      className="pointer-events-none flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/80 shadow-lg backdrop-blur-md"
      aria-label="North"
      title="North"
    >
      <div className="relative flex h-9 w-9 items-center justify-center">
        <CompassIcon className="h-7 w-7 text-kiosk-navy" />
        <span className="absolute top-0 text-[9px] font-black text-rose-600">N</span>
      </div>
    </div>
  );
}
