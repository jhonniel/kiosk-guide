import Link from "next/link";
import Image from "next/image";
import { getIcon } from "@/utils/icon-map";
import { t, localized, type Language } from "@/lib/i18n/translations";
import {
  resolveBrandingFooterImageUrl,
  resolveBrandingLogoUrl,
} from "@/lib/branding";
import { getLocalizedSetting } from "@/features/settings/resolve-settings";
import type { QuickLink } from "@prisma/client";

interface SidebarProps {
  language: Language;
  quickLinks: QuickLink[];
  settings: Record<string, string>;
}

export function Sidebar({ language, quickLinks, settings }: SidebarProps) {
  const govPrefix = getLocalizedSetting(settings, "gov_prefix", language);
  const govShort = getLocalizedSetting(settings, "gov_short", language);
  const tagline = getLocalizedSetting(settings, "tagline", language);
  const welcome = getLocalizedSetting(settings, "welcome", language);
  const footerTagline = getLocalizedSetting(settings, "footer_tagline", language);
  const logoUrl = resolveBrandingLogoUrl(settings);
  const footerImageUrl = resolveBrandingFooterImageUrl(settings);

  return (
    <aside className="relative flex w-[300px] shrink-0 flex-col overflow-hidden bg-kiosk-navy text-white">
      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-5 pt-6 pb-4">
        <div className="mb-7 flex items-center gap-3">
          <div className="relative h-[66px] w-[66px] shrink-0 overflow-hidden rounded-full">
            <Image
              src={logoUrl}
              alt="Government logo"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
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

        <div className="mb-6">
          <h2 className="mb-2 text-[28px] leading-none font-extrabold">
            {t(language, "welcome")}
          </h2>
          <p className="text-[13px] leading-relaxed text-white/85">{welcome}</p>
          <div className="mt-4 h-[3px] w-10 rounded-full bg-kiosk-green" />
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#13233d]/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm">
          <div className="mb-3">
            <h3 className="text-[11px] font-bold tracking-[0.18em] uppercase">
              {t(language, "quickStart")}
            </h3>
            <div className="mt-1.5 h-[3px] w-8 rounded-full bg-kiosk-green" />
          </div>
          <nav className="flex flex-col gap-2">
            {quickLinks.map((link) => {
              const Icon = getIcon(link.icon);
              const title = localized(link, language, "title");
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  className="flex items-center gap-3 rounded-2xl bg-[#1c3358]/90 px-4 py-3.5 text-[13px] font-semibold text-white transition-all duration-200 hover:bg-[#244270] active:scale-[0.98]"
                >
                  <Icon className="h-[18px] w-[18px] shrink-0 text-white" strokeWidth={1.85} />
                  <span className="leading-tight">{title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="relative mt-auto h-[240px] shrink-0 overflow-hidden">
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
          className="absolute right-5 bottom-6 left-5 text-[26px] leading-[1.15] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
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
