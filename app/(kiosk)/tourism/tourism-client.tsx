"use client";

import { MapPin, Palmtree } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { localized } from "@/lib/i18n/translations";
import { ContentCard } from "@/components/kiosk/content-card";
import type { Tourism } from "@prisma/client";

export function TourismClient({ items }: { items: Tourism[] }) {
  const { language } = useKiosk();

  return (
    <div className="kiosk-stagger grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ContentCard key={item.id}>
          <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-pink-50">
            <Palmtree className="h-12 w-12 text-pink-500" />
          </div>
          <h3 className="mb-2 font-bold text-kiosk-navy">{localized(item, language, "title")}</h3>
          <p className="mb-2 text-sm leading-relaxed text-gray-600">{localized(item, language, "description")}</p>
          {item.location && (
            <p className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="h-3 w-3" />
              {item.location}
            </p>
          )}
        </ContentCard>
      ))}
    </div>
  );
}
