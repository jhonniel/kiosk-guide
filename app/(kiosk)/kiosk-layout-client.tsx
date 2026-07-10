"use client";

import { KioskShell } from "@/components/kiosk/kiosk-shell";
import { KioskOfflineGate } from "@/components/kiosk/kiosk-offline-gate";
import { Sidebar } from "@/components/kiosk/sidebar";
import { useKiosk } from "@/hooks/use-kiosk";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";

interface KioskLayoutClientProps {
  children: React.ReactNode;
}

function KioskLayoutInner({ children }: KioskLayoutClientProps) {
  const { language } = useKiosk();
  const data = useKioskOfflineData();

  return (
    <KioskShell
      sidebar={
        <Sidebar language={language} quickLinks={data.quickLinks} settings={data.settings} />
      }
    >
      {children}
    </KioskShell>
  );
}

export function KioskLayoutClient({ children }: KioskLayoutClientProps) {
  return (
    <KioskOfflineGate>
      <KioskLayoutInner>{children}</KioskLayoutInner>
    </KioskOfflineGate>
  );
}
