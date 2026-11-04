"use client";

import { useOffline } from "@/components/providers/offline-provider";
import { resolveBrandingLogoUrl } from "@/lib/branding";
import { resolveKioskAssetUrl } from "@/lib/kiosk-sync-url";
import { cn } from "@/lib/utils";

interface BuildingMapLoaderProps {
  className?: string;
  label?: string;
  fading?: boolean;
}

/** System logo with a turning ring while the 3D building map loads. */
export function BuildingMapLoader({
  className,
  label = "Loading the building map",
  fading = false,
}: BuildingMapLoaderProps) {
  const { offlineData } = useOffline();
  const logoUrl = resolveKioskAssetUrl(resolveBrandingLogoUrl(offlineData?.settings ?? {}));

  return (
    <div
      className={cn("building-map-loader", fading && "building-map-loader-out", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="building-map-loader-stage" aria-hidden>
        <span className="building-map-loader-glow" />
        <svg className="building-map-loader-ring" viewBox="0 0 100 100">
          <circle className="building-map-loader-track" cx="50" cy="50" r="46" />
          <circle className="building-map-loader-arc" cx="50" cy="50" r="46" />
        </svg>
        <div className="building-map-loader-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="" loading="eager" decoding="async" />
        </div>
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
