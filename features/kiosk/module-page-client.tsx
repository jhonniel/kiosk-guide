"use client";

import { useKiosk } from "@/hooks/use-kiosk";
import { localized } from "@/lib/i18n/translations";
import { PageHeader } from "@/components/kiosk/page-header";
import { getIcon } from "@/utils/icon-map";
import { cn } from "@/lib/utils";

interface ModulePageClientProps {
  titleEn: string;
  titleFil: string;
  titleBis?: string;
  descriptionEn?: string;
  descriptionFil?: string;
  descriptionBis?: string;
  icon?: string;
  /** Lock the page to the viewport height (no scrolling); children fill the rest. */
  fit?: boolean;
  /** Hide the large gradient title banner (useful when the content is visual, e.g. the map). */
  hideBanner?: boolean;
  /** Hide the compact page header (back + title + date/time). */
  hideHeader?: boolean;
  /** Optional element rendered on the right side of the gradient banner. */
  bannerAction?: React.ReactNode;
  /** Optional secondary line shown under the banner description. */
  bannerMeta?: React.ReactNode;
  children: React.ReactNode;
}

export function ModulePageClient({
  titleEn,
  titleFil,
  titleBis,
  descriptionEn,
  descriptionFil,
  descriptionBis,
  icon = "FileText",
  fit = false,
  hideBanner = false,
  hideHeader = false,
  bannerAction,
  bannerMeta,
  children,
}: ModulePageClientProps) {
  const { language } = useKiosk();
  const title = localized({ titleEn, titleFil, titleBis }, language, "title");
  const description = localized(
    { descriptionEn, descriptionFil, descriptionBis },
    language,
    "description"
  );
  const Icon = getIcon(icon);

  return (
    <div
      className={cn(
        "flex flex-1 flex-col p-8",
        fit && "h-full min-h-0 basis-0 overflow-hidden pb-2"
      )}
    >
      {!hideHeader && <PageHeader title={title} language={language} compact />}

      {!hideBanner && (
        <section
          className={cn(
            "relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-kiosk-navy via-[#1f3a68] to-blue-600 px-6 py-7 text-white shadow-lg sm:px-8",
            fit && "mb-4 py-5"
          )}
        >
          <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -right-20 bottom-[-70px] h-60 w-60 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/10">
              <Icon className="h-8 w-8" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-extrabold tracking-wide uppercase sm:text-3xl">{title}</h2>
              {description && (
                <p className="mt-1 max-w-3xl text-sm text-blue-100 sm:text-base">{description}</p>
              )}
              {bannerMeta && (
                <div className="mt-1.5 text-xs font-medium text-blue-200 sm:text-sm">{bannerMeta}</div>
              )}
            </div>
            {bannerAction && <div className="shrink-0">{bannerAction}</div>}
          </div>
        </section>
      )}

      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
