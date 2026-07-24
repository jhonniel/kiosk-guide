"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const GUARD_KEY = "kioskBlockSwipeBack";

/**
 * Disables browser swipe-to-go-back / edge-swipe history navigation
 * across the kiosk (Chrome, Safari, Edge, Android WebView).
 */
export function KioskSwipeBackGuard() {
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("kiosk-no-swipe-back");

    const arm = () => {
      const state = window.history.state;
      if (state && typeof state === "object" && GUARD_KEY in state) return;
      window.history.pushState(
        { ...(typeof state === "object" && state ? state : {}), [GUARD_KEY]: true },
        "",
        window.location.href
      );
    };

    arm();

    const onPopState = () => {
      // Re-seat history so swipe-back / browser-back cannot leave the current screen.
      window.history.pushState({ [GUARD_KEY]: true }, "", window.location.href);
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      html.classList.remove("kiosk-no-swipe-back");
      window.removeEventListener("popstate", onPopState);
    };
  }, [pathname]);

  return null;
}
