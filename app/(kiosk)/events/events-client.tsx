"use client";

import { format } from "date-fns";
import { Calendar, MapPin } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { localized } from "@/lib/i18n/translations";
import { ContentCard } from "@/components/kiosk/content-card";
import type { Event } from "@prisma/client";

export function EventsClient({ events }: { events: Event[] }) {
  const { language } = useKiosk();

  return (
    <div className="kiosk-stagger space-y-4">
      {events.map((event) => (
        <ContentCard key={event.id} className="flex gap-4">
          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-violet-50">
            <span className="text-xs font-bold text-violet-600">{format(new Date(event.startDate), "MMM")}</span>
            <span className="text-xl font-bold text-violet-700">{format(new Date(event.startDate), "d")}</span>
          </div>
          <div>
            <h3 className="font-bold text-kiosk-navy">{localized(event, language, "title")}</h3>
            <p className="mb-2 text-sm text-gray-600">{localized(event, language, "description")}</p>
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(event.startDate), "MMM d, yyyy h:mm a")}
              </span>
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                </span>
              )}
            </div>
          </div>
        </ContentCard>
      ))}
    </div>
  );
}
