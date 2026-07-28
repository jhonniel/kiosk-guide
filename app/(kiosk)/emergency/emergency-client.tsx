"use client";

import { useMemo, useState } from "react";
import {
  Ambulance,
  Building2,
  Flame,
  Hospital,
  Info,
  Landmark,
  Map,
  Phone,
  Shield,
  Siren,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { localized, pickLang } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { EmergencyContact } from "@prisma/client";

const AREA_ORDER = ["Province", "Mambajao", "Mahinog", "Guinsiliban", "Sagay", "Catarman"] as const;

type AreaFilter = (typeof AREA_ORDER)[number] | "All";

type ServiceTone = {
  iconWrap: string;
  icon: string;
  title: string;
};

function telHref(label: string) {
  const digits = label.replace(/[^\d+]/g, "");
  if (!digits) return undefined;
  return `tel:${digits}`;
}

function phoneEntries(phoneNumber: string) {
  return phoneNumber
    .split(/\s*\/\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function primaryPhone(phoneNumber: string) {
  return phoneEntries(phoneNumber)[0] ?? phoneNumber;
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
  if (lower.includes("ambulance")) return Ambulance;
  if (lower.includes("coast")) return Waves;
  if (lower.includes("disaster") || lower.includes("reduction")) return Building2;
  if (lower.includes("information") || lower.includes("pio")) return Info;
  if (lower.includes("police")) return Shield;
  if (lower.includes("fire")) return Flame;
  if (lower.includes("hospital")) return Hospital;
  if (lower.includes("emergency")) return Siren;
  return Building2;
}

function serviceTone(name: string): ServiceTone {
  const lower = name.toLowerCase();
  if (lower.includes("police") || lower.includes("coast")) {
    return {
      iconWrap: "bg-[#e8f1fb]",
      icon: "text-[#1d6bb8]",
      title: "text-[#1d6bb8]",
    };
  }
  if (lower.includes("fire")) {
    return {
      iconWrap: "bg-[#fff0e6]",
      icon: "text-[#e0671a]",
      title: "text-[#d45a12]",
    };
  }
  if (lower.includes("hospital") || lower.includes("disaster")) {
    return {
      iconWrap: "bg-[#e8f7ef]",
      icon: "text-[#1f9d55]",
      title: "text-[#1b8a4a]",
    };
  }
  if (lower.includes("information") || lower.includes("pio")) {
    return {
      iconWrap: "bg-[#fff4e5]",
      icon: "text-[#d97706]",
      title: "text-[#c2410c]",
    };
  }
  return {
    iconWrap: "bg-[#fde8ea]",
    icon: "text-[#c1121f]",
    title: "text-[#c1121f]",
  };
}

function CallButton({
  phone,
  className,
  fullWidth,
}: {
  phone: string;
  className?: string;
  fullWidth?: boolean;
}) {
  const href = telHref(phone);
  const classes = cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#c1121f] px-4 py-2.5 text-[15px] font-bold text-white shadow-sm shadow-rose-900/10 transition-transform duration-150 hover:bg-[#a50e19] active:scale-[0.98]",
    fullWidth && "w-full",
    className
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        <Phone className="h-4 w-4 shrink-0 opacity-95" strokeWidth={2.5} />
        <span className="tabular-nums tracking-wide">{phone}</span>
      </a>
    );
  }

  return (
    <span className={classes}>
      <Phone className="h-4 w-4 shrink-0 opacity-95" strokeWidth={2.5} />
      <span className="tabular-nums tracking-wide">{phone}</span>
    </span>
  );
}

export function EmergencyClient({ contacts }: { contacts: EmergencyContact[] }) {
  const { language } = useKiosk();
  const [activeArea, setActiveArea] = useState<AreaFilter>("Province");

  const provinceContacts = useMemo(
    () =>
      contacts
        .filter((contact) => contact.category === "Province")
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [contacts]
  );

  const quickAccess = useMemo(() => {
    const preferred = ["emergency", "police", "fire", "hospital"];
    const ranked = [...provinceContacts].sort((a, b) => {
      const aName = a.nameEn.toLowerCase();
      const bName = b.nameEn.toLowerCase();
      const aIdx = preferred.findIndex((key) => aName.includes(key));
      const bIdx = preferred.findIndex((key) => bName.includes(key));
      const aRank = aIdx === -1 ? 99 : aIdx;
      const bRank = bIdx === -1 ? 99 : bIdx;
      if (aRank !== bRank) return aRank - bRank;
      return a.sortOrder - b.sortOrder;
    });
    return ranked.slice(0, 4);
  }, [provinceContacts]);

  const grouped = useMemo(() => {
    return AREA_ORDER.map((area) => ({
      area,
      items: contacts
        .filter((contact) => contact.category === area)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    })).filter((group) => group.items.length > 0);
  }, [contacts]);

  const areaCounts = useMemo(() => {
    const map = Object.fromEntries(grouped.map((group) => [group.area, group.items.length])) as Record<
      string,
      number
    >;
    map.All = contacts.length;
    return map;
  }, [grouped, contacts.length]);

  const listItems = useMemo(() => {
    if (activeArea === "All") {
      return contacts
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((contact) => ({
          contact,
          area: (contact.category as string) || "Other",
        }));
    }
    const group = grouped.find((item) => item.area === activeArea);
    return (group?.items ?? []).map((contact) => ({
      contact,
      area: group?.area ?? activeArea,
    }));
  }, [activeArea, contacts, grouped]);

  if (!contacts.length) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-slate-500">
        {pickLang(language, "No emergency contacts available.", "Walang emergency contacts.", "Walay emergency contacts.")}
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6">
      {/* Quick Access — Province */}
      <section className="kiosk-page-transition">
        <div className="mb-2.5 flex items-center gap-2 sm:mb-3">
          <Zap className="h-4 w-4 text-[#c1121f]" strokeWidth={2.5} fill="currentColor" />
          <h2 className="text-xs font-extrabold tracking-[0.08em] text-kiosk-navy uppercase sm:text-sm">
            {pickLang(
              language,
              "Quick Access — Province",
              "Mabilisang Access — Probinsya",
              "Dalíng Access — Probinsya"
            )}
          </h2>
        </div>

        <div className="kiosk-stagger grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          {quickAccess.map((contact) => {
            const name = localized(contact, language, "name");
            const label = serviceLabel(name, "Province");
            const Icon = serviceIcon(name);
            const tone = serviceTone(name);
            const phone = primaryPhone(contact.phoneNumber);

            return (
              <article
                key={contact.id}
                className="kiosk-hover-lift flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-[0_8px_28px_-18px_rgba(15,23,42,0.45)] ring-1 ring-slate-200/70 sm:gap-4 sm:p-4"
              >
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-300 sm:h-12 sm:w-12",
                      tone.iconWrap
                    )}
                  >
                    <Icon className={cn("h-5 w-5 sm:h-[22px] sm:w-[22px]", tone.icon)} strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <h3 className={cn("text-[13px] font-extrabold leading-snug tracking-wide uppercase", tone.title)}>
                      {label}
                    </h3>
                    <p className="mt-0.5 text-xs font-medium text-slate-400">
                      {pickLang(language, "Province", "Probinsya", "Probinsya")}
                    </p>
                  </div>
                </div>
                <CallButton phone={phone} fullWidth />
              </article>
            );
          })}
        </div>
      </section>

      {/* By Municipality */}
      <section className="min-h-0 flex-1">
        <div className="mb-3 flex items-center gap-2">
          <Landmark className="h-4 w-4 text-kiosk-navy" strokeWidth={2.25} />
          <h2 className="text-sm font-extrabold tracking-[0.08em] text-kiosk-navy uppercase">
            {pickLang(language, "By Municipality", "Ayon sa Munisipyo", "Pinaagi sa Munisipyo")}
          </h2>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {AREA_ORDER.filter((area) => (areaCounts[area] ?? 0) > 0).map((area) => {
            const selected = activeArea === area;
            const count = areaCounts[area] ?? 0;
            return (
              <button
                key={area}
                type="button"
                onClick={() => setActiveArea(area)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
                  selected
                    ? "scale-[1.03] bg-kiosk-navy text-white shadow-md shadow-kiosk-navy/20"
                    : "bg-[#e8eef6] text-kiosk-navy/85 hover:scale-[1.02] hover:bg-[#dce6f3] active:scale-[0.98]"
                )}
              >
                {area === "Province"
                  ? pickLang(language, "Province", "Probinsya", "Probinsya")
                  : area}
                <span
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold transition-colors duration-200",
                    selected ? "bg-white/20 text-white" : "bg-white text-slate-500"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setActiveArea("All")}
            className={cn(
              "ml-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
              activeArea === "All"
                ? "scale-[1.03] bg-kiosk-navy text-white shadow-md shadow-kiosk-navy/20"
                : "bg-white text-kiosk-navy ring-1 ring-slate-200 hover:scale-[1.02] hover:bg-slate-50 active:scale-[0.98]"
            )}
          >
            <Map className="h-4 w-4 text-[#1d6bb8]" strokeWidth={2.25} />
            {pickLang(language, "View All Areas", "Tingnan ang Lahat", "Tan-awa ang Tanan")}
          </button>
        </div>

        <div
          key={activeArea}
          className="kiosk-stagger grid grid-cols-1 gap-3 md:grid-cols-2"
        >
          {listItems.map(({ contact, area }) => {
            const name = localized(contact, language, "name");
            const label = serviceLabel(name, area);
            const Icon = serviceIcon(name);
            const tone = serviceTone(name);
            const phones = phoneEntries(contact.phoneNumber);

            return (
              <article
                key={contact.id}
                className="kiosk-hover-lift flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-[0_6px_22px_-16px_rgba(15,23,42,0.4)] ring-1 ring-slate-200/70"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                      tone.iconWrap
                    )}
                  >
                    <Icon className={cn("h-5 w-5", tone.icon)} strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-bold text-kiosk-navy">{label}</h3>
                    <p className="text-xs font-medium text-slate-400">{area}</p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                  {phones.slice(0, 2).map((phone) => (
                    <CallButton key={phone} phone={phone} className="min-h-10 px-3 py-2 text-sm" />
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Important reminder */}
      <aside className="mt-auto flex flex-col gap-4 rounded-2xl bg-[#fdeced] px-5 py-4 animate-[kiosk-stagger-in_480ms_cubic-bezier(0.22,1,0.36,1)_both] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c1121f] text-sm font-black text-white">
            !
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold tracking-wide text-[#c1121f] uppercase">
              {pickLang(language, "Important Reminder", "Mahalagang Paalala", "Importante nga Paahinumdom")}
            </p>
            <p className="mt-0.5 text-sm leading-snug text-kiosk-navy/80">
              {pickLang(
                language,
                "In case of emergency, stay calm and dial the appropriate hotline. Your safety is our priority.",
                "Sa oras ng emergency, manatiling kalmado at tumawag sa tamang hotline. Priority namin ang inyong kaligtasan.",
                "Kung emergency, magpabilin nga kalmado ug tawagi ang hustong hotline. Una namo ang inyong kaluwasan."
              )}
            </p>
          </div>
        </div>

        <a
          href="tel:911"
          className="flex shrink-0 items-center gap-3 self-end rounded-xl px-2 py-1 transition-transform duration-200 hover:scale-[1.03] hover:opacity-90 active:scale-[0.98] sm:self-center"
        >
          <Phone className="h-7 w-7 text-[#c1121f]" strokeWidth={2.5} />
          <div className="leading-none">
            <p className="text-3xl font-black tracking-tight text-[#c1121f] sm:text-4xl">911</p>
            <p className="mt-1 text-[10px] font-bold tracking-[0.14em] text-kiosk-navy uppercase">
              {pickLang(
                language,
                "National Emergency Hotline",
                "Pambansang Emergency Hotline",
                "Nasudnong Emergency Hotline"
              )}
            </p>
          </div>
        </a>
      </aside>
    </div>
  );
}
