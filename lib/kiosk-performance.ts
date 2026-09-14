/** True when tuned for low-end kiosk hardware (e.g. i5 3rd gen / 4 GB RAM). */
export function isLowPowerKiosk(): boolean {
  const flag = process.env.NEXT_PUBLIC_KIOSK_LOW_POWER;
  if (flag === "0" || flag === "false") return false;
  if (flag === "1" || flag === "true") return true;
  // Default on — set NEXT_PUBLIC_KIOSK_LOW_POWER=0 on powerful dev machines.
  return true;
}

/** True when the kiosk UI is served from localhost or a private LAN address. */
export function isLocalKioskHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return true;
  return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host);
}

/** Skip heavy assets and background work during local dev or on low-end kiosks. */
export function shouldLightLoad(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  if (isLowPowerKiosk()) return true;
  if (isLocalKioskHost()) return true;
  return false;
}

export function getQuickStartPollMs(): number {
  return shouldLightLoad() ? 30_000 : 5_000;
}

export function scheduleWhenIdle(task: () => void, timeoutMs = 4000) {
  if (typeof window === "undefined") return () => undefined;

  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(task, { timeout: timeoutMs });
    return () => window.cancelIdleCallback(id);
  }

  const timer = window.setTimeout(task, Math.min(timeoutMs, 2000));
  return () => window.clearTimeout(timer);
}
