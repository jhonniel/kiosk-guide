"use client";

import dynamic from "next/dynamic";
import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKiosk } from "@/hooks/use-kiosk";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { pickLang } from "@/lib/i18n/translations";
import { getSortedFaqs } from "@/features/offline/selectors";
import { FaqClient } from "./faq-client";

const CamiChat = dynamic(
  () => import("@/components/kiosk/cami-chat").then((module) => ({ default: module.CamiChat })),
  { ssr: false }
);

export default function FaqPage() {
  const { language } = useKiosk();
  const data = useKioskOfflineData();
  const faqs = getSortedFaqs(data);

  return (
    <ModulePageClient
      icon="HelpCircle"
      titleEn="Frequently Asked Questions"
      titleFil="Mga Madalas Itanong"
      titleBis="Mga Kanunay nga Pangutana"
      descriptionEn="Browse Camiguin and Capitol answers, or ask Cami for more help."
      descriptionFil="Tingnan ang mga sagot tungkol sa Camiguin at Capitol, o magtanong kay Cami."
      descriptionBis="Tan-awa ang mga tubag bahin sa Camiguin ug Capitol, o pangutana kang Cami."
      bannerMeta={pickLang(
        language,
        "Ask Cami anytime from the bottom right",
        "Magtanong kay Cami anumang oras sa kanang ibaba",
        "Pangutana kang Cami bisan kanus-a sa ubos nga tuo"
      )}
      fit
    >
      {/* Only the answers scroll; the banner above stays in place. */}
      <div className="kiosk-main-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pb-1">
        <FaqClient faqs={faqs} />
      </div>
      <CamiChat />
    </ModulePageClient>
  );
}
