"use client";

import { useKiosk } from "@/hooks/use-kiosk";
import { localized } from "@/lib/i18n/translations";
import { ContentCard } from "@/components/kiosk/content-card";
import type { Page, Service } from "@prisma/client";

interface Props {
  page: Page | null;
  services: Service[];
}

export function CitizensCharterClient({ page, services }: Props) {
  const { language } = useKiosk();

  return (
    <div className="space-y-6">
      {page && (
        <ContentCard>
          <p className="leading-relaxed text-gray-700">{localized(page, language, "content")}</p>
        </ContentCard>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <ContentCard key={service.id}>
            <h3 className="mb-2 font-bold text-kiosk-navy">{localized(service, language, "title")}</h3>
            <p className="mb-3 text-sm text-gray-600">{localized(service, language, "description")}</p>
            {service.processingTime && (
              <p className="text-sm"><span className="font-semibold">Processing:</span> {service.processingTime}</p>
            )}
            {service.officeHours && (
              <p className="text-sm"><span className="font-semibold">Hours:</span> {service.officeHours}</p>
            )}
            {service.fee && (
              <p className="text-sm"><span className="font-semibold">Fee:</span> {service.fee}</p>
            )}
          </ContentCard>
        ))}
      </div>
    </div>
  );
}
