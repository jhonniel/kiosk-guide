import Link from "next/link";
import Image from "next/image";
import type { HomepageCard, Service } from "@prisma/client";
import { t, type Language } from "@/lib/i18n/translations";
import {
  resolveBrandingFooterImageUrl,
  resolveBrandingLogoUrl,
} from "@/lib/branding";
import { getLocalizedSetting } from "@/features/settings/resolve-settings";
import { QuickStartNav } from "@/components/kiosk/quick-start-nav";
import { KioskVisitLogger } from "@/components/kiosk/kiosk-visit-logger";

interface SidebarProps {
  language: Language;
  homepageCards: HomepageCard[];
  services: Service[];
  settings: Record<string, string>;
}

export function Sidebar({
  language,
  homepageCards,
  services,
  settings,
}: SidebarProps) {
  const govPrefix = getLocalizedSetting(settings, "gov_prefix", language);
  const govShort = getLocalizedSetting(settings, "gov_short", language);
  const tagline = getLocalizedSetting(settings, "tagline", language);
  const welcome = getLocalizedSetting(settings, "welcome", language);
  const footerTagline = getLocalizedSetting(settings, "footer_tagline", language);
  const logoUrl = resolveBrandingLogoUrl(settings);
  const footerImageUrl = resolveBrandingFooterImageUrl(settings);

  return (
    <aside className="relative flex w-[220px] shrink-0 flex-col overflow-hidden bg-kiosk-navy text-white sm:w-[260px] lg:w-[300px]">
      <KioskVisitLogger />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pt-4 pb-3 sm:px-4 sm:pt-5 lg:px-5 lg:pt-6 lg:pb-4">
        <div className="mb-4 flex items-center gap-2.5 sm:mb-5 sm:gap-3 lg:mb-7">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/5 sm:h-14 sm:w-14 lg:h-[66px] lg:w-[66px]">
            <Image
              src={logoUrl}
              alt="Government logo"
              fill
              className="object-contain p-0.5"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold tracking-[0.14em] text-white/75 uppercase sm:text-[10px]">
              {govPrefix}
            </p>
            <h1 className="text-xl leading-none font-extrabold tracking-wide uppercase sm:text-2xl lg:text-[26px]">
              {govShort}
            </h1>
            <p
              className="mt-1 text-base leading-none text-[#5fd6c8] sm:text-lg lg:text-[19px]"
              style={{ fontFamily: "var(--font-tagline), cursive" }}
            >
              {tagline}
            </p>
          </div>
        </div>

        <div className="mb-4 sm:mb-5 lg:mb-6">
          <h2 className="mb-1.5 text-xl leading-none font-extrabold sm:mb-2 sm:text-2xl lg:text-[28px]">
            {t(language, "welcome")}
          </h2>
          <p className="line-clamp-3 text-[12px] leading-relaxed text-white/85 sm:text-[13px]">
            {welcome}
          </p>
          <div className="mt-3 h-[3px] w-10 rounded-full bg-kiosk-green sm:mt-4" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#13233d]/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm sm:rounded-3xl sm:p-4">
          <div className="mb-2.5 sm:mb-3">
            <h3 className="text-[10px] font-bold tracking-[0.18em] uppercase sm:text-[11px]">
              {t(language, "quickStart")}
            </h3>
            <div className="mt-1.5 h-[3px] w-8 rounded-full bg-kiosk-green" />
          </div>
          <QuickStartNav
            language={language}
            homepageCards={homepageCards}
            services={services}
          />
        </div>
      </div>

      <div className="relative mt-auto hidden h-[140px] shrink-0 overflow-hidden sm:block sm:h-[180px] lg:h-[240px]">
        <Image
          src={footerImageUrl}
          alt="Camiguin landscape"
          fill
          className="object-cover object-[center_35%]"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-kiosk-navy via-kiosk-navy/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/35 to-transparent" />
        <p
          className="absolute right-4 bottom-4 left-4 text-lg leading-[1.15] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] sm:right-5 sm:bottom-6 sm:left-5 sm:text-xl lg:text-[26px]"
          style={{ fontFamily: "var(--font-tagline), cursive" }}
        >
          {footerTagline.split(/(?<=\.)\s+/).filter(Boolean).map((line, index) => (
            <span key={`${line}-${index}`} className="block">
              {line}
            </span>
          ))}
        </p>
      </div>
    </aside>
  );
}
