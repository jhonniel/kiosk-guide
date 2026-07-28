"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavigationGraph, NavigationRoute } from "@/features/building-directory/navigation/types";
import { interpolateAlongPath } from "@/features/building-directory/navigation/routing-engine";
import { getLandmarkNodesForFloor, getRoomNodesForFloor } from "@/features/building-directory/navigation/demo-graph";

interface FloorPlanViewerProps {
  graph: NavigationGraph;
  route: NavigationRoute | null;
  currentFloor: number;
  progress: number;
  destinationNodeId?: string;
  isNavigating: boolean;
  hasArrived: boolean;
  isDemoMode: boolean;
  onFloorChange: (floor: number) => void;
  browseMode?: boolean;
  className?: string;
}

export function FloorPlanViewer({
  graph,
  route,
  currentFloor,
  progress,
  destinationNodeId,
  isNavigating,
  hasArrived,
  isDemoMode,
  onFloorChange,
  browseMode = false,
  className,
}: FloorPlanViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const floorPlan = graph.floorPlans.find((f) => f.floor === currentFloor);
  const rooms = useMemo(() => getRoomNodesForFloor(graph, currentFloor), [graph, currentFloor]);
  const landmarks = useMemo(() => getLandmarkNodesForFloor(graph, currentFloor), [graph, currentFloor]);

  const activeSegment = route?.segments.find((s) => s.floor === currentFloor);
  const pathD = activeSegment
    ? activeSegment.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    : "";

  const indicatorPos = useMemo(() => {
    if (!activeSegment || !isNavigating) return null;
    const floorIdx = route?.segments.indexOf(activeSegment) ?? 0;
    const localProgress = route
      ? Math.max(0, Math.min(1, progress * route.segments.length - floorIdx))
      : 0;
    return interpolateAlongPath(activeSegment.points, localProgress);
  }, [activeSegment, isNavigating, progress, route]);

  const destNode = destinationNodeId
    ? graph.nodes.find((n) => n.id === destinationNodeId || n.locationId === destinationNodeId)
    : route
      ? graph.nodes.find((n) => n.id === route.toNodeId)
      : null;

  useEffect(() => {
    if (browseMode && destNode) {
      onFloorChange(destNode.floor);
    }
  }, [browseMode, destNode?.id, destNode?.floor, onFloorChange]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pan]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setPan({
      x: dragRef.current.panX + (e.clientX - dragRef.current.x) / zoom,
      y: dragRef.current.panY + (e.clientY - dragRef.current.y) / zoom,
    });
  }, [zoom]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  if (!floorPlan) return null;

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md", className)}>
      <div className="flex items-center justify-between border-b bg-kiosk-bg px-4 py-2">
        <div className="flex gap-1">
          {graph.floorPlans.map((f) => (
            <button
              key={f.floor}
              type="button"
              onClick={() => onFloorChange(f.floor)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                currentFloor === f.floor
                  ? "bg-kiosk-navy text-white"
                  : "bg-white text-kiosk-navy hover:bg-gray-100"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
            className="rounded-lg p-1.5 hover:bg-gray-200"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))}
            className="rounded-lg p-1.5 hover:bg-gray-200"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isDemoMode && (
        <div className="bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-700">
          Demo floor plan — navigation uses demonstration data
        </div>
      )}

      <div
        className="relative cursor-grab overflow-hidden bg-[#f4f7fb] active:cursor-grabbing"
        style={{ height: browseMode ? "min(42vh, 420px)" : "min(32vh, 320px)" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <svg
          viewBox={`0 0 ${floorPlan.width} ${floorPlan.height}`}
          className="h-full w-full"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: "center center",
          }}
        >
          {floorPlan.hallways.map((h, i) => (
            <rect
              key={i}
              x={h.x}
              y={h.y}
              width={h.width}
              height={h.height}
              fill="#dce8f5"
              rx={4}
            />
          ))}

          {rooms.map((room) => {
            const isDest = destNode?.id === room.id;
            const isRoom = room.type === "room";
            const isHighlighted = browseMode && isDest;
            return (
              <g key={room.id}>
                <rect
                  x={room.x - (isRoom ? 28 : 20)}
                  y={room.y - (isRoom ? 18 : 14)}
                  width={isRoom ? 56 : 40}
                  height={isRoom ? 36 : 28}
                  rx={6}
                  fill={
                    isDest && hasArrived
                      ? "#22c55e"
                      : isHighlighted
                        ? "#fef08a"
                        : "#ffffff"
                  }
                  stroke={isHighlighted || isDest ? "#22c55e" : "#94a3b8"}
                  strokeWidth={isHighlighted || isDest ? 2.5 : 1}
                  className={cn(isDest && hasArrived && "animate-pulse")}
                />
                <text
                  x={room.x}
                  y={room.y + 4}
                  textAnchor="middle"
                  className="fill-kiosk-navy font-semibold"
                  style={{ fontSize: isRoom ? 9 : 7 }}
                >
                  {isRoom ? room.label.replace("Room ", "R") : room.label.split(" ")[0]}
                </text>
              </g>
            );
          })}

          {landmarks.map((lm) => (
            <g key={lm.id}>
              <circle
                cx={lm.x}
                cy={lm.y}
                r={browseMode ? 6 : 5}
                fill={
                  lm.type === "elevator"
                    ? "#7c3aed"
                    : lm.type === "staircase"
                      ? "#f97316"
                      : lm.type === "entrance"
                        ? "#22c55e"
                        : "#0d9488"
                }
                opacity={0.9}
              />
              {browseMode && (
                <text
                  x={lm.x}
                  y={lm.y - 10}
                  textAnchor="middle"
                  className="fill-kiosk-navy font-medium"
                  style={{ fontSize: 7 }}
                >
                  {lm.label.length > 14 ? lm.label.split(" ")[0] : lm.label}
                </text>
              )}
            </g>
          ))}

          {pathD && isNavigating && (
            <>
              <path
                d={pathD}
                fill="none"
                stroke="#22c55e"
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.35}
              />
              <path
                d={pathD}
                fill="none"
                stroke="#22c55e"
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="8 6"
                className="animate-[dash_1s_linear_infinite]"
              />
            </>
          )}

          {indicatorPos && isNavigating && !hasArrived && (
            <g>
              <circle cx={indicatorPos.x} cy={indicatorPos.y} r={12} fill="#22c55e" opacity={0.25}>
                <animate attributeName="r" values="10;16;10" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx={indicatorPos.x} cy={indicatorPos.y} r={7} fill="#22c55e" stroke="#fff" strokeWidth={2} />
              <polygon
                points={`${indicatorPos.x},${indicatorPos.y - 5} ${indicatorPos.x + 4},${indicatorPos.y + 3} ${indicatorPos.x - 4},${indicatorPos.y + 3}`}
                fill="#ffffff"
              />
            </g>
          )}

          {(destNode && destNode.floor === currentFloor && (isNavigating || browseMode)) && (
            <g transform={`translate(${destNode.x}, ${destNode.y - 20})`}>
              <path
                d="M6 0C2.7 0 0 2.7 0 6c0 4.5 6 10 6 10s6-5.5 6-10c0-3.3-2.7-6-6-6z"
                fill="#ef4444"
                transform="translate(-6, -14) scale(0.9)"
              />
            </g>
          )}
        </svg>
      </div>

      {route && isNavigating && (
        <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-gray-500">
          <span>~{route.totalDistanceMeters}m · ~{route.estimatedMinutes} min</span>
          <span>{Math.round(progress * 100)}% complete</span>
        </div>
      )}
    </div>
  );
}
