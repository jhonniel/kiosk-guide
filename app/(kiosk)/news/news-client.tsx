"use client";

import { format } from "date-fns";
import { useKiosk } from "@/hooks/use-kiosk";
import { localized } from "@/lib/i18n/translations";
import { ContentCard } from "@/components/kiosk/content-card";
import type { Announcement } from "@prisma/client";

export function NewsClient({ announcements }: { announcements: Announcement[] }) {
  const { language } = useKiosk();

  return (
    <div className="space-y-4">
      {announcements.map((item) => (
        <ContentCard key={item.id}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold text-kiosk-navy">{localized(item, language, "title")}</h3>
            <span className="text-xs text-gray-400">{format(new Date(item.publishedAt), "MMM d, yyyy")}</span>
          </div>
          <p className="leading-relaxed text-gray-700">{localized(item, language, "content")}</p>
        </ContentCard>
      ))}
    </div>
  );
}
