"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/kiosk/bottom-nav";
import { DateTimeWidget, kioskTopBarHeightClass, kioskDateTimeWidthClass } from "@/components/kiosk/date-time-widget";
import { KioskScenicBackdrop } from "@/components/kiosk/kiosk-scenic-backdrop";
import { OfflineBanner } from "@/components/kiosk/offline-banner";
import { KioskTapFeedback } from "@/components/kiosk/kiosk-tap-feedback";
import { KioskFullscreenGuard } from "@/components/kiosk/kiosk-fullscreen-guard";
import { KioskKeyboard } from "@/components/kiosk/kiosk-keyboard";
import { KioskSelectionLock } from "@/components/kiosk/kiosk-selection-lock";
import { KioskLoweredBanner } from "@/components/kiosk/kiosk-lowered-banner";
import { useWheelchairMode } from "@/hooks/use-kiosk";
import { CHARTER_SCENIC_IMAGE } from "@/features/citizens-charter/ui-catalog";
import { useKioskUiScale } from "@/hooks/use-kiosk-ui-scale";
import { useLoweredStage } from "@/hooks/use-lowered-stage";
import { cn } from "@/lib/utils";

interface KioskShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  /** When false, skip large-screen text bump and click-to-fullscreen. */
  autoZoomEnabled?: boolean;
}

export function KioskShell({ sidebar, children, autoZoomEnabled = true }: KioskShellProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isCitizensCharter = pathname.startsWith("/citizens-charter");
  const showScenicBackdrop = isHome || isCitizensCharter;
  const lockMainScroll = isHome || isCitizensCharter;
  const { viewportStyle, stageStyle } = useKioskUiScale(autoZoomEnabled);
  const { wheelchairMode } = useWheelchairMode();
  const stageRef = useRef<HTMLDivElement>(null);
  const { bannerMounted, bannerLeaving } = useLoweredStage(wheelchairMode, stageRef);

  return (
    <div className="kiosk-ui-scale-viewport" style={viewportStyle}>
      {bannerMounted ? <KioskLoweredBanner leaving={bannerLeaving} /> : null}
      <div
        ref={stageRef}
        className={cn(
          "kiosk-ui-scale-stage kiosk-lock-select flex h-full w-full flex-col overflow-hidden bg-kiosk-bg",
          wheelchairMode && "kiosk-stage-lowered"
        )}
        style={stageStyle}
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
      >
        <KioskFullscreenGuard enabled={autoZoomEnabled} />
        <OfflineBanner />
        <div className="flex min-h-0 flex-1">
          {sidebar}
          <main className="kiosk-main-frame relative flex min-w-0 flex-1 flex-col overflow-hidden bg-kiosk-bg [container-type:size]">
            {showScenicBackdrop ? (
              <KioskScenicBackdrop imageUrl={CHARTER_SCENIC_IMAGE} />
            ) : null}
            <div
              className={cn(
                "pointer-events-none absolute top-0 right-8 z-40 flex items-center justify-end",
                kioskTopBarHeightClass,
                kioskDateTimeWidthClass
              )}
            >
              <DateTimeWidget />
            </div>
            <div
              className={cn(
                "kiosk-main-scroll relative flex min-h-0 flex-1 flex-col overscroll-y-contain",
                lockMainScroll ? "overflow-hidden" : "overflow-x-hidden overflow-y-auto"
              )}
            >
              {children}
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
      <KioskTapFeedback />
      <KioskKeyboard />
      <KioskSelectionLock />
    </div>
  );
}
