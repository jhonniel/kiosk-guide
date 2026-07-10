"use client";

import { DateTimeWidget } from "@/components/kiosk/date-time-widget";
import { SmartSearch } from "@/components/kiosk/smart-search";
import { ServiceCard } from "@/components/kiosk/service-card";
import { QuickAccess } from "@/components/kiosk/quick-access";
import { useKiosk } from "@/hooks/use-kiosk";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { t, localized } from "@/lib/i18n/translations";

export default function HomePage() {
  const { language } = useKiosk();
  const data = useKioskOfflineData();
  const cards = data.homepageCards;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-kiosk-navy lg:text-3xl">
            {t(language, "kioskTitle")}
          </h1>
          <p className="mt-1 text-gray-600">{t(language, "kioskSubtitle")}</p>
        </div>
        <DateTimeWidget />
      </div>

      <div className="mb-8">
        <SmartSearch />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
  );
}
