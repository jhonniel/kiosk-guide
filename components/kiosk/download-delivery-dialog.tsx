"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Mail, QrCode, Loader2, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useKiosk } from "@/hooks/use-kiosk";
import { useOffline } from "@/components/providers/offline-provider";
import type { DownloadDeliverySettings } from "@/features/downloads/download-settings";
import { localized, pickLang } from "@/lib/i18n/translations";
import type { Download } from "@prisma/client";

type Step = "choose" | "qr" | "email" | "email-sent";

interface DownloadDeliveryDialogProps {
  download: Download | null;
  settings: DownloadDeliverySettings;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function DownloadDeliveryDialog({
  download,
  settings,
  open,
  onOpenChange,
}: DownloadDeliveryDialogProps) {
  const { language } = useKiosk();
  const { isOnline } = useOffline();
  const [step, setStep] = useState<Step>("choose");
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState("");
  const [email, setEmail] = useState("");

  const title = download ? localized(download, language, "title") : "";

  useEffect(() => {
    if (!open) {
      setStep("choose");
      setLoading(false);
      setQrDataUrl(null);
      setExpiresAt(null);
      setEmail("");
      return;
    }

    if (!settings.qrEnabled && settings.emailEnabled) {
      setStep("email");
    } else if (settings.qrEnabled && !settings.emailEnabled) {
      void startQrFlow();
    } else {
      setStep("choose");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, download?.id, settings.qrEnabled, settings.emailEnabled]);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setCountdown(formatCountdown(expiresAt.getTime() - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  const offlineMessage = useMemo(
    () =>
      pickLang(
        language,
        "A network connection is required to download or send files by email.",
        "Kailangan ng koneksyon sa network para mag-download o magpadala ng email.",
        "Kinahanglan ang network connection aron makadownload o makapadala ug email."
      ),
    [language]
  );

  async function startQrFlow() {
    if (!download) return;
    if (!isOnline) {
      toast.error(offlineMessage);
      return;
    }

    setStep("qr");
    setLoading(true);
    setQrDataUrl(null);

    try {
      const res = await fetch("/api/downloads/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ downloadId: download.id, lang: language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create QR code");

      const expiry = new Date(data.expiresAt);
      setExpiresAt(expiry);
      const dataUrl = await QRCode.toDataURL(data.url, {
        width: 280,
        margin: 2,
        color: { dark: "#1e3a5f", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create QR code");
      setStep("choose");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!download) return;
    if (!isOnline) {
      toast.error(offlineMessage);
      return;
    }
    if (!settings.smtpConfigured) {
      toast.error(
        pickLang(
          language,
          "Email server is not configured. Please contact the administrator.",
          "Hindi pa naka-configure ang email server. Makipag-ugnayan sa administrator.",
          "Wala pa na-configure ang email server. Kontaka ang administrator."
        )
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/downloads/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ downloadId: download.id, email, lang: language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send email");
      setStep("email-sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{settings.modalTitle}</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        {step === "choose" && (
          <div className="grid gap-3">
            {settings.qrEnabled && (
              <Button
                type="button"
                className="h-auto justify-start gap-3 bg-kiosk-navy px-4 py-4 hover:bg-kiosk-navy/90"
                onClick={() => void startQrFlow()}
              >
                <QrCode className="h-6 w-6 shrink-0" />
                <span className="text-left">
                  <span className="block font-semibold">
                    {pickLang(language, "Scan QR to download", "I-scan ang QR para mag-download", "I-scan ang QR aron makadownload")}
                  </span>
                  <span className="block text-xs font-normal text-white/80">
                    {pickLang(
                      language,
                      `Valid for ${settings.qrExpiryMinutes} minutes`,
                      `May bisa sa loob ng ${settings.qrExpiryMinutes} minuto`,
                      `Valid sulod sa ${settings.qrExpiryMinutes} minuto`
                    )}
                  </span>
                </span>
              </Button>
            )}
            {settings.emailEnabled && (
              <Button
                type="button"
                variant="outline"
                className="h-auto justify-start gap-3 px-4 py-4"
                onClick={() => setStep("email")}
              >
                <Mail className="h-6 w-6 shrink-0 text-kiosk-green" />
                <span className="text-left">
                  <span className="block font-semibold text-kiosk-navy">
                    {pickLang(language, "Send via email", "Ipadala sa email", "Ipadala pinaagi sa email")}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {pickLang(
                      language,
                      "Receive the file as an email attachment",
                      "Matatanggap ang file bilang attachment",
                      "Madawat ang file isip attachment sa email"
                    )}
                  </span>
                </span>
              </Button>
            )}
          </div>
        )}

        {step === "qr" && (
          <div className="flex flex-col items-center gap-4 py-2">
            {loading ? (
              <div className="flex h-[280px] w-[280px] items-center justify-center rounded-2xl bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-kiosk-green" />
              </div>
            ) : qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={pickLang(language, "Download QR code", "QR code para mag-download", "QR code aron makadownload")}
                className="rounded-2xl border bg-white p-3 shadow-sm"
                width={280}
                height={280}
              />
            ) : null}
            {expiresAt && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  {pickLang(language, "Expires in", "Mag-e-expire sa", "Mo-expire sa")} {countdown}
                </span>
              </div>
            )}
            <p className="text-center text-sm text-gray-500">
              {pickLang(
                language,
                "Scan this QR code with your phone camera to download the file.",
                "I-scan ang QR code gamit ang camera ng iyong telepono upang i-download ang file.",
                "I-scan kini nga QR code gamit ang camera sa imong telepono aron makadownload sa file."
              )}
            </p>
            <Button type="button" variant="outline" onClick={() => void startQrFlow()} disabled={loading}>
              {pickLang(language, "Generate new QR", "Gumawa ng bagong QR", "Paghimo og bag-ong QR")}
            </Button>
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div>
              <Label htmlFor="download-email">
                {pickLang(language, "Email address", "Email address", "Email address")}
              </Label>
              <Input
                id="download-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-kiosk-navy hover:bg-kiosk-navy/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {pickLang(language, "Sending…", "Ipinapadala…", "Ginapadala…")}
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {pickLang(language, "Send file", "Ipadala ang file", "Ipadala ang dokumento")}
                </>
              )}
            </Button>
          </form>
        )}

        {step === "email-sent" && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-kiosk-green" />
            <p className="font-medium text-kiosk-navy">
              {pickLang(language, "Email sent!", "Naipadala na ang email!", "Napadala na ang email!")}
            </p>
            <p className="text-sm text-gray-500">
              {pickLang(
                language,
                `Check your inbox at ${email}`,
                `Tingnan ang iyong inbox sa ${email}`,
                `Tan-awa ang imong inbox sa ${email}`
              )}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
