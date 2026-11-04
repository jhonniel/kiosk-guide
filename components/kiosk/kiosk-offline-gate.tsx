"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { BuildingMapLoader } from "@/components/kiosk/building-map-loader";
import { useOffline } from "@/components/providers/offline-provider";
import { useKiosk } from "@/hooks/use-kiosk";
import { t, pickLang } from "@/lib/i18n/translations";
import { Button } from "@/components/ui/button";

export function KioskOfflineGate({ children }: { children: React.ReactNode }) {
  const { isOfflineReady, loadError, syncOfflineData } = useOffline();
  const { language } = useKiosk();

  if (!isOfflineReady && !loadError) {
    return (
      <BuildingMapLoader
        className="h-full min-h-[50vh]"
        label={pickLang(language, "Loading kiosk data…", "Naglo-load ang datos ng kiosk…", "Nagkarga sa datos sa kiosk…")}
      />
    );
  }

  if (!isOfflineReady) {
    return (
      <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-kiosk-navy">
        <Loader2 className="h-10 w-10 animate-spin text-kiosk-green" />
        <p className="text-lg font-medium">
          {pickLang(language, "Loading kiosk data…", "Naglo-load ang datos ng kiosk…", "Nagkarga sa datos sa kiosk…")}
        </p>
        <p className="max-w-md text-center text-sm text-gray-500">
          {loadError ??
            pickLang(
              language,
              t(language, "kioskSubtitle"),
              "Inihahanda ang impormasyon para magamit kahit offline.",
              "Giandam ang impormasyon aron magamit bisan offline."
            )}
        </p>
        {loadError && (
          <Button
            type="button"
            onClick={() => void syncOfflineData()}
            className="bg-kiosk-green hover:bg-kiosk-green/90"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {pickLang(language, "Try again", "Subukang muli", "Sulayi pag-usab")}
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
