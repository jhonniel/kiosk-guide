"use client";

import { SmartSearch } from "@/components/kiosk/smart-search";
import { ServiceCard } from "@/components/kiosk/service-card";
import { QuickAccess } from "@/components/kiosk/quick-access";
import { PageHeader } from "@/components/kiosk/page-header";
import { useKiosk } from "@/hooks/use-kiosk";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { t, localized } from "@/lib/i18n/translations";
import { CHARTER_SCENIC_IMAGE } from "@/features/citizens-charter/ui-catalog";

export default function HomePage() {
  const { language } = useKiosk();
  const data = useKioskOfflineData();
  const cards = data.homepageCards;

  return (
    <div className="relative flex min-h-0 flex-1 basis-0 flex-col overflow-hidden bg-kiosk-bg px-8 pb-5">
      {/* Mt. Hibok-Hibok — same top-right fade as Citizens' Charter overview */}
      <div
        className="pointer-events-none absolute top-0 right-0 z-0 h-[17rem] w-[min(70%,46rem)] sm:h-[19rem]"
        aria-hidden
      >
        <div
          className="absolute inset-0 bg-cover bg-[center_top]"
          style={{ backgroundImage: `url(${CHARTER_SCENIC_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-kiosk-bg from-[8%] via-kiosk-bg/75 via-[42%] to-transparent to-[78%]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-kiosk-bg to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <PageHeader
          title={t(language, "kioskTitle")}
          language={language}
          description={t(language, "kioskSubtitle")}
          showBack={false}
          transparent
        />

        <div className="mb-5">
          <SmartSearch />
        </div>

        <div className="kiosk-stagger mb-4 grid min-h-0 flex-1 auto-rows-fr grid-cols-5 gap-3">
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
