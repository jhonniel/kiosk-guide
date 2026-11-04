"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  Building2,
  ChevronRight,
  Clock,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Siren,
  type LucideIcon,
} from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { pickLang, type Language } from "@/lib/i18n/translations";
import { uiText } from "@/lib/i18n/kiosk-ui";
import { getLocalizedSetting } from "@/features/settings/settings-helpers";
import { resolveBrandingLogoUrl } from "@/lib/branding";
import { resolveKioskAssetUrl } from "@/lib/kiosk-sync-url";
import { cn } from "@/lib/utils";

interface Props {
  settings: Record<string, string>;
}

/** vCard fields escape commas, semicolons, and backslashes. */
function vcardText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
}

function buildVCard(org: string, phone: string, email: string, address: string) {
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${vcardText(org)}`, `ORG:${vcardText(org)}`];
  if (phone) lines.push(`TEL;TYPE=WORK,VOICE:${phone}`);
  if (email) lines.push(`EMAIL;TYPE=INTERNET,WORK:${email}`);
  if (address) lines.push(`ADR;TYPE=WORK:;;${vcardText(address)};;;;`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

function ContactRow({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-4 px-5 py-4 sm:px-6">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-kiosk-navy/5 text-kiosk-navy">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{label}</p>
        <p className="mt-0.5 text-lg font-semibold break-words text-slate-900 tabular-nums">
          {value || "—"}
        </p>
        <p className="mt-0.5 text-sm text-slate-500">{hint}</p>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
  tone = "navy",
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "navy" | "red" | "green";
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-colors hover:border-slate-300 active:bg-slate-50"
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          tone === "red" && "bg-red-50 text-red-600",
          tone === "green" && "bg-kiosk-green/10 text-kiosk-green",
          tone === "navy" && "bg-kiosk-navy/5 text-kiosk-navy"
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition-transform group-active:translate-x-0.5" />
    </Link>
  );
}

function useContactQr(vcard: string) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(vcard, { width: 360, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [vcard]);
  return dataUrl;
}

function text(language: Language, en: string, fil: string, bis: string) {
  return pickLang(language, en, fil, bis);
}

export function ContactClient({ settings }: Props) {
  const { language } = useKiosk();

  const govName =
    getLocalizedSetting(settings, "gov_name", language) || "Provincial Government of Camiguin";
  const phone = settings.contact_phone?.trim() ?? "";
  const email = settings.contact_email?.trim() ?? "";
  const address = settings.contact_address?.trim() ?? "";
  const hours = getLocalizedSetting(settings, "office_hours", language);
  const logoUrl = resolveKioskAssetUrl(resolveBrandingLogoUrl(settings));
  const qr = useContactQr(buildVCard(getLocalizedSetting(settings, "gov_name", "en") || govName, phone, email, address));

  return (
    <div className="@container space-y-4">
      <div className="grid gap-4 @4xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="" className="h-12 w-12 shrink-0 rounded-full bg-white object-contain p-0.5 shadow-sm" />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-kiosk-navy">{govName}</h2>
              <p className="text-sm text-slate-500">
                {text(language, "Provincial Capitol · Official contact information", "Provincial Capitol · Opisyal na impormasyon", "Provincial Capitol · Opisyal nga impormasyon")}
              </p>
            </div>
          </header>
          <div className="grid divide-y divide-slate-100 @2xl:grid-cols-2 @2xl:divide-y-0">
            <div className="divide-y divide-slate-100">
              <ContactRow
                icon={Phone}
                label={uiText(language, "phoneLabel")}
                value={phone}
                hint={text(language, "Call during office hours", "Tumawag sa oras ng opisina", "Tawag sa oras sa opisina")}
              />
              <ContactRow
                icon={Mail}
                label={uiText(language, "emailLabel")}
                value={email}
                hint={text(language, "For inquiries and service requests", "Para sa mga tanong at kahilingan", "Para sa mga pangutana ug hangyo")}
              />
            </div>
            <div className="divide-y divide-slate-100 @2xl:border-l @2xl:border-slate-100">
              <ContactRow
                icon={MapPin}
                label={uiText(language, "addressLabel")}
                value={address}
                hint={text(language, "Provincial Capitol Building", "Gusali ng Provincial Capitol", "Building sa Provincial Capitol")}
              />
              <ContactRow
                icon={Clock}
                label={uiText(language, "officeHoursLabel")}
                value={hours}
                hint={text(language, "Closed on weekends and public holidays", "Sarado tuwing Sabado, Linggo, at pista opisyal", "Sirado kon Sabado, Domingo, ug holiday")}
              />
            </div>
          </div>
        </section>

        <section className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-6 text-center shadow-sm">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            {text(language, "Save our contact", "I-save ang aming contact", "I-save ang among contact")}
          </p>
          <div className="flex h-44 w-44 items-center justify-center rounded-xl border border-slate-200 bg-white p-2">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="" className="h-full w-full" />
            ) : (
              <div className="h-full w-full animate-pulse rounded-lg bg-slate-100" />
            )}
          </div>
          <p className="max-w-xs text-sm text-slate-600">
            {text(
              language,
              "Scan with your phone camera to save our phone, email, and address.",
              "I-scan gamit ang camera ng phone para ma-save ang aming numero, email, at address.",
              "I-scan gamit ang camera sa phone aron ma-save ang among numero, email, ug address."
            )}
          </p>
        </section>
      </div>

      <section>
        <h3 className="mb-2 px-1 text-sm font-semibold text-slate-700">
          {text(language, "Need something else?", "May iba ka pang kailangan?", "Aduna pay lain nga kinahanglan?")}
        </h3>
        <div className="grid gap-3 @2xl:grid-cols-3">
          <QuickLink
            href="/building-directory"
            icon={Building2}
            title={text(language, "Find an office", "Hanapin ang opisina", "Pangitaa ang opisina")}
            description={text(language, "Rooms and directions inside the Capitol", "Mga kuwarto at direksyon sa Capitol", "Mga kwarto ug direksyon sa Capitol")}
          />
          <QuickLink
            href="/emergency"
            icon={Siren}
            tone="red"
            title={text(language, "Emergency hotlines", "Mga emergency hotline", "Mga emergency hotline")}
            description={text(language, "Police, fire, rescue, and hospitals", "Pulis, bumbero, rescue, at ospital", "Pulis, bombero, rescue, ug ospital")}
          />
          <QuickLink
            href="/feedback"
            icon={MessageSquareText}
            tone="green"
            title={text(language, "Send feedback", "Magpadala ng feedback", "Pagpadala og feedback")}
            description={text(language, "Tell us about your kiosk experience", "Ibahagi ang iyong karanasan sa kiosk", "Isulti ang imong kasinatian sa kiosk")}
          />
        </div>
      </section>
    </div>
  );
}
