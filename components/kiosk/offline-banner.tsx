"use client";

import { WifiOff } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { uiText } from "@/lib/i18n/kiosk-ui";
import { useOffline } from "@/components/providers/offline-provider";

export function OfflineBanner() {
  const { language } = useKiosk();
  const { isOnline, isOfflineReady } = useOffline();

  if (isOnline) return null;

  const message = isOfflineReady
    ? uiText(language, "offlineReady")
    : uiText(language, "offlineLimited");

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-amber-600 px-4 py-2 text-sm font-medium text-white"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
