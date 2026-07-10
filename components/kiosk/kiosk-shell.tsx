"use client";

import { BottomNav } from "@/components/kiosk/bottom-nav";
import { OfflineBanner } from "@/components/kiosk/offline-banner";

interface KioskShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function KioskShell({ sidebar, children }: KioskShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-kiosk-bg">
      <OfflineBanner />
      <div className="flex min-h-0 flex-1">
        {sidebar}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
