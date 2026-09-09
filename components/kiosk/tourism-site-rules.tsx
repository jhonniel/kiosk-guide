"use client";

import { cn } from "@/lib/utils";
import type { Language } from "@/lib/i18n/translations";

const RULES = [
  {
    id: "pets",
    src: "/images/tourism/rules/no-pets.png",
    altEn: "No pets allowed",
    altFil: "Bawal ang alagang hayop",
    altBis: "Dili gidawat ang binuhi",
  },
  {
    id: "liquor",
    src: "/images/tourism/rules/no-liquor.png",
    altEn: "No liquor",
    altFil: "Bawal ang alak",
    altBis: "Bawal ang alak",
  },
  {
    id: "smoking",
    src: "/images/tourism/rules/no-smoking.png",
    altEn: "No smoking",
    altFil: "Bawal manigarilyo",
    altBis: "Bawal mag-smoke",
  },
] as const;

function getRuleLabels(language: Language): Record<(typeof RULES)[number]["id"], string[]> {
  if (language === "fil") {
    return {
      pets: ["Bawal", "Ang", "Alagang Hayop"],
      liquor: ["Bawal", "Alak"],
      smoking: ["Bawal", "Manigarilyo"],
    };
  }
  if (language === "bis") {
    return {
      pets: ["Dili", "Gidawat", "Ang Binuhi"],
      liquor: ["Bawal", "Alak"],
      smoking: ["Bawal", "Pag-smoke"],
    };
  }
  return {
    pets: ["No", "Pets", "Allowed"],
    liquor: ["No", "Liquor"],
    smoking: ["No", "Smoking"],
  };
}

function getRuleAlt(rule: (typeof RULES)[number], language: Language) {
  if (language === "fil") return rule.altFil;
  if (language === "bis") return rule.altBis;
  return rule.altEn;
}

interface TourismSiteRulesProps {
  language: Language;
  className?: string;
}

export function TourismSiteRules({ language, className }: TourismSiteRulesProps) {
  const labels = getRuleLabels(language);

  return (
    <div
      className={cn("flex flex-wrap items-start justify-center gap-6 sm:gap-8", className)}
      aria-label={
        language === "fil"
          ? "Mga patakaran sa destinasyon"
          : language === "bis"
            ? "Mga lagda sa destinasyon"
            : "Site rules"
      }
    >
      {RULES.map((rule) => (
        <div
          key={rule.id}
          className="flex w-[5.5rem] shrink-0 flex-col items-center gap-2 sm:w-24"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={rule.src}
            alt={getRuleAlt(rule, language)}
            width={72}
            height={72}
            className="h-[4.5rem] w-[4.5rem] object-contain sm:h-20 sm:w-20"
            loading="lazy"
            decoding="async"
          />
          <div className="flex flex-col items-center text-center text-[10px] font-semibold leading-tight text-kiosk-navy sm:text-[11px]">
            {labels[rule.id].map((line, index) => (
              <span key={`${rule.id}-${index}`}>{line}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
