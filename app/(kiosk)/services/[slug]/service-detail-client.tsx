"use client";

import { MapPin, Clock, FileText, PhilippinePeso, Phone } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { localized } from "@/lib/i18n/translations";
import { uiText } from "@/lib/i18n/kiosk-ui";
import { ContentCard } from "@/components/kiosk/content-card";
import type { Service } from "@prisma/client";

export function ServiceDetailClient({ service }: { service: Service }) {
  const { language } = useKiosk();

  const sections = [
    { icon: FileText, label: uiText(language, "requirements"), value: localized(service, language, "requirements") },
    { icon: FileText, label: uiText(language, "documents"), value: localized(service, language, "documents") },
    { icon: MapPin, label: uiText(language, "officeLocation"), value: service.officeLocation },
    { icon: Clock, label: uiText(language, "officeHoursLabel"), value: service.officeHours },
    { icon: Clock, label: uiText(language, "processingTime"), value: service.processingTime },
    { icon: PhilippinePeso, label: uiText(language, "fee"), value: service.fee },
    { icon: Phone, label: uiText(language, "contact"), value: service.contactInfo },
  ];

  return (
    <div className="space-y-6">
      <ContentCard>
        <p className="leading-relaxed text-gray-700">{localized(service, language, "description")}</p>
      </ContentCard>
      <div className="kiosk-stagger grid gap-4 md:grid-cols-2">
        {sections
          .filter((s) => s.value)
          .map((section) => (
            <ContentCard key={section.label}>
              <div className="mb-2 flex items-center gap-2">
                <section.icon className="h-5 w-5 text-kiosk-green" />
                <h3 className="font-bold text-kiosk-navy">{section.label}</h3>
              </div>
              <p className="text-sm leading-relaxed text-gray-600">{section.value}</p>
            </ContentCard>
          ))}
      </div>
    </div>
  );
}
