"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Mail, QrCode, Loader2, Clock, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { kioskSyncFetch } from "@/lib/kiosk-sync-fetch";
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
  initialStep?: "choose" | "qr" | "email";
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
  initialStep = "choose",
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
  const [liveSettings, setLiveSettings] = useState<DownloadDeliverySettings | null>(null);

  const activeSettings = liveSettings ?? settings;

  const title = download ? localized(download, language, "title") : "";

  useEffect(() => {
    if (!open) {
      setLiveSettings(null);
      return;
    }

    let cancelled = false;
    async function refreshDeliverySettings() {
      try {
        const res = await kioskSyncFetch(`/api/downloads/delivery-settings?lang=${language}&t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as DownloadDeliverySettings;
        if (!cancelled) setLiveSettings(json);
      } catch {
        // keep offline/bundle settings
      }
    }

    void refreshDeliverySettings();
  }, [open, language]);

  useEffect(() => {
    if (!open) {
      setStep("choose");
      setLoading(false);
      setQrDataUrl(null);
      setExpiresAt(null);
      setEmail("");
      return;
    }

    if (initialStep === "qr" && activeSettings.qrEnabled) {
      void startQrFlow();
    } else if (initialStep === "email" && activeSettings.emailEnabled) {
      setStep("email");
    } else if (!activeSettings.qrEnabled && activeSettings.emailEnabled) {
      setStep("email");
    } else if (activeSettings.qrEnabled && !activeSettings.emailEnabled) {
      void startQrFlow();
    } else {
      setStep("choose");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, download?.id, initialStep, activeSettings.qrEnabled, activeSettings.emailEnabled]);

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
      const res = await kioskSyncFetch("/api/downloads/qr", {
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
    if (!activeSettings.smtpConfigured) {
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
      const res = await kioskSyncFetch("/api/downloads/email", {
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

  const stepHeading =
    step === "qr"
      ? pickLang(language, "Download via QR", "I-download via QR", "I-download via QR")
      : step === "email" || step === "email-sent"
        ? pickLang(language, "Send via Email", "Ipadala sa Email", "Ipadala sa Email")
        : activeSettings.modalTitle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="gap-1 border-b border-gray-100 bg-kiosk-bg px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-kiosk-navy text-white">
              {step === "email" || step === "email-sent" ? (
                <Mail className="h-5 w-5" />
              ) : (
                <QrCode className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-kiosk-navy">{stepHeading}</DialogTitle>
              <DialogDescription className="mt-0.5 truncate text-xs">{title}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5">
          {step === "choose" && (
            <div className="grid gap-2.5">
              {activeSettings.qrEnabled && (
                <button
                  type="button"
                  onClick={() => void startQrFlow()}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-kiosk-navy/40 hover:bg-gray-50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-kiosk-navy/10 text-kiosk-navy">
                    <QrCode className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-kiosk-navy">
                      {pickLang(language, "Download via QR", "I-download via QR", "I-download via QR")}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {pickLang(
                        language,
                        `Valid for ${activeSettings.qrExpiryMinutes} minutes`,
                        `May bisa sa loob ng ${activeSettings.qrExpiryMinutes} minuto`,
                        `Valid sulod sa ${activeSettings.qrExpiryMinutes} minuto`
                      )}
                    </span>
                  </span>
                </button>
              )}
              {activeSettings.emailEnabled && (
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-kiosk-navy/40 hover:bg-gray-50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-kiosk-green">
                    <Mail className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-kiosk-navy">
                      {pickLang(language, "Send via Email", "Ipadala sa Email", "Ipadala sa Email")}
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
                </button>
              )}
            </div>
          )}

          {step === "qr" && (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                {loading ? (
                  <div className="flex h-[232px] w-[232px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-kiosk-green" />
                  </div>
                ) : qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt={pickLang(language, "Download QR code", "QR code para mag-download", "QR code aron makadownload")}
                    width={232}
                    height={232}
                  />
                ) : (
                  <div className="h-[232px] w-[232px]" />
                )}
              </div>

              <p className="max-w-xs text-center text-xs leading-relaxed text-gray-500">
                {pickLang(
                  language,
                  "Scan this QR code with your phone camera to download the file.",
                  "I-scan ang QR code gamit ang camera ng iyong telepono upang i-download ang file.",
                  "I-scan kini nga QR code gamit ang camera sa imong telepono aron makadownload sa file."
                )}
              </p>

              <div className="flex w-full items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-2.5">
                <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                  <Clock className="h-3.5 w-3.5" />
                  {pickLang(language, "Expires in", "Mag-e-expire sa", "Mo-expire sa")}{" "}
                  <span className="font-bold text-kiosk-navy tabular-nums">
                    {expiresAt ? countdown : "—"}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs font-semibold text-kiosk-navy"
                  onClick={() => void startQrFlow()}
                  disabled={loading}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  {pickLang(language, "New QR", "Bagong QR", "Bag-ong QR")}
                </Button>
              </div>
            </div>
          )}

          {step === "email" && (
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <Label htmlFor="download-email" className="text-xs font-semibold text-gray-700">
                  {pickLang(language, "Email address", "Email address", "Email address")}
                </Label>
                <Input
                  id="download-email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 h-11"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  {pickLang(
                    language,
                    "The document will be sent as an attachment.",
                    "Ipapadala ang dokumento bilang attachment.",
                    "Ipadala ang dokumento isip attachment."
                  )}
                </p>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full bg-kiosk-navy font-semibold hover:bg-kiosk-navy/90"
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
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-8 w-8 text-kiosk-green" />
              </span>
              <p className="text-sm font-semibold text-kiosk-navy">
                {pickLang(language, "Email sent!", "Naipadala na ang email!", "Napadala na ang email!")}
              </p>
              <p className="max-w-xs text-xs leading-relaxed text-gray-500">
                {pickLang(
                  language,
                  `We handed off your file to the mail server for ${email}. Delivery can take a few minutes — check Inbox and Spam/Junk.`,
                  `Naipasa na ang file sa mail server para kay ${email}. Maaaring tumagal ng ilang minuto — tingnan ang Inbox at Spam/Junk.`,
                  `Gipasa na ang file sa mail server para kang ${email}. Mahimong molungtad ug pipila ka minuto — tan-awa ang Inbox ug Spam/Junk.`
                )}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1"
                onClick={() => onOpenChange(false)}
              >
                {pickLang(language, "Done", "Tapos na", "Human na")}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
