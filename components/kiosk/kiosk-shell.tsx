"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/kiosk/bottom-nav";
import { DateTimeWidget } from "@/components/kiosk/date-time-widget";
import { KioskScenicBackdrop } from "@/components/kiosk/kiosk-scenic-backdrop";
import { OfflineBanner } from "@/components/kiosk/offline-banner";
import { KioskTapFeedback } from "@/components/kiosk/kiosk-tap-feedback";
import { KioskFullscreenGuard } from "@/components/kiosk/kiosk-fullscreen-guard";
import { CHARTER_SCENIC_IMAGE } from "@/features/citizens-charter/ui-catalog";
import { useKioskUiScale } from "@/hooks/use-kiosk-ui-scale";
import { cn } from "@/lib/utils";

interface KioskShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function KioskShell({ sidebar, children }: KioskShellProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const showScenicBackdrop = isHome || pathname.startsWith("/citizens-charter");
  const scaleStyle = useKioskUiScale();

  return (
    <div className="kiosk-ui-scale-viewport bg-kiosk-bg" style={scaleStyle}>
      <div
        className="kiosk-lock-select kiosk-ui-scale-stage flex flex-col overflow-hidden bg-kiosk-bg"
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
      >
        <KioskFullscreenGuard />
        <OfflineBanner />
        <div className="flex min-h-0 flex-1">
          {sidebar}
          <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-kiosk-bg">
            {showScenicBackdrop ? (
              <KioskScenicBackdrop imageUrl={CHARTER_SCENIC_IMAGE} />
            ) : null}
            {/* Keep below modal overlays (z-50+). Scroll content must not create a stacking
                context that traps fixed dialogs under this widget. */}
            <div className="pointer-events-none absolute top-3 right-4 z-40 hidden md:block sm:top-4 sm:right-6 lg:right-8">
              <DateTimeWidget />
            </div>
            <div
              className={cn(
                "kiosk-main-scroll relative flex min-h-0 flex-1 flex-col overscroll-y-contain",
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
    </div>
  );
}
