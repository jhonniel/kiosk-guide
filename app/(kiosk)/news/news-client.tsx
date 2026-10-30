"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Calendar, ChevronRight } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { localized, pickLang } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { Announcement } from "@prisma/client";
import {
  NewsDetailModal,
  NewsThumb as Thumb,
  newsCategoryBadgeClass as categoryBadgeClass,
  newsCategoryLabel as categoryLabel,
} from "@/components/kiosk/news-detail-modal";

const ROTATE_MS = 20_000;
const FADE_MS = 900;

function FeaturedContent({
  item,
  language,
  onOpen,
  className,
}: {
  item: Announcement;
  language: ReturnType<typeof useKiosk>["language"];
  onOpen: (item: Announcement) => void;
  className?: string;
}) {
  const title = localized(item, language, "title");
  const content = localized(item, language, "content");

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      aria-label={`${pickLang(language, "Open", "Buksan", "Ablihi")} ${title}`}
      className={cn(
        "group relative col-start-1 row-start-1 flex h-full min-h-0 w-full overflow-hidden text-left",
        className
      )}
    >
      <Thumb
        item={item}
        sizesHint="(min-width: 1024px) 640px, 100vw"
        className="absolute inset-0 transition duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-kiosk-navy via-kiosk-navy/75 to-kiosk-navy/10" />
      <div className="relative mt-auto flex w-full flex-col p-5 sm:p-7">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-block rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider text-white",
              categoryBadgeClass(item.category)
            )}
          >
            {categoryLabel(item.category)}
          </span>
          <p className="flex items-center gap-1.5 text-xs font-medium text-white/80">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(item.publishedAt), "MMMM d, yyyy")}
          </p>
        </div>
        <h3 className="line-clamp-3 text-2xl leading-tight font-bold text-white sm:text-3xl">{title}</h3>
        <p className="mt-3 line-clamp-3 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">{content}</p>
        <span className="mt-5 inline-flex w-fit items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-kiosk-navy">
          {pickLang(language, "Read More", "Magbasa Pa", "Basaha Pa")}
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
}

export function NewsClient({ announcements }: { announcements: Announcement[] }) {
  const { language } = useKiosk();
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const cleanupTimerRef = useRef<number | null>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const indexRef = useRef(featuredIndex);
  indexRef.current = featuredIndex;

  const safeIndex =
    announcements.length === 0 ? 0 : Math.min(featuredIndex, announcements.length - 1);
  const featured = announcements[safeIndex];
  const previous = previousIndex !== null ? announcements[previousIndex] : null;
  const rest = announcements.filter((_, index) => index !== safeIndex);

  function openNews(item: Announcement) {
    setIsClosing(false);
    setSelected(item);
  }

  function closeNews() {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      setSelected(null);
      setIsClosing(false);
    }, 200);
  }

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeNews();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => {
    if (announcements.length < 2) return;

    const timer = window.setInterval(() => {
      // Don't rotate while a news detail modal is open
      if (selectedRef.current) return;

      const current = indexRef.current;
      setPreviousIndex(current);
      setFeaturedIndex((current + 1) % announcements.length);
      if (cleanupTimerRef.current) window.clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = window.setTimeout(() => setPreviousIndex(null), FADE_MS + 100);
    }, ROTATE_MS);

    return () => {
      window.clearInterval(timer);
      if (cleanupTimerRef.current) window.clearTimeout(cleanupTimerRef.current);
    };
  }, [announcements.length]);

  useEffect(() => {
    if (featuredIndex >= announcements.length) setFeaturedIndex(0);
  }, [announcements.length, featuredIndex]);

  if (!featured) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
        {pickLang(language, "No announcements yet.", "Wala pang anunsyo.", "Wala pay anunsyo.")}
      </p>
    );
  }

  return (
    <>
      <div
        className={cn(
          "grid min-h-0 flex-1 gap-4",
          rest.length > 0 && "lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.9fr)]"
        )}
      >
        {/* Card shell stays put; old and new content crossfade in the same grid cell */}
        <article className="grid h-full min-h-0 overflow-hidden rounded-3xl bg-kiosk-navy shadow-md">
          {previous && previous.id !== featured.id && (
            <FeaturedContent
              key={`out-${previous.id}`}
              item={previous}
              language={language}
              onOpen={openNews}
              className="news-xfade-out pointer-events-none"
            />
          )}
          <FeaturedContent
            key={featured.id}
            item={featured}
            language={language}
            onOpen={openNews}
            className={previous && previous.id !== featured.id ? "news-xfade-in" : undefined}
          />
        </article>

        {rest.length > 0 && (
          <div className="kiosk-main-scroll flex h-full min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain">
            {rest.map((item) => {
              const title = localized(item, language, "title");
              const content = localized(item, language, "content");

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openNews(item)}
                  className="flex w-full shrink-0 items-start gap-3.5 rounded-2xl bg-white p-3.5 text-left shadow-sm ring-1 ring-slate-200/80 transition hover:ring-slate-300"
                >
                  <div className="relative h-[4.75rem] w-[4.75rem] shrink-0 overflow-hidden rounded-xl">
                    <Thumb item={item} sizesHint="76px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-block shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide text-white",
                          categoryBadgeClass(item.category)
                        )}
                      >
                        {categoryLabel(item.category)}
                      </span>
                      <span className="truncate text-xs font-medium text-slate-500">
                        {format(new Date(item.publishedAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <h3 className="mt-1.5 line-clamp-2 text-[15px] leading-snug font-semibold text-kiosk-navy">
                      {title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-snug text-slate-500">{content}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <NewsDetailModal
          item={selected}
          language={language}
          isClosing={isClosing}
          onClose={closeNews}
        />
      )}
    </>
  );
}
