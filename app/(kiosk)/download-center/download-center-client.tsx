"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Download, FileText, Info, Smartphone } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { localized, pickLang } from "@/lib/i18n/translations";
import { DownloadDeliveryDialog } from "@/components/kiosk/download-delivery-dialog";
import type { DownloadDeliverySettings } from "@/features/downloads/download-settings";
import type { Download as DownloadModel } from "@prisma/client";
import { cn } from "@/lib/utils";

interface DownloadCenterClientProps {
  downloads: DownloadModel[];
  deliverySettings: DownloadDeliverySettings;
}

type CategoryStyle = { iconBg: string; badge: string };

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  forms: { iconBg: "bg-blue-600", badge: "bg-blue-100 text-blue-700" },
  form: { iconBg: "bg-blue-600", badge: "bg-blue-100 text-blue-700" },
  business: { iconBg: "bg-blue-600", badge: "bg-blue-100 text-blue-700" },
  permits: { iconBg: "bg-emerald-600", badge: "bg-emerald-100 text-emerald-700" },
  permit: { iconBg: "bg-emerald-600", badge: "bg-emerald-100 text-emerald-700" },
  guidelines: { iconBg: "bg-red-500", badge: "bg-red-100 text-red-600" },
  brochures: { iconBg: "bg-teal-600", badge: "bg-teal-100 text-teal-700" },
  reports: { iconBg: "bg-violet-600", badge: "bg-violet-100 text-violet-700" },
  heritage: { iconBg: "bg-amber-600", badge: "bg-amber-100 text-amber-700" },
  general: { iconBg: "bg-orange-500", badge: "bg-orange-100 text-orange-600" },
};

function categoryStyle(category: string | null): CategoryStyle {
  const key = (category ?? "general").toLowerCase();
  return CATEGORY_STYLES[key] ?? CATEGORY_STYLES.general;
}

function categoryLabel(category: string | null) {
  const value = category?.trim() || "General";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function FileQr({ fileUrl, title }: { fileUrl: string; title: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const absolute = fileUrl.startsWith("http")
      ? fileUrl
      : `${window.location.origin}${fileUrl}`;
    QRCode.toDataURL(absolute, {
      width: 180,
      margin: 1,
      color: { dark: "#1e2a4a", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  if (!dataUrl) {
    return <div className="h-[104px] w-[104px] animate-pulse rounded-lg bg-gray-100" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt={`QR code for ${title}`}
      width={104}
      height={104}
      className="h-[104px] w-[104px] rounded-lg border border-gray-200 bg-white p-1"
    />
  );
}

export function DownloadCenterClient({
  downloads,
  deliverySettings,
}: DownloadCenterClientProps) {
  const { language } = useKiosk();
  const [selected, setSelected] = useState<DownloadModel | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const deliveryEnabled = deliverySettings.qrEnabled || deliverySettings.emailEnabled;

  const categories = useMemo(() => {
    const unique = new Map<string, string>();
    for (const item of downloads) {
      const label = categoryLabel(item.category);
      unique.set(label.toLowerCase(), label);
    }
    return [...unique.values()].sort((a, b) => a.localeCompare(b));
  }, [downloads]);

  const visible = useMemo(() => {
    if (activeCategory === "all") return downloads;
    return downloads.filter(
      (item) => categoryLabel(item.category).toLowerCase() === activeCategory
    );
  }, [activeCategory, downloads]);

  function handleScanClick(item: DownloadModel) {
    if (!deliveryEnabled) {
      window.open(item.fileUrl, "_blank");
      return;
    }
    setSelected(item);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-800 via-blue-700 to-blue-500 px-6 py-8 text-white shadow-lg sm:px-8">
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -right-16 bottom-[-60px] h-56 w-56 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/10">
            <Download className="h-8 w-8" />
          </span>
          <div>
            <h2 className="text-2xl font-extrabold tracking-wide uppercase sm:text-3xl">
              {pickLang(language, "Download Center", "Sentro ng Pag-download", "Sentro sa Pag-download")}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-blue-100 sm:text-base">
              {pickLang(
                language,
                "Scan the QR code to download forms, permit templates and public brochures.",
                "I-scan ang QR code para i-download ang mga form, permit template at pampublikong brochure.",
                "I-scan ang QR code aron makadownload og mga form, permit template ug pampublikong brochure."
              )}
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-bold tracking-wider text-kiosk-navy uppercase">
            {pickLang(language, "Document Categories", "Mga Kategorya ng Dokumento", "Mga Kategorya sa Dokumento")}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-bold transition-colors",
                activeCategory === "all"
                  ? "bg-teal-600 text-white shadow"
                  : "bg-white text-kiosk-navy ring-1 ring-gray-200 hover:bg-gray-50"
              )}
            >
              {pickLang(language, "All", "Lahat", "Tanan")}
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category.toLowerCase())}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-bold transition-colors",
                  activeCategory === category.toLowerCase()
                    ? "bg-teal-600 text-white shadow"
                    : "bg-white text-kiosk-navy ring-1 ring-gray-200 hover:bg-gray-50"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-blue-50 px-5 py-4 ring-1 ring-blue-100 lg:max-w-sm">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Info className="h-5 w-5" />
          </span>
          <p className="text-sm leading-relaxed text-blue-900">
            {pickLang(
              language,
              "Scan the QR code using your mobile phone to open the file in your browser.",
              "I-scan ang QR code gamit ang iyong cellphone para buksan ang file sa browser.",
              "I-scan ang QR code gamit ang imong cellphone aron maablihan ang file sa browser."
            )}
          </p>
        </div>
      </div>

      <div className="kiosk-stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((item) => {
          const style = categoryStyle(item.category);
          const title = localized(item, language, "title");
          const description = localized(item, language, "description");

          return (
            <div
              key={item.id}
              className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm",
                      style.iconBg
                    )}
                  >
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm leading-snug font-bold text-kiosk-navy">{title}</h3>
                    <span
                      className={cn(
                        "mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                        style.badge
                      )}
                    >
                      {categoryLabel(item.category)}
                    </span>
                  </div>
                </div>
                {description ? (
                  <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-gray-600">
                    {description}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col items-center gap-2">
                <FileQr fileUrl={item.fileUrl} title={title} />
                <button
                  type="button"
                  onClick={() => handleScanClick(item)}
                  className="flex items-center gap-1.5 rounded-lg bg-kiosk-navy px-3 py-1.5 text-[11px] font-bold text-white transition-transform hover:scale-[1.03]"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  {pickLang(language, "SCAN QR", "I-SCAN ANG QR", "I-SCAN ANG QR")}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          {pickLang(
            language,
            "No documents in this category yet.",
            "Wala pang dokumento sa kategoryang ito.",
            "Wala pay dokumento niini nga kategorya."
          )}
        </div>
      )}

      <DownloadDeliveryDialog
        download={selected}
        settings={deliverySettings}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
