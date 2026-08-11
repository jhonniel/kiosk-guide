"use client";

import { useEffect, useState } from "react";
import { KioskShell } from "@/components/kiosk/kiosk-shell";
import { KioskOfflineGate } from "@/components/kiosk/kiosk-offline-gate";
import { KioskIdleAttractLazy } from "@/components/kiosk/kiosk-idle-attract-lazy";
import { Sidebar } from "@/components/kiosk/sidebar";
import { QuickStartVisitProvider } from "@/components/kiosk/quick-start-visit-provider";
import { useKiosk } from "@/hooks/use-kiosk";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { getBoolSetting, getNumberSetting, getSetting } from "@/features/settings/resolve-settings";

interface KioskLayoutClientProps {
  children: React.ReactNode;
}

function KioskLayoutInner({ children }: KioskLayoutClientProps) {
  const { language } = useKiosk();
  const data = useKioskOfflineData();
  const settings = data.settings ?? {};
  const promoEnabled = getBoolSetting(settings, "promo_video_enabled");
  const promoVideoUrl = getSetting(settings, "promo_video_url").trim();
  const idleSeconds = getNumberSetting(settings, "promo_idle_seconds", 60);
  const countdownSeconds = getNumberSetting(settings, "promo_countdown_seconds", 10);
  const offlineAutoZoom = getBoolSetting(settings, "kiosk_auto_zoom_enabled");
  // Live admin value wins over possibly stale IndexedDB / HTTP-cached offline bundles.
  const [autoZoomEnabled, setAutoZoomEnabled] = useState(offlineAutoZoom);

  useEffect(() => {
    setAutoZoomEnabled(offlineAutoZoom);
  }, [offlineAutoZoom]);

  useEffect(() => {
    let cancelled = false;

    async function refreshDisplaySettings() {
      try {
        const res = await fetch(`/api/kiosk/display-settings?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { autoZoomEnabled?: boolean };
        if (!cancelled && typeof json.autoZoomEnabled === "boolean") {
          setAutoZoomEnabled(json.autoZoomEnabled);
        }
      } catch {
        // Keep offline/bundle value when the live endpoint is unavailable.
      }
    }

    void refreshDisplaySettings();
    const onFocus = () => void refreshDisplaySettings();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <QuickStartVisitProvider
      initialCounts={data.pageVisitCounts ?? data.serviceVisitCounts ?? {}}
    >
      <KioskShell
        autoZoomEnabled={autoZoomEnabled}
        sidebar={
          <Sidebar
            language={language}
            homepageCards={data.homepageCards}
            services={data.services}
            settings={data.settings}
          />
        }
      >
        {children}
      </KioskShell>
      <KioskIdleAttractLazy
        language={language}
        enabled={promoEnabled && Boolean(promoVideoUrl)}
        videoUrl={promoVideoUrl}
        idleSeconds={idleSeconds > 0 ? idleSeconds : 60}
        countdownSeconds={countdownSeconds > 0 ? countdownSeconds : 10}
      />
    </QuickStartVisitProvider>
  );
}

export function KioskLayoutClient({ children }: KioskLayoutClientProps) {
  return (
    <KioskOfflineGate>
      <KioskLayoutInner>{children}</KioskLayoutInner>
    </KioskOfflineGate>
  );
}
