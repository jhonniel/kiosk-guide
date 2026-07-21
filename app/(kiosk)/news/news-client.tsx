"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Calendar, ChevronRight, Megaphone, X } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { localized, pickLang } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { Announcement } from "@prisma/client";

const CATEGORY_BADGES: Record<string, string> = {
  advisory: "bg-blue-600",
  program: "bg-kiosk-green",
  "public notice": "bg-purple-600",
  announcement: "bg-orange-500",
};

const ROTATE_MS = 20_000;
const FADE_MS = 900;

function categoryBadgeClass(category: string | null) {
  return CATEGORY_BADGES[(category ?? "announcement").toLowerCase()] ?? "bg-orange-500";
}

function categoryLabel(category: string | null) {
  return (category?.trim() || "Announcement").toUpperCase();
}

function Thumb({
  item,
  className,
  sizesHint,
}: {
  item: Announcement;
  className?: string;
  sizesHint: string;
}) {
  if (item.imageUrl) {
    return (
      <Image
        src={item.imageUrl}
        alt=""
        fill
        sizes={sizesHint}
        className={cn("object-cover", className)}
        unoptimized
      />
    );
  }
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-kiosk-navy to-blue-600",
        className
      )}
    >
      <Megaphone className="h-8 w-8 text-white/60" />
    </div>
  );
}

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
    <div className={cn("col-start-1 row-start-1 flex min-h-0 flex-col", className)}>
      <button
        type="button"
        className="relative aspect-[16/9] w-full shrink-0 overflow-hidden text-left"
        onClick={() => onOpen(item)}
        aria-label={`${pickLang(language, "Open", "Buksan", "Ablihi")} ${title}`}
      >
        <Thumb item={item} sizesHint="(min-width: 1024px) 45vw, 100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        <div className="absolute right-4 bottom-4 left-4">
          <span
            className={cn(
              "inline-block rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wider text-white",
              categoryBadgeClass(item.category)
            )}
          >
            {categoryLabel(item.category)}
          </span>
          <h3 className="mt-2 text-xl leading-snug font-bold text-white sm:text-2xl">{title}</h3>
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-white/90">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(item.publishedAt), "MMMM d, yyyy")}
          </p>
        </div>
      </button>
      <div className="flex min-h-0 flex-1 flex-col p-5">
        <p className="line-clamp-3 text-sm leading-relaxed text-gray-700">{content}</p>
        <button
          type="button"
          onClick={() => onOpen(item)}
          className="mt-3 inline-flex items-center gap-1 self-start text-sm font-bold text-blue-700 hover:text-kiosk-navy"
        >
          {pickLang(language, "Read More", "Magbasa Pa", "Basaha Pa")}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function NewsClient({ announcements }: { announcements: Announcement[] }) {
  const { language } = useKiosk();
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Warm the browser cache so crossfades never reveal a half-loaded image
  useEffect(() => {
    for (const item of announcements) {
      if (item.imageUrl) {
        const img = new window.Image();
        img.src = item.imageUrl;
      }
    }
  }, [announcements]);

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
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Card shell stays put; old and new content crossfade in the same grid cell */}
        <article className="kiosk-hover-lift grid min-h-0 overflow-hidden rounded-2xl bg-white shadow-md">
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

        <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain pr-1">
          {rest.map((item) => {
            const title = localized(item, language, "title");
            const content = localized(item, language, "content");

            return (
              <article
                key={item.id}
                className="kiosk-hover-lift flex shrink-0 cursor-pointer gap-4 overflow-hidden rounded-2xl bg-white p-3 shadow-md"
                onClick={() => openNews(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") openNews(item);
                }}
              >
                <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl">
                  <Thumb item={item} sizesHint="128px" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        "inline-block shrink-0 rounded-md px-2 py-0.5 text-[9px] font-bold tracking-wider text-white",
                        categoryBadgeClass(item.category)
                      )}
                    >
                      {categoryLabel(item.category)}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(item.publishedAt), "MMMM d, yyyy")}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-sm leading-snug font-bold text-kiosk-navy">{title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-600">{content}</p>
                </div>
              </article>
            );
          })}
        </div>
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

function NewsDetailModal({
  item,
  language,
  isClosing,
  onClose,
}: {
  item: Announcement;
  language: ReturnType<typeof useKiosk>["language"];
  isClosing: boolean;
  onClose: () => void;
}) {
  const title = localized(item, language, "title");
  const content = localized(item, language, "content");

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex items-center justify-center bg-kiosk-navy/80 p-4 backdrop-blur-sm sm:p-6",
        isClosing ? "charter-modal-backdrop-out" : "charter-modal-backdrop-in"
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="news-detail-title"
      onClick={onClose}
    >
      <article
        className={cn(
          "flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl",
          isClosing ? "charter-modal-panel-out" : "charter-modal-panel-in"
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative aspect-[16/7] min-h-52 w-full shrink-0 overflow-hidden">
          <Thumb item={item} sizesHint="896px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-kiosk-navy shadow-lg hover:bg-white"
            aria-label={pickLang(language, "Close news", "Isara ang balita", "Isira ang balita")}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute right-5 bottom-5 left-5 sm:right-7 sm:bottom-7 sm:left-7">
            <span
              className={cn(
                "inline-block rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wider text-white",
                categoryBadgeClass(item.category)
              )}
            >
              {categoryLabel(item.category)}
            </span>
            <h2
              id="news-detail-title"
              className="mt-2 max-w-3xl text-xl leading-tight font-bold text-white sm:text-3xl"
            >
              {title}
            </h2>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-white/90">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(item.publishedAt), "MMMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="overflow-y-auto p-5 sm:p-7">
          <p className="whitespace-pre-line text-base leading-8 text-gray-700">{content}</p>
        </div>
      </article>
    </div>
  );
}
