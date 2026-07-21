"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { uiText } from "@/lib/i18n/kiosk-ui";
import { ContentCard } from "@/components/kiosk/content-card";

interface Props {
  settings: Record<string, string>;
}

export function ContactClient({ settings }: Props) {
  const { language } = useKiosk();

  return (
    <div className="kiosk-stagger grid gap-4 md:grid-cols-3">
      <ContentCard className="text-center">
        <Phone className="mx-auto mb-3 h-8 w-8 text-kiosk-green" />
        <h3 className="mb-2 font-bold text-kiosk-navy">{uiText(language, "phoneLabel")}</h3>
        <p className="text-gray-600">{settings.contact_phone}</p>
      </ContentCard>
      <ContentCard className="text-center">
        <Mail className="mx-auto mb-3 h-8 w-8 text-kiosk-green" />
        <h3 className="mb-2 font-bold text-kiosk-navy">{uiText(language, "emailLabel")}</h3>
        <p className="text-gray-600">{settings.contact_email}</p>
      </ContentCard>
      <ContentCard className="text-center">
        <MapPin className="mx-auto mb-3 h-8 w-8 text-kiosk-green" />
        <h3 className="mb-2 font-bold text-kiosk-navy">{uiText(language, "addressLabel")}</h3>
        <p className="text-gray-600">{settings.contact_address}</p>
      </ContentCard>
    </div>
  );
}
