"use client";

import type { ReactNode } from "react";
import type { Language } from "@/lib/i18n/translations";
import { pickLang } from "@/lib/i18n/translations";

type Props = {
  language: Language;
  title: string;
};

/** Tourism-map legend symbols (matches Camiguin tourist map artwork). */
function LegendIcon({ kind }: { kind: string }): ReactNode {
  switch (kind) {
    case "municipality":
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <path d="M8 2 L14 13 H2 Z" fill="#eab308" stroke="#fff" strokeWidth="1" />
        </svg>
      );
    case "barangay":
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <path d="M8 3 L13 12 H3 Z" fill="#ea580c" stroke="#fff" strokeWidth="1" />
        </svg>
      );
    case "road":
      return (
        <svg width="18" height="10" viewBox="0 0 18 10" aria-hidden>
          <path d="M1 5 H17" stroke="#eab308" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M1 5 H17" stroke="#fff8e7" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "attraction":
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <circle cx="8" cy="8" r="6.5" fill="#f97316" stroke="#fff" strokeWidth="1.5" />
          <circle cx="8" cy="8" r="2.5" fill="#fff7ed" />
          <circle cx="8" cy="8" r="1.2" fill="#ea580c" />
        </svg>
      );
    case "volcano":
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <path d="M8 2 L14 14 H2 Z" fill="#65a30d" stroke="#fff" strokeWidth="1.2" />
        </svg>
      );
    case "port":
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <circle cx="8" cy="8" r="6.5" fill="#1e293b" stroke="#fff" strokeWidth="1.2" />
          <path d="M3.5 9.5 H12.5 L10 5.5 H6 Z" fill="#f8fafc" />
        </svg>
      );
    case "hospital":
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <rect x="2" y="2" width="12" height="12" rx="2" fill="#fff" stroke="#dc2626" strokeWidth="1.2" />
          <path d="M7 4 H9 V7 H12 V9 H9 V12 H7 V9 H4 V7 H7 Z" fill="#dc2626" />
        </svg>
      );
    case "atm":
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <circle cx="8" cy="8" r="6.5" fill="#16a34a" stroke="#fff" strokeWidth="1.2" />
          <text x="8" y="11" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff">
            $
          </text>
        </svg>
      );
    case "marine":
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <ellipse cx="8" cy="9" rx="5.5" ry="4" fill="#f472b6" stroke="#fff" strokeWidth="1" />
          <ellipse cx="8" cy="7.5" rx="3.5" ry="2.2" fill="#fb7185" />
        </svg>
      );
    case "dive":
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <rect x="2" y="2" width="12" height="12" rx="1.5" fill="#dc2626" stroke="#fff" strokeWidth="1" />
          <path d="M2 2 L14 14" stroke="#fff" strokeWidth="2.5" />
        </svg>
      );
    case "snorkel":
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <ellipse cx="6.5" cy="9" rx="3.5" ry="2.8" fill="none" stroke="#dc2626" strokeWidth="1.6" />
          <path d="M10 8 C12 7, 13 5, 12.5 3" fill="none" stroke="#dc2626" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    default:
      return <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />;
  }
}

const LEGEND_ITEMS: Array<Omit<LegendItem, "icon"> & { kind: string }> = [
  {
    id: "municipality",
    kind: "municipality",
    labelEn: "Municipality",
    labelFil: "Munisipalidad",
    labelBis: "Lungsod",
  },
  {
    id: "barangay",
    kind: "barangay",
    labelEn: "Barangay",
    labelFil: "Barangay",
    labelBis: "Barangay",
  },
  {
    id: "road",
    kind: "road",
    labelEn: "Main Roads",
    labelFil: "Pangunahing Kalsada",
    labelBis: "Pangunang Dalan",
  },
  {
    id: "attraction",
    kind: "attraction",
    labelEn: "Tourist Attraction",
    labelFil: "Tourist Attraction",
    labelBis: "Tourist Attraction",
  },
  {
    id: "volcano",
    kind: "volcano",
    labelEn: "Volcano",
    labelFil: "Bulkan",
    labelBis: "Bulkan",
  },
  {
    id: "port",
    kind: "port",
    labelEn: "Port",
    labelFil: "Pantalan",
    labelBis: "Pantalan",
  },
  {
    id: "hospital",
    kind: "hospital",
    labelEn: "Hospital",
    labelFil: "Ospital",
    labelBis: "Ospital",
  },
  {
    id: "atm",
    kind: "atm",
    labelEn: "ATM",
    labelFil: "ATM",
    labelBis: "ATM",
  },
  {
    id: "marine",
    kind: "marine",
    labelEn: "Marine Protected Area",
    labelFil: "Marine Protected Area",
    labelBis: "Marine Protected Area",
  },
  {
    id: "dive",
    kind: "dive",
    labelEn: "Dive Site",
    labelFil: "Dive Site",
    labelBis: "Dive Site",
  },
  {
    id: "snorkel",
    kind: "snorkel",
    labelEn: "Snorkel Area",
    labelFil: "Snorkel Area",
    labelBis: "Snorkel Area",
  },
];

/**
 * Map legend styled like the Camiguin tourism map (bottom-left panel).
 */
export function Legend({ language, title }: Props) {
  return (
    <div className="pointer-events-auto max-h-[min(42vh,320px)] w-[min(220px,42vw)] overflow-y-auto rounded-xl border border-sky-900/15 bg-white/92 px-3 py-2.5 shadow-xl backdrop-blur-md">
      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-600">
        {title}
      </p>
      <ul className="space-y-1.5">
        {LEGEND_ITEMS.map((item) => {
          const label = pickLang(language, item.labelEn, item.labelFil, item.labelBis);
          return (
            <li key={item.id} className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
              <span className="flex h-4 w-5 shrink-0 items-center justify-center">
                <LegendIcon kind={item.kind} />
              </span>
              <span className="leading-tight">{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
