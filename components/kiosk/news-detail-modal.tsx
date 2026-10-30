"use client";

import Image from "next/image";
import { format } from "date-fns";
import { Calendar, Megaphone, X } from "lucide-react";
import type { Announcement } from "@prisma/client";
import { localized, pickLang, type Language } from "@/lib/i18n/translations";
import { resolveKioskAssetUrl } from "@/lib/kiosk-sync-url";
import { cn } from "@/lib/utils";

const CATEGORY_BADGES: Record<string, string> = {
  advisory: "bg-blue-600",
  program: "bg-kiosk-green",
  "public notice": "bg-purple-600",
  announcement: "bg-orange-500",
};

export function newsCategoryBadgeClass(category: string | null) {
  return CATEGORY_BADGES[(category ?? "announcement").toLowerCase()] ?? "bg-orange-500";
}

export function newsCategoryLabel(category: string | null) {
  return (category?.trim() || "Announcement").toUpperCase();
}

export function NewsThumb({
  item,
  className,
  sizesHint,
  fit = "cover",
}: {
  item: Announcement;
  className?: string;
  sizesHint: string;
  fit?: "cover" | "contain";
}) {
  if (item.imageUrl) {
    return (
      <Image
        src={resolveKioskAssetUrl(item.imageUrl)}
        alt=""
        fill
        sizes={sizesHint}
        className={cn(fit === "contain" ? "object-contain p-2" : "object-cover", className)}
        unoptimized
        loading="eager"
        decoding="async"
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

export function NewsDetailModal({
  item,
  language,
  isClosing,
  onClose,
}: {
  item: Announcement;
  language: Language;
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
        <div className="relative shrink-0 border-b border-gray-100">
          <div className="relative h-[min(28vh,220px)] w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 sm:h-[min(30vh,240px)]">
            <NewsThumb item={item} sizesHint="768px" fit="contain" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-kiosk-navy shadow-lg hover:bg-white"
            aria-label={pickLang(language, "Close news", "Isara ang balita", "Isira ang balita")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5 sm:p-7">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-block rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wider text-white",
                newsCategoryBadgeClass(item.category)
              )}
            >
              {newsCategoryLabel(item.category)}
            </span>
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(item.publishedAt), "MMMM d, yyyy")}
            </p>
          </div>
          <h2
            id="news-detail-title"
            className="max-w-3xl text-xl leading-tight font-bold text-kiosk-green sm:text-2xl"
          >
            {title}
          </h2>
          <p className="mt-5 whitespace-pre-line text-base leading-8 text-gray-700">{content}</p>
        </div>
      </article>
    </div>
  );
}
