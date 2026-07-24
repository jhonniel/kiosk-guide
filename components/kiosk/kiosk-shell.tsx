"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/kiosk/bottom-nav";
import { OfflineBanner } from "@/components/kiosk/offline-banner";
import { KioskTapFeedback } from "@/components/kiosk/kiosk-tap-feedback";
import { KioskFullscreenGuard } from "@/components/kiosk/kiosk-fullscreen-guard";
import { cn } from "@/lib/utils";

interface KioskShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function KioskShell({ sidebar, children }: KioskShellProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div
      className="kiosk-lock-select flex h-screen flex-col overflow-hidden bg-kiosk-bg"
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      <KioskFullscreenGuard />
      <OfflineBanner />
      <div className="flex min-h-0 flex-1">
        {sidebar}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div
            className={cn(
              "kiosk-main-scroll flex min-h-0 flex-1 flex-col overscroll-y-contain",
              isHome ? "overflow-hidden" : "overflow-x-hidden overflow-y-auto"
            )}
          >
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
      <KioskTapFeedback />
    </div>
  );
}
