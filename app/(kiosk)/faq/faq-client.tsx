"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { localized } from "@/lib/i18n/translations";
import { ContentCard } from "@/components/kiosk/content-card";
import { cn } from "@/lib/utils";
import type { Faq } from "@prisma/client";

export function FaqClient({ faqs }: { faqs: Faq[] }) {
  const { language } = useKiosk();
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  return (
    <div className="kiosk-stagger space-y-3">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <ContentCard key={faq.id} className="cursor-pointer p-0 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : faq.id)}
              className="flex w-full items-center justify-between px-6 py-4 text-left"
            >
              <span className="font-semibold text-kiosk-navy">{localized(faq, language, "question")}</span>
              <ChevronDown className={cn("h-5 w-5 shrink-0 transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
              <div className="border-t px-6 py-4">
                <p className="leading-relaxed text-gray-700">{localized(faq, language, "answer")}</p>
              </div>
            )}
          </ContentCard>
        );
      })}
    </div>
  );
}
