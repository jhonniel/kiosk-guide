"use client";

import { MapPin, Clock, FileText, DollarSign, Phone } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { localized, pickLang } from "@/lib/i18n/translations";
import { ContentCard } from "@/components/kiosk/content-card";
import type { Service } from "@prisma/client";

export function ServiceDetailClient({ service }: { service: Service }) {
  const { language } = useKiosk();

  const sections = [
    { icon: FileText, label: pickLang(language, "Requirements", "Mga Kinakailangan", "Mga Kinahanglan"), value: localized(service, language, "requirements") },
    { icon: FileText, label: pickLang(language, "Documents", "Mga Dokumento", "Mga Papeles"), value: localized(service, language, "documents") },
    { icon: MapPin, label: pickLang(language, "Office Location", "Lokasyon ng Opisina", "Lokasyon sa Opisina"), value: service.officeLocation },
    { icon: Clock, label: pickLang(language, "Office Hours", "Oras ng Opisina", "Oras sa Opisina"), value: service.officeHours },
    { icon: Clock, label: pickLang(language, "Processing Time", "Oras ng Pagproseso", "Oras sa Pagproseso"), value: service.processingTime },
    { icon: DollarSign, label: pickLang(language, "Fee", "Bayad", "Bayad"), value: service.fee },
    { icon: Phone, label: pickLang(language, "Contact", "Contact", "Kontak"), value: service.contactInfo },
  ];

  return (
    <div className="space-y-6">
      <ContentCard>
        <p className="leading-relaxed text-gray-700">{localized(service, language, "description")}</p>
      </ContentCard>
      <div className="grid gap-4 md:grid-cols-2">
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
