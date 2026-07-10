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
    <aside className="relative flex w-[280px] shrink-0 flex-col bg-kiosk-navy text-white">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white/10">
            <Image
              src={logoUrl}
              alt="Government logo"
              fill
              className="object-contain p-1"
              unoptimized
            />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-white/70">
              {govPrefix}
            </p>
            <h1 className="text-lg font-bold leading-tight">{govShort}</h1>
            <p className="font-script text-sm text-kiosk-green-light">{tagline}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-2 h-0.5 w-8 bg-kiosk-green" />
          <h2 className="mb-2 text-lg font-bold">{t(language, "welcome")}</h2>
          <p className="text-sm leading-relaxed text-white/80">{welcome}</p>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-xs font-bold tracking-widest">{t(language, "quickStart")}</h3>
            <div className="h-0.5 w-6 bg-kiosk-green" />
          </div>
          <nav className="flex flex-col gap-2">
            {quickLinks.map((link) => {
              const Icon = getIcon(link.icon);
              const title = localized(link, language, "title");
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition-all duration-200 hover:border-kiosk-green/50 hover:bg-white/10 active:scale-[0.98]"
                >
                  <Icon className="h-4 w-4 shrink-0 text-kiosk-green" />
                  <span>{title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="relative h-36 shrink-0 overflow-hidden">
        <Image
          src={footerImageUrl}
          alt="Sidebar footer"
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-kiosk-navy via-kiosk-navy/60 to-transparent" />
        <p className="absolute bottom-4 left-4 right-4 text-center font-script text-sm leading-relaxed text-white/90">
          {footerTagline}
        </p>
      </div>
    </aside>
  );
}
