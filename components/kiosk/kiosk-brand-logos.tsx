"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_CARING_CAMIGUIN_LOGO_URL,
  resolveBrandingCaringLogoUrl,
  resolveBrandingLogoUrl,
} from "@/lib/branding";
import { scheduleWhenIdle, shouldLightLoad } from "@/lib/kiosk-performance";
import { cn } from "@/lib/utils";
import { resolveKioskAssetUrl } from "@/lib/kiosk-sync-url";

type KioskBrandLogosProps = {
  settings?: Record<string, string>;
  variant: "sidebar" | "cover";
  className?: string;
};

function BrandLogoPlaceholder({ className }: { className?: string }) {
  return <div className={cn("bg-white/10", className)} aria-hidden />;
}

/** Sidebar: seal with Caring Camiguin stacked below. Cover: logos side by side. */
export function KioskBrandLogos({ settings = {}, variant, className }: KioskBrandLogosProps) {
  const sealUrl = resolveBrandingLogoUrl(settings);
  const caringUrl = resolveBrandingCaringLogoUrl(settings);
  const [showImages, setShowImages] = useState(!shouldLightLoad());

  useEffect(() => {
    if (showImages) return;
    return scheduleWhenIdle(() => setShowImages(true), 1500);
  }, [showImages]);

  if (variant === "cover") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="relative h-[5.75rem] w-[5.75rem] shrink-0 overflow-hidden rounded-full shadow-[0_6px_20px_rgba(15,35,70,0.45)]">
          {showImages ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveKioskAssetUrl(sealUrl)}
              alt="Provincial Government of Camiguin"
              className="h-full w-full scale-[1.12] object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <BrandLogoPlaceholder className="h-full w-full rounded-full" />
          )}
        </div>
        <div className="relative h-[4.5rem] w-[5.5rem] shrink-0">
          {showImages ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveKioskAssetUrl(caringUrl)}
              alt="Caring Camiguin"
              className="h-full w-full object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <BrandLogoPlaceholder className="h-full w-full" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex shrink-0 flex-col items-center gap-1.5", className)}>
      <div className="relative h-[66px] w-[66px] shrink-0 overflow-hidden rounded-full bg-white/5">
        {showImages ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveKioskAssetUrl(sealUrl)}
            alt="Government logo"
            className="h-full w-full object-contain p-0.5"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <BrandLogoPlaceholder className="h-full w-full rounded-full" />
        )}
      </div>
      <div className="relative h-[52px] w-[58px] shrink-0">
        {showImages ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveKioskAssetUrl(caringUrl)}
            alt="Caring Camiguin"
            className="h-full w-full object-contain"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <BrandLogoPlaceholder className="h-full w-full" />
        )}
      </div>
    </div>
  );
}

export { DEFAULT_CARING_CAMIGUIN_LOGO_URL };
