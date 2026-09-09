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

  const flush = hideHeader && hideBanner;

  return (
    <div
      className={cn(
        "flex flex-1 flex-col",
        fit && "h-full min-h-0 basis-0 overflow-hidden"
      )}
    >
      {!hideHeader && (
        <div
          className={cn(
            "sticky top-0 z-30 shrink-0",
            flush ? "" : "px-4 sm:px-6 lg:px-8"
          )}
        >
          <PageHeader title={title} language={language} compact showTitle={hideBanner} />
        </div>
      )}

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          flush ? "p-0" : "px-4 pb-4 pt-0 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8",
          fit && !flush && "pb-2"
        )}
      >
      {!hideBanner && (
        <section
          className={cn(
            "relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-r from-kiosk-navy via-[#1f3a68] to-blue-600 px-4 py-4 text-white shadow-lg sm:mb-6 sm:px-6 sm:py-6 lg:px-8 lg:py-7",
            fit && "mb-3 py-3.5 sm:mb-4 sm:py-5"
          )}
        >
          <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -right-20 bottom-[-70px] h-60 w-60 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-3 sm:gap-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/10 sm:h-14 sm:w-14 lg:h-16 lg:w-16">
              <Icon className="h-5 w-5 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-extrabold tracking-wide uppercase sm:text-2xl lg:text-3xl">
                {title}
              </h2>
              {description && (
                <p className="mt-1 line-clamp-2 max-w-3xl text-xs text-blue-100 sm:text-sm lg:text-base">
                  {description}
                </p>
              )}
              {bannerMeta && (
                <div className="mt-1.5 text-xs font-medium text-blue-200 sm:text-sm">{bannerMeta}</div>
              )}
            </div>
            {bannerAction && <div className="hidden shrink-0 sm:block">{bannerAction}</div>}
          </div>
        </section>
      )}

      <div className={cn("flex min-h-0 flex-1 flex-col", fit ? "overflow-hidden" : "overflow-y-auto")}>
        {children}
      </div>
      </div>
    </div>
  );
}
