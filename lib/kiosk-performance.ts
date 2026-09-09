/** True when tuned for low-end kiosk hardware (e.g. i5 3rd gen / 4 GB RAM). */
export function isLowPowerKiosk(): boolean {
  const flag = process.env.NEXT_PUBLIC_KIOSK_LOW_POWER;
  if (flag === "0" || flag === "false") return false;
  if (flag === "1" || flag === "true") return true;
  // Default on — set NEXT_PUBLIC_KIOSK_LOW_POWER=0 on powerful dev machines.
  return true;
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
