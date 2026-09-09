"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Info, Mail, QrCode, TrendingUp } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { localized, pickLang } from "@/lib/i18n/translations";
import { DownloadDeliveryDialog } from "@/components/kiosk/download-delivery-dialog";
import type { DownloadDeliverySettings } from "@/features/downloads/download-settings";
import type { Download as DownloadModel } from "@prisma/client";
import { cn } from "@/lib/utils";
import { kioskSyncFetch } from "@/lib/kiosk-sync-fetch";

interface DownloadCenterClientProps {
  downloads: DownloadModel[];
  deliverySettings: DownloadDeliverySettings;
}

type CategoryStyle = { icon: string; badge: string };

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  forms: { icon: "bg-blue-50 text-blue-600", badge: "bg-blue-50 text-blue-700" },
  form: { icon: "bg-blue-50 text-blue-600", badge: "bg-blue-50 text-blue-700" },
  business: { icon: "bg-blue-50 text-blue-600", badge: "bg-blue-50 text-blue-700" },
  permits: { icon: "bg-emerald-50 text-emerald-600", badge: "bg-emerald-50 text-emerald-700" },
  permit: { icon: "bg-emerald-50 text-emerald-600", badge: "bg-emerald-50 text-emerald-700" },
  guidelines: { icon: "bg-rose-50 text-rose-600", badge: "bg-rose-50 text-rose-700" },
  brochures: { icon: "bg-teal-50 text-teal-600", badge: "bg-teal-50 text-teal-700" },
  reports: { icon: "bg-violet-50 text-violet-600", badge: "bg-violet-50 text-violet-700" },
  heritage: { icon: "bg-amber-50 text-amber-600", badge: "bg-amber-50 text-amber-700" },
  tourism: { icon: "bg-teal-50 text-teal-600", badge: "bg-teal-50 text-teal-700" },
  tax: { icon: "bg-indigo-50 text-indigo-600", badge: "bg-indigo-50 text-indigo-700" },
  health: { icon: "bg-cyan-50 text-cyan-600", badge: "bg-cyan-50 text-cyan-700" },
  social: { icon: "bg-pink-50 text-pink-600", badge: "bg-pink-50 text-pink-700" },
  employment: { icon: "bg-orange-50 text-orange-600", badge: "bg-orange-50 text-orange-700" },
  ordinance: { icon: "bg-rose-50 text-rose-600", badge: "bg-rose-50 text-rose-700" },
  general: { icon: "bg-slate-100 text-slate-600", badge: "bg-slate-100 text-slate-600" },
};

function categoryStyle(category: string | null): CategoryStyle {
  const key = (category ?? "general").toLowerCase();
  return CATEGORY_STYLES[key] ?? CATEGORY_STYLES.general;
}

function categoryLabel(category: string | null) {
  const value = category?.trim() || "General";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function DownloadCenterClient({
  downloads,
  deliverySettings,
}: DownloadCenterClientProps) {
  const { language } = useKiosk();
  const [selected, setSelected] = useState<DownloadModel | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"qr" | "email">("qr");
  const [activeCategory, setActiveCategory] = useState<string>("most");
  const [rankedDownloads, setRankedDownloads] = useState(downloads);

  const deliveryEnabled = deliverySettings.qrEnabled || deliverySettings.emailEnabled;

  useEffect(() => {
    let active = true;

    async function refreshRankings() {
      try {
        const response = await kioskSyncFetch("/api/downloads/rankings", { cache: "no-store" });
        if (!response.ok) return;
        const latest = (await response.json()) as DownloadModel[];
        if (active) setRankedDownloads(latest);
      } catch {
        // Keep using the offline bundle when the rankings endpoint is unavailable.
      }
    }

    void refreshRankings();
    const interval = window.setInterval(refreshRankings, 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const categories = useMemo(() => {
    const unique = new Map<string, string>();
    for (const item of rankedDownloads) {
      const label = categoryLabel(item.category);
      unique.set(label.toLowerCase(), label);
    }
    return [...unique.values()].sort((a, b) => a.localeCompare(b));
  }, [rankedDownloads]);

  const visible = useMemo(() => {
    if (activeCategory === "most") return rankedDownloads;
    return rankedDownloads.filter(
      (item) => categoryLabel(item.category).toLowerCase() === activeCategory
    );
  }, [activeCategory, rankedDownloads]);

  function handleDeliveryClick(item: DownloadModel, method: "qr" | "email") {
    if (!deliveryEnabled) {
      window.open(item.fileUrl, "_blank");
      return;
    }
    setDeliveryMethod(method);
    setSelected(item);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory("most")}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors",
                activeCategory === "most"
                  ? "bg-kiosk-navy text-white"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-kiosk-navy"
              )}
            >
              <TrendingUp className="h-4 w-4" />
              {pickLang(language, "Most Downloads", "Pinakamaraming Download", "Pinakadaghan og Download")}
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category.toLowerCase())}
                className={cn(
                  "h-10 rounded-full px-4 text-sm font-semibold transition-colors",
                  activeCategory === category.toLowerCase()
                    ? "bg-kiosk-navy text-white"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-kiosk-navy"
                )}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2 text-sm text-gray-500">
            <Info className="h-4 w-4 shrink-0 text-kiosk-navy/60" />
            <p>
              {pickLang(
                language,
                "Get any document on your phone — scan a QR code or receive it by email.",
                "Makuha ang anumang dokumento sa iyong telepono — mag-scan ng QR o matanggap sa email.",
                "Makuha ang bisan unsang dokumento sa imong telepono — i-scan ang QR o madawat sa email."
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="kiosk-stagger grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {visible.map((item, index) => {
          const style = categoryStyle(item.category);
          const title = localized(item, language, "title");
          const description = localized(item, language, "description");

          return (
            <div
              key={item.id}
              className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:border-gray-200 hover:shadow-md"
            >
              <div className="flex flex-1 gap-3 p-3.5 sm:gap-3.5 sm:p-5">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11",
                    style.icon
                  )}
                >
                  <FileText className="h-5 w-5" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "inline-block w-fit rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                        style.badge
                      )}
                    >
                      {categoryLabel(item.category)}
                    </span>
                    {activeCategory === "most" && (
                      <span className="text-[10px] font-semibold whitespace-nowrap text-gray-400">
                        #{index + 1} · {item.downloadCount}{" "}
                        {pickLang(language, "downloads", "download", "download")}
                      </span>
                    )}
                  </div>
                  <h3 className="line-clamp-2 text-[14px] leading-snug font-bold text-kiosk-navy sm:text-[15px]">{title}</h3>
                  {description ? (
                    <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
                      {description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2 px-3.5 pb-3.5 sm:px-5 sm:pb-5">
                {deliverySettings.qrEnabled && (
                  <button
                    type="button"
                    onClick={() => handleDeliveryClick(item, "qr")}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-kiosk-navy px-3 text-[13px] font-semibold whitespace-nowrap text-white transition-colors hover:bg-kiosk-navy/90"
                  >
                    <QrCode className="h-4 w-4 shrink-0" />
                    {pickLang(language, "Download via QR", "I-download via QR", "I-download via QR")}
                  </button>
                )}
                {deliverySettings.emailEnabled && (
                  <button
                    type="button"
                    onClick={() => handleDeliveryClick(item, "email")}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-[13px] font-semibold whitespace-nowrap text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-kiosk-navy"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    {pickLang(language, "Send via Email", "Ipadala sa Email", "Ipadala sa Email")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {visible.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center sm:p-12">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400">
            <FileText className="h-6 w-6" />
          </span>
          <p className="text-sm font-medium text-gray-600">
            {pickLang(
              language,
              "No documents in this category yet.",
              "Wala pang dokumento sa kategoryang ito.",
              "Wala pay dokumento niini nga kategorya."
            )}
          </p>
          <p className="text-xs text-gray-400">
            {pickLang(
              language,
              "Try another category to see more documents.",
              "Subukan ang ibang kategorya upang makakita ng iba pang dokumento.",
              "Sulayi ang laing kategorya aron makakita og dugang dokumento."
            )}
          </p>
        </div>
      )}

      <DownloadDeliveryDialog
        download={selected}
        settings={deliverySettings}
        open={dialogOpen}
        initialStep={deliveryMethod}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
