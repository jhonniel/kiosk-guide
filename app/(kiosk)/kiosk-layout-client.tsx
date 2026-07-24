"use client";

import { KioskShell } from "@/components/kiosk/kiosk-shell";
import { KioskOfflineGate } from "@/components/kiosk/kiosk-offline-gate";
import { KioskIdleAttractLazy } from "@/components/kiosk/kiosk-idle-attract-lazy";
import { Sidebar } from "@/components/kiosk/sidebar";
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

  return (
    <>
      <KioskShell
        sidebar={
          <Sidebar language={language} quickLinks={data.quickLinks} settings={data.settings} />
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
    </>
  );
}

export function KioskLayoutClient({ children }: KioskLayoutClientProps) {
  return (
    <KioskOfflineGate>
      <KioskLayoutInner>{children}</KioskLayoutInner>
    </KioskOfflineGate>
  );
}
