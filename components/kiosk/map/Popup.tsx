"use client";

import Image from "next/image";
import { Clock3, Heart, MapPinned, Share2, Ticket, X, Navigation2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Attraction } from "@/features/map/types";
import { categoryMeta } from "@/features/map/categories";
import type { Language } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

function pick(lang: Language, s: { en: string; fil: string; bis: string }) {
  if (lang === "fil") return s.fil;
  if (lang === "bis") return s.bis;
  return s.en;
}

export type DetailLabels = {
  fee: string;
  hours: string;
  tips: string;
  directions: string;
  share: string;
  favorite: string;
  travelTime: string;
  distance: string;
  nearby: string;
};

type SharedProps = {
  attraction: Attraction | null;
  language: Language;
  favorite: boolean;
  onClose: () => void;
  onFavorite: () => void;
  onShare: () => void;
  onDirections: () => void;
  labels: DetailLabels;
};

function AttractionBody({
  attraction,
  language,
  favorite,
  onFavorite,
  onShare,
  onDirections,
  labels,
}: Omit<SharedProps, "onClose"> & { attraction: Attraction }) {
  const meta = categoryMeta(attraction.category);
  const cat =
    language === "fil"
      ? meta?.labelFil
      : language === "bis"
        ? meta?.labelBis
        : meta?.labelEn;

  return (
    <>
      <div className="relative h-40 w-full overflow-hidden sm:h-44">
        <Image
          src={attraction.photos[0] ?? "/images/tourism/tourism-white-island.png"}
          alt={pick(language, attraction.name)}
          fill
          className="object-cover"
          sizes="400px"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
        <div className="absolute right-3 bottom-3 left-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">{cat}</p>
          <h3 className="text-lg font-bold text-white drop-shadow">{pick(language, attraction.name)}</h3>
          <p className="text-xs text-white/80">★ {attraction.rating.toFixed(1)}</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <p className="text-sm leading-relaxed text-slate-600">
          {pick(language, attraction.description)}
        </p>

        {attraction.photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {attraction.photos.slice(0, 4).map((src) => (
              <div key={src} className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg">
                <Image src={src} alt="" fill className="object-cover" sizes="80px" unoptimized />
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-2 rounded-xl bg-slate-50/90 p-3 text-sm text-slate-700">
          <p className="flex items-start gap-2">
            <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-kiosk-green" />
            <span>
              <span className="font-semibold text-kiosk-navy">{labels.fee}: </span>
              {pick(language, attraction.entranceFee)}
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-kiosk-green" />
            <span>
              <span className="font-semibold text-kiosk-navy">{labels.hours}: </span>
              {pick(language, attraction.openingHours)}
            </span>
          </p>
          <p className="flex items-start gap-2">
            <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-kiosk-green" />
            <span>
              <span className="font-semibold text-kiosk-navy">{labels.distance}: </span>
              {pick(language, attraction.distanceFromCapitol)}
            </span>
          </p>
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-kiosk-navy">{labels.travelTime}: </span>
            {pick(language, attraction.travelTime)}
          </p>
        </div>

        <p className="text-xs leading-relaxed text-slate-500">
          <span className="font-semibold text-kiosk-navy">{labels.tips}: </span>
          {pick(language, attraction.travelTips)}
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onDirections}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-kiosk-green px-3 py-2.5 text-sm font-bold text-white"
          >
            <Navigation2 className="h-4 w-4" />
            {labels.directions}
          </button>
          <button
            type="button"
            onClick={onShare}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-kiosk-navy ring-1 ring-slate-200"
            aria-label={labels.share}
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onFavorite}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl ring-1",
              favorite
                ? "bg-rose-500 text-white ring-rose-500"
                : "bg-white text-kiosk-navy ring-slate-200"
            )}
            aria-label={labels.favorite}
          >
            <Heart className={cn("h-4 w-4", favorite && "fill-current")} />
          </button>
        </div>
      </div>
    </>
  );
}

export function AttractionPopup(props: SharedProps) {
  const { attraction, onClose } = props;
  return (
    <AnimatePresence>
      {attraction && (
        <motion.div
          data-map-popup
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="pointer-events-auto absolute right-3 bottom-3 z-30 hidden w-[min(360px,calc(100%-1.5rem))] overflow-hidden rounded-3xl border border-white/40 bg-white/90 shadow-2xl backdrop-blur-xl xl:hidden lg:block"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 rounded-full bg-black/35 p-1.5 text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <AttractionBody {...props} attraction={attraction} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AttractionSidebar({
  attraction,
  nearby,
  language,
  onSelectNearby,
  ...rest
}: SharedProps & {
  nearby: Attraction[];
  onSelectNearby: (id: string) => void;
}) {
  return (
    <AnimatePresence>
      {attraction && (
        <motion.aside
          initial={{ x: 28, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 24, opacity: 0 }}
          className="pointer-events-auto absolute top-3 right-3 bottom-3 z-30 hidden w-[340px] overflow-y-auto rounded-3xl border border-white/40 bg-white/88 shadow-2xl backdrop-blur-xl xl:block"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={rest.onClose}
            className="absolute top-3 right-3 z-10 rounded-full bg-black/35 p-1.5 text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <AttractionBody {...rest} attraction={attraction} language={language} />
          {nearby.length > 0 && (
            <div className="border-t border-slate-100 px-4 pb-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {rest.labels.nearby}
              </p>
              <div className="flex flex-wrap gap-2">
                {nearby.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => onSelectNearby(n.id)}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-kiosk-navy hover:bg-kiosk-green/15"
                  >
                    {pick(language, n.name)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export function AttractionBottomSheet(props: SharedProps) {
  const { attraction, onClose } = props;
  return (
    <AnimatePresence>
      {attraction && (
        <motion.div
          data-map-popup
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
          className="pointer-events-auto absolute inset-x-0 bottom-0 z-40 max-h-[70vh] overflow-y-auto rounded-t-3xl border border-white/40 bg-white/95 shadow-2xl backdrop-blur-xl lg:hidden"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 flex justify-center bg-white/80 py-2 backdrop-blur">
            <span className="h-1.5 w-12 rounded-full bg-slate-300" />
            <button
              type="button"
              onClick={onClose}
              className="absolute top-2 right-3 rounded-full bg-slate-100 p-1.5 text-slate-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <AttractionBody {...props} attraction={attraction} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
