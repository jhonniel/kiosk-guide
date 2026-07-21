"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { uiText } from "@/lib/i18n/kiosk-ui";
import { localized } from "@/lib/i18n/translations";
import { ContentCard } from "@/components/kiosk/content-card";
import { getIcon } from "@/utils/icon-map";
import type { Service } from "@prisma/client";

export function HelpClient({ services }: { services: Service[] }) {
  const { language } = useKiosk();

  return (
    <div className="space-y-4">
      <ContentCard>
        <p className="text-gray-700">{uiText(language, "helpIntro")}</p>
      </ContentCard>
      <div className="kiosk-stagger grid gap-3 md:grid-cols-2">
        {services.map((service) => {
          const Icon = getIcon(service.icon ?? "HelpCircle");
          return (
            <Link key={service.id} href={`/services/${service.slug}`}>
              <ContentCard className="flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
                  <Icon className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-kiosk-navy">{localized(service, language, "title")}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{localized(service, language, "description")}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </ContentCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
