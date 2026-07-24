"use client";

import { useCallback, useRef } from "react";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

const TARGET_SCALE = 2.35;

/**
 * Cinematic fly-to using react-zoom-pan-pinch setTransform.
 * Coordinates are percent (0–100) within the map content box.
 */
export function useMapCamera() {
  const apiRef = useRef<ReactZoomPanPinchRef | null>(null);

  const setApi = useCallback((api: ReactZoomPanPinchRef | null) => {
    apiRef.current = api;
  }, []);

  const flyTo = useCallback((xPercent: number, yPercent: number, scale = TARGET_SCALE) => {
    const api = apiRef.current;
    if (!api?.instance?.wrapperComponent || !api.instance.contentComponent) return;

    const wrapper = api.instance.wrapperComponent;
    const content = api.instance.contentComponent;
    const w = wrapper.clientWidth;
    const h = wrapper.clientHeight;
    const cw = content.clientWidth;
    const ch = content.clientHeight;
    if (!w || !h || !cw || !ch) return;

    // Prefer the island stage (aspect box) when sea is full-bleed around it
    const stage = content.querySelector("[data-map-stage]") as HTMLElement | null;
    const stageW = stage?.clientWidth || cw;
    const stageH = stage?.clientHeight || ch;
    const stageLeft = stage?.offsetLeft ?? 0;
    const stageTop = stage?.offsetTop ?? 0;

    const px = stageLeft + (xPercent / 100) * stageW;
    const py = stageTop + (yPercent / 100) * stageH;
    const nextX = w / 2 - px * scale;
    const nextY = h / 2 - py * scale;

    api.setTransform(nextX, nextY, scale, 700, "easeOutCubic");
  }, []);

  const resetView = useCallback(() => {
    apiRef.current?.resetTransform(500, "easeOutCubic");
  }, []);

  return { setApi, flyTo, resetView, apiRef };
}
