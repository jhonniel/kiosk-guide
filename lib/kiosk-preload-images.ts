import {
  resolveBrandingCaringLogoUrl,
  resolveBrandingFooterImageUrl,
  resolveBrandingLogoUrl,
} from "@/lib/branding";
import { CHARTER_SCENIC_IMAGE } from "@/features/citizens-charter/ui-catalog";
import type { KioskOfflineData } from "@/features/offline/types";
import { resolveKioskAssetUrl } from "@/lib/kiosk-sync-url";

const CAMI_BADGE_URL = "/images/cami/cami-badge-solid.jpg";

const preloaded = new Set<string>();

function addImageUrl(urls: Set<string>, raw: string | null | undefined) {
  if (!raw?.trim()) return;
  urls.add(resolveKioskAssetUrl(raw.trim()));
}

/** Collect every kiosk image URL from the offline bundle for eager startup loading. */
export function collectKioskStartupImageUrls(data: KioskOfflineData): string[] {
  const urls = new Set<string>();

  addImageUrl(urls, CHARTER_SCENIC_IMAGE);
  addImageUrl(urls, CAMI_BADGE_URL);

  const settings = data.settings ?? {};
  addImageUrl(urls, resolveBrandingLogoUrl(settings));
  addImageUrl(urls, resolveBrandingCaringLogoUrl(settings));
  addImageUrl(urls, resolveBrandingFooterImageUrl(settings));

  for (const card of data.homepageCards ?? []) {
    addImageUrl(urls, card.iconUrl);
  }

  for (const item of data.announcements ?? []) {
    addImageUrl(urls, item.imageUrl);
  }

  for (const item of data.tourism ?? []) {
    addImageUrl(urls, item.imageUrl);
  }

  for (const plan of data.navigationGraph?.floorPlans ?? []) {
    addImageUrl(urls, plan.imageUrl);
  }

  for (const building of data.indoorMap?.buildings ?? []) {
    for (const floor of building.floors ?? []) {
      addImageUrl(urls, floor.assetUrl);
    }
  }

  return [...urls];
}

export function preloadKioskImages(urls: string[]) {
  if (typeof window === "undefined") return;

  for (const url of urls) {
    if (preloaded.has(url)) continue;
    preloaded.add(url);

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = url;
    document.head.appendChild(link);

    const img = new window.Image();
    img.decoding = "async";
    img.src = url;
  }
}

export function preloadKioskOfflineImages(data: KioskOfflineData) {
  preloadKioskImages(collectKioskStartupImageUrls(data));
}
