"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { getSortedFaqs } from "@/features/offline/selectors";
import { FaqClient } from "./faq-client";

export default function FaqPage() {
  const data = useKioskOfflineData();

  return (
    <ModulePageClient
      icon="HelpCircle"
      titleEn="Frequently Asked Questions"
      titleFil="Mga Madalas Itanong"
      descriptionEn="Quick answers to common service questions."
      descriptionFil="Mabilis na mga sagot sa karaniwang tanong tungkol sa serbisyo."
    >
      <FaqClient faqs={getSortedFaqs(data)} />
    </ModulePageClient>
  );
}
