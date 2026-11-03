"use client";

import { cn } from "@/lib/utils";

interface BuildingMapLoaderProps {
  className?: string;
  label?: string;
  fading?: boolean;
}

/**
 * Hexagon crystal loader — the same wireframe mark as the 3D map placeholder,
 * drawn and rotated so the wait feels like the building is assembling.
 */
export function BuildingMapLoader({
  className,
  label = "Loading the building map",
  fading = false,
}: BuildingMapLoaderProps) {
  return (
    <div
      className={cn("building-map-loader", fading && "building-map-loader-out", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="building-map-loader-stage" aria-hidden>
        <span className="building-map-loader-glow" />
        <svg className="building-map-loader-gem" viewBox="0 0 100 100">
          <g className="building-map-loader-spin">
            <polygon
              className="building-map-loader-faces"
              points="50,14 81.2,32 81.2,68 50,86 18.8,68 18.8,32"
            />
            <path
              className="building-map-loader-ribs"
              d="M50 14 L50 86 M18.8 32 L81.2 68 M81.2 32 L18.8 68"
            />
            <polygon
              className="building-map-loader-outline"
              points="50,14 81.2,32 81.2,68 50,86 18.8,68 18.8,32"
            />
            <polygon
              className="building-map-loader-trace"
              points="50,14 81.2,32 81.2,68 50,86 18.8,68 18.8,32"
            />
          </g>
        </svg>
      </div>
      <p className="building-map-loader-label">{label}</p>
      <div className="building-map-loader-dots" aria-hidden>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
