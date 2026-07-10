"use client";

import { Phone } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { localized } from "@/lib/i18n/translations";
import { ContentCard } from "@/components/kiosk/content-card";
import type { EmergencyContact } from "@prisma/client";

export function EmergencyClient({ contacts }: { contacts: EmergencyContact[] }) {
  const { language } = useKiosk();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {contacts.map((contact) => (
        <ContentCard key={contact.id} className="border-l-4 border-red-500">
          <h3 className="mb-1 font-bold text-kiosk-navy">{localized(contact, language, "name")}</h3>
          {contact.descriptionEn && (
            <p className="mb-3 text-sm text-gray-500">{localized(contact, language, "description")}</p>
          )}
          <a
            href={`tel:${contact.phoneNumber}`}
            className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-lg font-bold text-red-600 transition-colors hover:bg-red-100"
          >
            <Phone className="h-5 w-5" />
            {contact.phoneNumber}
          </a>
        </ContentCard>
      ))}
    </div>
  );
}
