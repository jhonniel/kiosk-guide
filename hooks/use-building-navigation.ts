"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useOffline } from "@/components/providers/offline-provider";
import { navigateBuildingOffline } from "@/features/offline/navigation-client";
import type { Language } from "@/lib/i18n/translations";
import type {
  NavigationGraph,
  NavigationResponse,
  NavigationRoute,
  NavigationStatus,
} from "@/features/building-directory/navigation/types";
import { interpolateAlongPath } from "@/features/building-directory/navigation/routing-engine";

interface UseBuildingNavigationOptions {
  graph: NavigationGraph | null;
  accessible?: boolean;
  lang?: Language;
  onArrived?: () => void;
}

export function useBuildingNavigation({
  graph,
  accessible = false,
  lang = "en",
  onArrived,
}: UseBuildingNavigationOptions) {
  const [status, setStatus] = useState<NavigationStatus>("idle");
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [instructionIndex, setInstructionIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [textOnly, setTextOnly] = useState(false);
  const [textDirections, setTextDirections] = useState<string[]>([]);

  const { offlineData } = useOffline();
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedProgressRef = useRef(0);
  const statusRef = useRef<NavigationStatus>("idle");
  const routeRef = useRef<NavigationRoute | null>(null);
  const onArrivedRef = useRef(onArrived);
  const progressRef = useRef(0);
  const floorRef = useRef(1);
  const instructionRef = useRef(0);
  const lastProgressPctRef = useRef(-1);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  useEffect(() => {
    onArrivedRef.current = onArrived;
  }, [onArrived]);

  const cancelAnimation = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  const startNavigation = useCallback(
    async (toLocationId: string, fromLocationId?: string) => {
      cancelAnimation();
      setStatus("idle");
      statusRef.current = "idle";
      setError(null);
      setProgress(0);
      progressRef.current = 0;
      lastProgressPctRef.current = -1;
      setInstructionIndex(0);
      instructionRef.current = 0;

      let data: NavigationResponse;

      if (offlineData) {
        data = navigateBuildingOffline(
          { toLocationId, fromLocationId, accessible, lang },
          offlineData
        );
      } else {
        const res = await fetch("/api/building-directory/navigate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toLocationId, fromLocationId, accessible, lang }),
        });
        data = await res.json();
      }

      setIsDemoMode(data.isDemoMode ?? false);

      if (data.textOnly) {
        setTextOnly(true);
        setTextDirections(data.textDirections ?? []);
        if (data.error) setError(data.error);
        return data;
      }

      setTextOnly(false);

      if (!data.success || !data.route) {
        setError(data.error ?? "Navigation unavailable.");
        setStatus("error");
        statusRef.current = "error";
        if (data.textDirections) {
          setTextDirections(data.textDirections);
          setTextOnly(true);
        }
        return data;
      }

      const startFloor = data.route.segments[0]?.floor ?? 1;
      setRoute(data.route);
      floorRef.current = startFloor;
      setCurrentFloor(startFloor);
      setStatus("navigating");
      statusRef.current = "navigating";
      startTimeRef.current = performance.now();
      pausedProgressRef.current = 0;

      return data;
    },
    [accessible, lang, cancelAnimation, offlineData]
  );

  useEffect(() => {
    const tick = (timestamp: number) => {
      const currentRoute = routeRef.current;
      if (statusRef.current !== "navigating" || !currentRoute) return;

      const durationMs = Math.max(currentRoute.estimatedMinutes * 60 * 1000, 8000);
      const elapsed = timestamp - startTimeRef.current;
      const newProgress = Math.min(pausedProgressRef.current + elapsed / durationMs, 1);
      progressRef.current = newProgress;

      const progressPct = Math.floor(newProgress * 100);
      if (progressPct !== lastProgressPctRef.current) {
        lastProgressPctRef.current = progressPct;
        setProgress(newProgress);
      }

      const segProgress = newProgress * currentRoute.segments.length;
      const segIdx = Math.min(Math.floor(segProgress), currentRoute.segments.length - 1);
      const segment = currentRoute.segments[segIdx];
      if (segment && segment.floor !== floorRef.current) {
        floorRef.current = segment.floor;
        setCurrentFloor(segment.floor);
      }

      const instructionCount = currentRoute.voiceInstructions.length;
      const nextInstruction = Math.min(
        Math.floor(newProgress * instructionCount),
        instructionCount - 1
      );
      if (nextInstruction !== instructionRef.current) {
        instructionRef.current = nextInstruction;
        setInstructionIndex(nextInstruction);
      }

      if (newProgress >= 1) {
        setStatus("arrived");
        statusRef.current = "arrived";
        progressRef.current = 1;
        setProgress(1);
        onArrivedRef.current?.();
        return;
      }

      animRef.current = requestAnimationFrame(tick);
    };

    if (status === "navigating" && route && !textOnly) {
      startTimeRef.current = performance.now();
      animRef.current = requestAnimationFrame(tick);
    }

    return cancelAnimation;
  }, [status, route, textOnly, cancelAnimation]);

  const pause = useCallback(() => {
    if (statusRef.current !== "navigating") return;
    pausedProgressRef.current = progressRef.current;
    cancelAnimation();
    setStatus("paused");
    statusRef.current = "paused";
  }, [cancelAnimation]);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") return;
    setStatus("navigating");
    statusRef.current = "navigating";
    startTimeRef.current = performance.now();
  }, []);

  const cancel = useCallback(() => {
    cancelAnimation();
    setStatus("idle");
    statusRef.current = "idle";
    setRoute(null);
    routeRef.current = null;
    setProgress(0);
    progressRef.current = 0;
    lastProgressPctRef.current = -1;
    setError(null);
    setTextDirections([]);
    setTextOnly(false);
  }, [cancelAnimation]);

  const getCurrentPosition = useCallback(() => {
    const currentRoute = routeRef.current;
    if (!currentRoute || !graph) return null;
    const segment =
      currentRoute.segments.find((s) => s.floor === floorRef.current) ??
      currentRoute.segments[0];
    if (!segment) return null;
    const floorIdx = currentRoute.segments.indexOf(segment);
    const localProgress = Math.max(
      0,
      Math.min(1, progressRef.current * currentRoute.segments.length - floorIdx)
    );
    return interpolateAlongPath(segment.points, localProgress);
  }, [graph]);

  return {
    status,
    route,
    progress,
    progressRef,
    currentFloor,
    currentInstruction: route?.voiceInstructions[instructionIndex] ?? null,
    instructionIndex,
    error,
    isDemoMode,
    textOnly,
    textDirections,
    graph,
    startNavigation,
    pause,
    resume,
    cancel,
    setCurrentFloor,
    getCurrentPosition,
  };
}
