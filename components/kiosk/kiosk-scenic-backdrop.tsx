"use client";

import { useEffect, useState } from "react";
import { resolveKioskAssetUrl } from "@/lib/kiosk-sync-url";

/** Shared flush top-right scenic used on Home + Citizens' Charter. */
export function KioskScenicBackdrop({
  imageUrl,
}: {
  imageUrl: string;
}) {
  const assetUrl = resolveKioskAssetUrl(imageUrl);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadFullImage = () => {
      const img = new window.Image();
      img.src = assetUrl;
      img.onload = () => {
        if (!cancelled) setLoadedUrl(assetUrl);
      };
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(loadFullImage, { timeout: 1500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timer = window.setTimeout(loadFullImage, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [assetUrl, imageUrl]);

  return (
    <div
      className="pointer-events-none absolute top-0 right-0 z-0 h-[18rem] w-[min(72%,48rem)] sm:h-[20rem]"
      aria-hidden
    >
      <div
        className="absolute inset-0 bg-cover bg-[center_top] transition-opacity duration-500"
        style={{
          backgroundImage: loadedUrl ? `url(${loadedUrl})` : undefined,
          opacity: loadedUrl ? 1 : 0,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-kiosk-bg from-[6%] via-kiosk-bg/70 via-[40%] to-transparent to-[72%]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-kiosk-bg to-transparent" />
    </div>
  );
}
