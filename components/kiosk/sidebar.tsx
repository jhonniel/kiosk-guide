import Image from "next/image";
import type { HomepageCard, Service } from "@prisma/client";
import { t, type Language } from "@/lib/i18n/translations";
import {
  resolveBrandingFooterImageUrl,
} from "@/lib/branding";
import { KioskBrandLogos } from "@/components/kiosk/kiosk-brand-logos";
import { getLocalizedSetting } from "@/features/settings/resolve-settings";
import { QuickStartNav } from "@/components/kiosk/quick-start-nav";
import { KioskVisitLogger } from "@/components/kiosk/kiosk-visit-logger";

interface SidebarProps {
  language: Language;
  homepageCards: HomepageCard[];
  services: Service[];
  settings: Record<string, string>;
}

/** Fixed desktop chrome — no viewport breakpoints (those jump when browser zoom changes). */
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
  const footerImageUrl = resolveBrandingFooterImageUrl(settings);

  return (
    <aside className="relative flex w-[min(300px,22vw)] min-w-[220px] max-w-[300px] shrink-0 flex-col overflow-hidden bg-kiosk-navy text-white">
      <KioskVisitLogger />

      <div className="relative z-10 shrink-0 px-5 pt-6">
        <div className="mb-4 flex items-start gap-3">
          <KioskBrandLogos settings={settings} variant="sidebar" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-white/75 uppercase">
              {govPrefix}
            </p>
            <h1 className="text-[26px] leading-none font-extrabold tracking-wide uppercase">
              {govShort}
            </h1>
            <p
              className="mt-1 text-[19px] leading-none text-[#5fd6c8]"
              style={{ fontFamily: "var(--font-tagline), cursive" }}
            >
              {tagline}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="mb-1 text-[28px] leading-none font-extrabold">
            {t(language, "welcome")}
          </h2>
          <p className="line-clamp-2 text-[13px] leading-relaxed text-white/85">
            {welcome}
          </p>
          <div className="mt-3 h-[3px] w-10 rounded-full bg-kiosk-green" />
        </div>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-5 pb-4">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#13233d]/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm">
          <div className="mb-3 shrink-0">
            <h3 className="text-[11px] font-bold tracking-[0.18em] uppercase">
              {t(language, "quickStart")}
            </h3>
            <div className="mt-1.5 h-[3px] w-8 rounded-full bg-kiosk-green" />
          </div>
          <div className="kiosk-main-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5">
            <QuickStartNav
              language={language}
              homepageCards={homepageCards}
              services={services}
            />
          </div>
        </div>
      </div>

      <div className="relative h-[140px] shrink-0 overflow-hidden">
        <Image
          src={footerImageUrl}
          alt="Camiguin landscape"
          fill
          className="object-cover object-[center_35%]"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-kiosk-navy via-kiosk-navy/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />
        <p
          className="absolute right-4 bottom-4 left-4 text-xl leading-[1.15] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
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
