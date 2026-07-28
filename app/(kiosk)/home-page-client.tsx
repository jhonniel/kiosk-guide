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
    <div className="relative flex min-h-0 flex-1 basis-0 flex-col overflow-hidden">
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-3 sm:overflow-hidden sm:px-6 sm:pb-4 lg:px-8 lg:pb-5">
        <PageHeader
          title={t(language, "kioskTitle")}
          language={language}
          description={t(language, "kioskSubtitle")}
          showBack={false}
          transparent
        />

        <div className="mb-3 sm:mb-5">
          <SmartSearch />
        </div>

        <div className="kiosk-stagger mb-3 grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-2 sm:mb-4 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
          {cards.map((card) => (
            <ServiceCard
              key={card.id}
              title={localized(card, language, "title")}
              description={localized(card, language, "description")}
              icon={card.icon}
              iconUrl={card.iconUrl}
              color={card.color}
              href={card.href}
            />
          ))}
        </div>

        <QuickAccess language={language} />
      </div>
    </div>
  );
}
