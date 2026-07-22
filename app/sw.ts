import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkFirst, Serwist, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const KIOSK_PATH_PREFIXES = [
  "/",
  "/building-directory",
  "/map",
  "/contact",
  "/office-hours",
  "/faq",
  "/emergency",
  "/government-directory",
  "/download-center",
  "/tourism",
  "/news",
  "/events",
  "/citizens-charter",
  "/feedback",
  "/services/",
];

function isKioskNavigation(url: URL) {
  if (url.origin !== self.location.origin) return false;
  return KIOSK_PATH_PREFIXES.some(
    (prefix) => url.pathname === prefix || url.pathname.startsWith(prefix)
  );
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.pathname === "/kiosk-offline-data.json",
      handler: new CacheFirst({
        cacheName: "kiosk-offline-bundle",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 1,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          }),
        ],
      }),
    },
    {
      matcher: ({ url }) =>
        url.pathname.startsWith("/images/") ||
        url.pathname.startsWith("/downloads/") ||
        url.pathname.startsWith("/images/branding/"),
      handler: new CacheFirst({
        cacheName: "kiosk-static-assets",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 128,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          }),
        ],
      }),
    },
    {
      matcher: ({ request, url }) => request.mode === "navigate" && isKioskNavigation(url),
      handler: new StaleWhileRevalidate({
        cacheName: "kiosk-pages",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          }),
        ],
      }),
    },
    {
      matcher: ({ url }) => url.pathname === "/api/kiosk/offline-data",
      handler: new NetworkFirst({
        cacheName: "kiosk-offline-data",
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 1,
            maxAgeSeconds: 60 * 60 * 24,
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
