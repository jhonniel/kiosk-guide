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
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {/*
        No viewport breakpoints here — the shell uses a fixed design canvas,
        so sm/lg media queries would still jump when the browser zooms.
      */}
      <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col px-7 pb-4">
        <div className="shrink-0">
          <PageHeader
            title={t(language, "kioskTitle")}
            language={language}
            description={t(language, "kioskSubtitle")}
            showBack={false}
            transparent
          />
        </div>

        <div className="mb-3 shrink-0">
          <SmartSearch />
        </div>

        <div className="kiosk-home-cards">
          {cards.map((card, index) => (
            <ServiceCard
              key={card.id}
              title={localized(card, language, "title")}
              description={localized(card, language, "description")}
              icon={card.icon}
              iconUrl={card.iconUrl}
              color={card.color}
              href={card.href}
              priority={index < 4}
            />
          ))}
        </div>

        <div className="mt-3 shrink-0">
          <QuickAccess language={language} />
        </div>
      </div>
    </div>
  );
}
