"use client";

import { useEffect } from "react";

const DEV_SW_CLEARED = "kiosk-dev-sw-cleared";

/** A worker left over from a production build keeps serving its cached pages in dev. */
async function removeServiceWorkers() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  const hadController = Boolean(navigator.serviceWorker.controller);
  await Promise.all(registrations.map((registration) => registration.unregister()));
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
  if (hadController && !sessionStorage.getItem(DEV_SW_CLEARED)) {
    sessionStorage.setItem(DEV_SW_CLEARED, "1");
    window.location.reload();
  }
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "development") {
      void removeServiceWorkers().catch(() => {
        // Nothing to clean up.
      });
      return;
    }

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Service worker registration is optional when /sw.js is unavailable.
    });
  }, []);

  return null;
}
