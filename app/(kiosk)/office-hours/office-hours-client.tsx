"use client";

import { Clock } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { pickLang } from "@/lib/i18n/translations";
import { getLocalizedSetting } from "@/features/settings/resolve-settings";
import { ContentCard } from "@/components/kiosk/content-card";

interface Props {
  settings: Record<string, string>;
}

export function OfficeHoursClient({ settings }: Props) {
  const { language } = useKiosk();
  const hours = getLocalizedSetting(settings, "office_hours", language);

  return (
    <ContentCard className="max-w-lg text-center">
      <Clock className="mx-auto mb-3 h-12 w-12 text-kiosk-green sm:mb-4 sm:h-16 sm:w-16" />
      <h3 className="mb-2 text-lg font-bold text-kiosk-navy sm:text-xl">
        {pickLang(
          language,
          "Regular Office Hours",
          "Regular na Oras ng Opisina",
          "Regular nga Oras sa Opisina"
        )}
      </h3>
      <p className="text-base text-gray-700 sm:text-lg">{hours}</p>
      <p className="mt-3 text-xs text-gray-500 sm:mt-4 sm:text-sm">
        {pickLang(
          language,
          "Closed on weekends and national holidays.",
          "Sarado tuwing weekend at pambansang holiday.",
          "Sirado sa weekend ug national holidays."
        )}
      </p>
    </ContentCard>
  );
}
