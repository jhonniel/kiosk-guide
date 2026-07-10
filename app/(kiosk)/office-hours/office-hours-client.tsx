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
      <Clock className="mx-auto mb-4 h-16 w-16 text-kiosk-green" />
      <h3 className="mb-2 text-xl font-bold text-kiosk-navy">
        {pickLang(
          language,
          "Regular Office Hours",
          "Regular na Oras ng Opisina",
          "Regular nga Oras sa Opisina"
        )}
      </h3>
      <p className="text-lg text-gray-700">{hours}</p>
      <p className="mt-4 text-sm text-gray-500">
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
