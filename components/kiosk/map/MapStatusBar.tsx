"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";

export type MapStatusBarHandle = {
  setZoom: (scale: number) => void;
  setCursor: (x: number, y: number) => void;
};

type Props = {
  municipalityLabel: string;
  islandLabel: string;
};

export const MapStatusBar = forwardRef<MapStatusBarHandle, Props>(function MapStatusBar(
  { municipalityLabel, islandLabel },
  ref
) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [cursorPercent, setCursorPercent] = useState({ x: 50, y: 50 });
  const pendingRef = useRef<{ zoom?: number; cursor?: { x: number; y: number } }>({});
  const timerRef = useRef<number | undefined>(undefined);

  const flush = () => {
    timerRef.current = undefined;
    const pending = pendingRef.current;
    pendingRef.current = {};
    if (pending.zoom != null) setZoomLevel(pending.zoom);
    if (pending.cursor) setCursorPercent(pending.cursor);
  };

  const scheduleFlush = () => {
    if (timerRef.current != null) return;
    timerRef.current = window.setTimeout(flush, 120);
  };

  useImperativeHandle(ref, () => ({
    setZoom(scale: number) {
      pendingRef.current.zoom = scale;
      scheduleFlush();
    },
    setCursor(x: number, y: number) {
      pendingRef.current.cursor = { x, y };
      scheduleFlush();
    },
  }));

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-2 bg-slate-950/55 px-3 py-1.5 text-[10px] font-medium tracking-wide text-white/90 backdrop-blur-md">
      <span>{municipalityLabel || islandLabel}</span>
      <span>
        X {cursorPercent.x.toFixed(1)} · Y {cursorPercent.y.toFixed(1)}
      </span>
      <span>Zoom {zoomLevel.toFixed(2)}×</span>
      <span>Scale ~{(12 / zoomLevel).toFixed(1)} km</span>
    </div>
  );
});
