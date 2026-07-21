"use client";

import { SmartSearch } from "@/components/kiosk/smart-search";
import { ServiceCard } from "@/components/kiosk/service-card";
import { QuickAccess } from "@/components/kiosk/quick-access";
import { PageHeader } from "@/components/kiosk/page-header";
import { useKiosk } from "@/hooks/use-kiosk";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { t, localized } from "@/lib/i18n/translations";

export default function HomePage() {
  const { language } = useKiosk();
  const data = useKioskOfflineData();
  const cards = data.homepageCards;

  return (
    <div className="flex min-h-0 flex-1 basis-0 flex-col overflow-hidden px-8 pb-5">
      <PageHeader
        title={t(language, "kioskTitle")}
        language={language}
        description={t(language, "kioskSubtitle")}
        showBack={false}
      />

      <div className="mb-5">
        <SmartSearch />
      </div>

      <div className="kiosk-stagger mb-5 grid min-h-0 flex-1 auto-rows-fr grid-cols-5 gap-4">
        {cards.map((card) => (
          <ServiceCard
            key={card.id}
            title={localized(card, language, "title")}
            description={localized(card, language, "description")}
            icon={card.icon}
            iconUrl={card.iconUrl}
            color={card.color}
            href={card.href}
            className="justify-center"
          />
        ))}
      </div>

      <QuickAccess language={language} />
    </div>
  );
}
