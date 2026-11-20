import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { ExpirationPlugin, NetworkFirst, Serwist, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const FRESH_PATHS = [
  "/kiosk-offline-data.json",
  "/kiosk-citizens-charter.json",
  "/api/kiosk/offline-data",
  "/api/kiosk/citizens-charter",
];

function shouldLoadFresh(pathname: string) {
  return FRESH_PATHS.includes(pathname) || pathname.startsWith("/images/");
}

// Registered before the precache handler so a replaced photo or a removed spot is not served from an old copy.
self.addEventListener("fetch", (event) => {
  const pathname = new URL(event.request.url).pathname;
  if (!shouldLoadFresh(pathname)) return;
  event.stopImmediatePropagation();
  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(event.request, { cache: "no-store" });
        if (fresh.ok) return fresh;
      } catch {
        // Use the saved copy when the kiosk has no connection.
      }
      const cached = await caches.match(event.request);
      if (cached) return cached;
      return fetch(event.request);
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const windows = await self.clients.matchAll({ type: "window" });
      await Promise.all(
        windows.map((client) => (client.navigate ? client.navigate(client.url) : Promise.resolve()))
      );
    })()
  );
});

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
      matcher: ({ url }) =>
        url.pathname === "/kiosk-offline-data.json" ||
        url.pathname === "/kiosk-citizens-charter.json",
      handler: new NetworkFirst({
        cacheName: "kiosk-offline-bundle",
        networkTimeoutSeconds: 4,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 4,
            maxAgeSeconds: 60 * 60 * 24 * 7,
          }),
        ],
      }),
    },
    {
      matcher: ({ url }) => url.pathname.startsWith("/images/"),
      handler: new NetworkFirst({
        cacheName: "kiosk-static-assets",
        networkTimeoutSeconds: 4,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 80,
            maxAgeSeconds: 60 * 60 * 24 * 7,
          }),
        ],
      }),
    },
    {
      // Never cache huge promo videos in the service worker.
      matcher: ({ url }) => url.pathname.startsWith("/videos/"),
      handler: new NetworkFirst({
        cacheName: "kiosk-videos",
        networkTimeoutSeconds: 8,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 2,
            maxAgeSeconds: 60 * 60 * 24,
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
            maxEntries: 24,
            maxAgeSeconds: 60 * 60 * 24 * 14,
          }),
        ],
      }),
    },
    {
      matcher: ({ url }) =>
        url.pathname === "/api/kiosk/offline-data" ||
        url.pathname === "/api/kiosk/citizens-charter",
      handler: new NetworkFirst({
        cacheName: "kiosk-offline-data",
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 4,
            maxAgeSeconds: 60 * 60 * 24,
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
