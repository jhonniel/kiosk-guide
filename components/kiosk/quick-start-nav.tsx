"use client";

import { useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { HomepageCard, Service } from "@prisma/client";
import { getIcon } from "@/utils/icon-map";
import { localized, type Language } from "@/lib/i18n/translations";
import { logVisitor } from "@/features/kiosk/actions";
import { QUICK_START_LIMIT } from "@/features/kiosk/constants";
import { candidateVisitKey } from "@/features/kiosk/quick-start";
import {
  buildQuickStartCandidates,
  rankSystemQuickStart,
} from "@/features/kiosk/quick-start-catalog";
import { getKioskSessionId } from "@/features/kiosk/visit-tracking";
import { useKiosk } from "@/hooks/use-kiosk";
import { useCitizensCharterEdition } from "@/hooks/use-citizens-charter-data";
import { useQuickStartVisits } from "@/components/kiosk/quick-start-visit-provider";

interface QuickStartNavProps {
  language: Language;
  homepageCards: HomepageCard[];
  services: Service[];
}

export function QuickStartNav({
  language,
  homepageCards,
  services,
}: QuickStartNavProps) {
  const router = useRouter();
  const { language: kioskLanguage } = useKiosk();
  const { edition: charterEdition } = useCitizensCharterEdition();
  const { visitCounts, recordVisit } = useQuickStartVisits();
  const lastClickRef = useRef<{ page: string; at: number } | null>(null);

  const candidates = useMemo(
    () =>
      buildQuickStartCandidates({
        homepageCards,
        services,
        charterEdition,
      }),
    [homepageCards, services, charterEdition]
  );

  const topLinks = useMemo(
    () => rankSystemQuickStart(candidates, visitCounts, QUICK_START_LIMIT),
    [candidates, visitCounts]
  );

  const onOpenLink = useCallback(
    (link: { href: string; visitKey?: string }) => {
      const page = candidateVisitKey(link);
      const now = Date.now();
      const last = lastClickRef.current;
      if (last && last.page === page && now - last.at < 400) return false;
      lastClickRef.current = { page, at: now };

      recordVisit(page);
      void logVisitor(page, kioskLanguage, getKioskSessionId()).catch(() => undefined);
      return true;
    },
    [kioskLanguage, recordVisit]
  );

  if (topLinks.length === 0) {
    return (
      <p className="px-1 py-2 text-[11px] leading-relaxed text-white/60 sm:text-xs">
        {language === "fil"
          ? "Lalabas dito ang mga pinakabinibisita mong serbisyo."
          : language === "bis"
            ? "Makita dinhi ang imong pinakabinisitahan nga mga serbisyo."
            : "Your most visited services will appear here."}
      </p>
    );
  }

  return (
    <nav className="flex flex-col gap-1.5 sm:gap-2" data-testid="quick-start-nav">
      {topLinks.map((link) => {
        const Icon = getIcon(link.icon);
        const title = localized(
          link as unknown as Record<string, unknown>,
          language,
          "title"
        );
        return (
          <Link
            key={link.id}
            href={link.href}
            prefetch
            onPointerDown={(event) => {
              // Navigate on pointerdown so routing still works when
              // click-to-fullscreen consumes the following click event.
              if (event.button !== 0) return;
              if (!onOpenLink(link)) return;
              router.push(link.href);
            }}
            onClick={(event) => {
              // Pointer path already navigated; keep keyboard (detail===0) working.
              if (event.detail === 0) {
                if (onOpenLink(link)) router.push(link.href);
                return;
              }
              event.preventDefault();
            }}
            className="flex items-center gap-2.5 rounded-xl bg-[#1c3358]/90 px-3 py-2.5 text-[12px] font-semibold text-white transition-all duration-200 hover:bg-[#244270] active:scale-[0.98] sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3.5 sm:text-[13px]"
          >
            <Icon className="h-4 w-4 shrink-0 text-white sm:h-[18px] sm:w-[18px]" strokeWidth={1.85} />
            <span className="leading-tight">{title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
