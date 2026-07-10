"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { localized } from "@/lib/i18n/translations";
import { uiTextFn } from "@/lib/i18n/kiosk-ui";
import { ContentCard } from "@/components/kiosk/content-card";
import { DownloadDeliveryDialog } from "@/components/kiosk/download-delivery-dialog";
import type { DownloadDeliverySettings } from "@/features/downloads/download-settings";
import type { Download as DownloadModel } from "@prisma/client";

interface DownloadCenterClientProps {
  downloads: DownloadModel[];
  deliverySettings: DownloadDeliverySettings;
}

export function DownloadCenterClient({
  downloads,
  deliverySettings,
}: DownloadCenterClientProps) {
  const { language } = useKiosk();
  const [selected, setSelected] = useState<DownloadModel | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const deliveryEnabled = deliverySettings.qrEnabled || deliverySettings.emailEnabled;

  function handleDownloadClick(item: DownloadModel) {
    if (!deliveryEnabled) {
      window.open(item.fileUrl, "_blank");
      return;
    }
    setSelected(item);
    setDialogOpen(true);
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {downloads.map((item) => (
          <ContentCard key={item.id} className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-kiosk-navy">{localized(item, language, "title")}</h3>
              <p className="text-sm text-gray-500">{item.fileName}</p>
            </div>
            <button
              type="button"
              onClick={() => handleDownloadClick(item)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kiosk-navy text-white transition-transform hover:scale-105"
              aria-label={uiTextFn(language, "downloadAria", localized(item, language, "title"))}
            >
              <Download className="h-4 w-4" />
            </button>
          </ContentCard>
        ))}
      </div>

      <DownloadDeliveryDialog
        download={selected}
        settings={deliverySettings}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
