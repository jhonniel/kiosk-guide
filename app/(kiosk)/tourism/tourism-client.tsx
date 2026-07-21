"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { FlipHorizontal2, MapPin, Palmtree } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { localized } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Tourism } from "@prisma/client";

const CATEGORY_STYLES: Record<string, { label: string; badge: string }> = {
  beach: { label: "Beach & Islands", badge: "bg-sky-100 text-sky-700" },
  nature: { label: "Nature & Springs", badge: "bg-emerald-100 text-emerald-700" },
  heritage: { label: "Heritage", badge: "bg-amber-100 text-amber-700" },
  adventure: { label: "Adventure", badge: "bg-rose-100 text-rose-700" },
};

export function TourismClient({ items }: { items: Tourism[] }) {
  const { language } = useKiosk();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPhoto, setShowPhoto] = useState(false);
  const selected = items.find((item) => item.id === selectedId) ?? null;

  const viewPhotoLabel =
    language === "fil"
      ? "Tingnan ang litrato"
      : language === "bis"
        ? "Tan-awa ang litrato"
        : "View photo";
  const viewInfoLabel =
    language === "fil"
      ? "Balik sa detalye"
      : language === "bis"
        ? "Balik sa detalye"
        : "Back to info";

  function openItem(id: string) {
    setShowPhoto(false);
    setSelectedId(id);
  }

  const categories = useMemo(() => {
    const present = new Set(items.map((item) => item.category ?? ""));
    return Object.keys(CATEGORY_STYLES).filter((key) => present.has(key));
  }, [items]);

  const visible =
    activeCategory === "all"
      ? items
      : items.filter((item) => item.category === activeCategory);

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveCategory("all");
            setSelectedId(null);
          }}
          className={cn(
            "rounded-full px-5 py-2.5 text-sm font-semibold transition-all",
            activeCategory === "all"
              ? "bg-kiosk-navy text-white shadow-md"
              : "bg-white text-kiosk-navy shadow-sm hover:shadow-md"
          )}
        >
          All Spots
        </button>
        {categories.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setActiveCategory(key);
              setSelectedId(null);
            }}
            className={cn(
              "rounded-full px-5 py-2.5 text-sm font-semibold transition-all",
              activeCategory === key
                ? "bg-kiosk-navy text-white shadow-md"
                : "bg-white text-kiosk-navy shadow-sm hover:shadow-md"
            )}
          >
            {CATEGORY_STYLES[key].label}
          </button>
        ))}
      </div>

      <div className="kiosk-stagger grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => {
          const category = CATEGORY_STYLES[item.category ?? ""];
          const title = localized(item, language, "title");
          const description = localized(item, language, "description");

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => openItem(item.id)}
              className="group kiosk-hover-lift flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kiosk-green"
              aria-label={title}
            >
              <div className="relative h-48 w-full shrink-0 bg-pink-50">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Palmtree className="h-12 w-12 text-pink-500" />
                  </div>
                )}
                {category && (
                  <span
                    className={cn(
                      "absolute top-3 left-3 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase shadow-sm",
                      category.badge
                    )}
                  >
                    {category.label}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="mb-1.5 text-[17px] leading-snug font-bold text-kiosk-navy">
                  {title}
                </h3>
                {item.location && (
                  <p className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-kiosk-green" />
                    {item.location}
                  </p>
                )}
                <p className="line-clamp-2 text-sm leading-relaxed text-gray-600">
                  {description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
        {selected && (
          <DialogContent
            className="w-[min(760px,calc(100%-2rem))] max-w-none gap-0 overflow-visible border-0 bg-transparent p-0 shadow-none ring-0 sm:max-w-[760px]"
            showCloseButton={false}
          >
            <div className="h-[min(78vh,560px)] [perspective:1600px]">
              <div
                className="relative h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [transform-style:preserve-3d]"
                style={{ transform: showPhoto ? "rotateY(180deg)" : "rotateY(0deg)" }}
              >
                {/* Front: info only */}
                <div className="absolute inset-0 flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl [backface-visibility:hidden]">
                  <div className="relative flex flex-col items-center border-b border-gray-100 px-14 pt-7 pb-5 text-center">
                    {CATEGORY_STYLES[selected.category ?? ""] && (
                      <span
                        className={cn(
                          "mb-3 inline-block rounded-full px-3 py-1.5 text-xs font-bold tracking-wide uppercase",
                          CATEGORY_STYLES[selected.category ?? ""].badge
                        )}
                      >
                        {CATEGORY_STYLES[selected.category ?? ""].label}
                      </span>
                    )}
                    <DialogTitle className="text-2xl font-extrabold text-kiosk-navy sm:text-3xl">
                      {localized(selected, language, "title")}
                    </DialogTitle>
                    {selected.location && (
                      <p className="mt-2 flex items-center justify-center gap-2 text-sm font-medium text-gray-500">
                        <MapPin className="h-4 w-4 shrink-0 text-kiosk-green" />
                        {selected.location}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-7 py-6">
                    <DialogDescription className="my-auto text-center text-[16px] leading-8 text-gray-600">
                      {localized(selected, language, "description")}
                    </DialogDescription>
                  </div>
                  <div className="flex justify-center border-t border-gray-100 p-4">
                    <button
                      type="button"
                      onClick={() => setShowPhoto(true)}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-kiosk-navy text-white shadow-md transition-transform hover:scale-110 active:scale-95"
                      aria-label={viewPhotoLabel}
                      title={viewPhotoLabel}
                    >
                      <FlipHorizontal2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Back: photo */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  {selected.imageUrl ? (
                    <Image
                      src={selected.imageUrl}
                      alt={localized(selected, language, "title")}
                      fill
                      sizes="760px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-pink-50">
                      <Palmtree className="h-16 w-16 text-pink-500" />
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-kiosk-navy/85 via-kiosk-navy/35 to-transparent" />
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                  <div className="absolute right-6 bottom-20 left-6 text-white">
                    <h3 className="text-2xl font-extrabold sm:text-3xl">
                      {localized(selected, language, "title")}
                    </h3>
                    {selected.location && (
                      <p className="mt-2 flex items-center gap-2 text-sm text-white/90">
                        <MapPin className="h-4 w-4 text-kiosk-green" />
                        {selected.location}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPhoto(false)}
                    className="absolute bottom-4 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
                    aria-label={viewInfoLabel}
                    title={viewInfoLabel}
                  >
                    <FlipHorizontal2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
