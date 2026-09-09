"use client";

import dynamic from "next/dynamic";
import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { getSortedFaqs } from "@/features/offline/selectors";
import { FaqClient } from "./faq-client";

const CamiChat = dynamic(
  () => import("@/components/kiosk/cami-chat").then((module) => ({ default: module.CamiChat })),
  { ssr: false }
);

export default function FaqPage() {
  const data = useKioskOfflineData();
  const faqs = getSortedFaqs(data);

  return (
    <ModulePageClient
      icon="HelpCircle"
      titleEn="Frequently Asked Questions"
      titleFil="Mga Madalas Itanong"
      titleBis="Mga Kanunayng Pangutana"
      descriptionEn="Browse Camiguin and Capitol answers, or ask Cami for more help."
      descriptionFil="Tingnan ang mga sagot tungkol sa Camiguin at Capitol, o magtanong kay Cami."
      descriptionBis="Tan-awa ang mga tubag bahin sa Camiguin ug Capitol, o pangutana kang Cami."
      bannerMeta="Ask Cami anytime from the bottom right"
    >
      <FaqClient faqs={faqs} />
      <CamiChat />
    </ModulePageClient>
  );
}
