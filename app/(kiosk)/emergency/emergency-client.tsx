"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Flame,
  Hospital,
  Phone,
  Shield,
  Siren,
  type LucideIcon,
} from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { localized, pickLang } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { EmergencyContact } from "@prisma/client";

const AREA_ORDER = ["Province", "Mambajao", "Mahinog", "Guinsiliban", "Sagay", "Catarman"] as const;

type Area = (typeof AREA_ORDER)[number] | "Other";

function telHref(label: string) {
  const digits = label.replace(/[^\d+]/g, "");
  // Keep short emergency codes like 911 / 9111
  if (!digits) return undefined;
  return `tel:${digits}`;
}

function phoneEntries(phoneNumber: string) {
  return phoneNumber
    .split(/\s*\/\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function serviceLabel(name: string, area: string) {
  if (area === "Province" && name.startsWith("Province ")) {
    return name.slice("Province ".length);
  }
  if (name.startsWith(`${area} `)) {
    return name.slice(area.length + 1);
  }
  return name;
}

function serviceIcon(name: string): LucideIcon {
  const lower = name.toLowerCase();
  if (lower.includes("police")) return Shield;
  if (lower.includes("fire")) return Flame;
  if (lower.includes("hospital")) return Hospital;
  if (lower.includes("emergency")) return Siren;
  return Building2;
}

function serviceTone(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("police")) return "bg-sky-50 text-sky-700 ring-sky-100";
  if (lower.includes("fire")) return "bg-orange-50 text-orange-700 ring-orange-100";
  if (lower.includes("hospital")) return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (lower.includes("emergency")) return "bg-rose-50 text-rose-700 ring-rose-100";
  return "bg-slate-50 text-slate-700 ring-slate-100";
}

export function EmergencyClient({ contacts }: { contacts: EmergencyContact[] }) {
  const { language } = useKiosk();
  const [activeArea, setActiveArea] = useState<Area>("Province");

  const grouped = useMemo(() => {
    const sections = AREA_ORDER.map((area) => ({
      area: area as Area,
      items: contacts.filter((contact) => contact.category === area),
    })).filter((group) => group.items.length > 0);

    const other = contacts.filter((contact) => !AREA_ORDER.includes(contact.category as (typeof AREA_ORDER)[number]));
    if (other.length) sections.push({ area: "Other", items: other });
    return sections;
  }, [contacts]);

  const areas = grouped.map((group) => group.area);
  const currentArea = areas.includes(activeArea) ? activeArea : areas[0];
  const currentGroup = grouped.find((group) => group.area === currentArea) ?? grouped[0];

  if (!currentGroup) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-slate-500">
        {pickLang(language, "No emergency contacts available.", "Walang emergency contacts.", "Walay emergency contacts.")}
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {areas.map((area) => {
          const count = grouped.find((group) => group.area === area)?.items.length ?? 0;
          const selected = area === currentArea;
          return (
            <button
              key={area}
              type="button"
              onClick={() => setActiveArea(area)}
              className={cn(
                "rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                selected
                  ? "bg-kiosk-navy text-white shadow-md shadow-kiosk-navy/20"
                  : "bg-white text-kiosk-navy/80 ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300"
              )}
            >
              {area}
              <span
                className={cn(
                  "ml-2 inline-flex min-w-5 items-center justify-center rounded-md px-1.5 text-xs font-bold",
                  selected ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <section
        key={currentGroup.area}
        className="kiosk-page-transition overflow-hidden rounded-2xl bg-white shadow-[0_10px_40px_-24px_rgba(15,23,42,0.45)] ring-1 ring-slate-200/80"
      >
        <header className="flex items-end justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-rose-50/40 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-600/80">
              {pickLang(language, "Emergency Hotlines", "Mga Emergency Hotline", "Mga Emergency Hotline")}
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-kiosk-navy sm:text-2xl">
              {currentGroup.area}
            </h2>
          </div>
          <p className="pb-0.5 text-sm font-medium text-slate-500">
            {currentGroup.items.length}{" "}
            {pickLang(language, "services", "serbisyo", "serbisyo")}
          </p>
        </header>

        <ul className="kiosk-stagger divide-y divide-slate-100">
          {currentGroup.items.map((contact) => {
            const name = localized(contact, language, "name");
            const label = serviceLabel(name, currentGroup.area);
            const Icon = serviceIcon(name);
            const phones = phoneEntries(contact.phoneNumber);

            return (
              <li
                key={contact.id}
                className="flex flex-col gap-4 px-5 py-4 transition-colors duration-200 hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="flex min-w-0 items-start gap-3.5">
                  <span
                    className={cn(
                      "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1",
                      serviceTone(name)
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[17px] font-bold leading-snug text-kiosk-navy">{label}</h3>
                    <p className="mt-0.5 text-sm text-slate-500">{currentGroup.area}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {phones.map((phone) => {
                    const href = telHref(phone);
                    const className =
                      "inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#c1121f] px-4 py-2.5 text-[15px] font-bold text-white shadow-sm shadow-rose-900/10 transition-transform duration-150 hover:bg-[#a50e19] active:scale-[0.98]";

                    return href ? (
                      <a key={phone} href={href} className={className}>
                        <Phone className="h-4 w-4 shrink-0 opacity-90" />
                        {phone}
                      </a>
                    ) : (
                      <span key={phone} className={className}>
                        <Phone className="h-4 w-4 shrink-0 opacity-90" />
                        {phone}
                      </span>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
