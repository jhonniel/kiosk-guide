"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  ChevronRight,
  FileText,
  Gavel,
  HeartPulse,
  Landmark,
  ListChecks,
  Search,
  Shield,
  Trees,
  Users,
  Wallet,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import type {
  CharterEditionView,
  CharterOfficeView,
  CharterServiceView,
} from "@/features/citizens-charter/types";
import { cn } from "@/lib/utils";

interface CitizensCharterClientProps {
  edition: CharterEditionView | null;
}

const OFFICE_THEMES: Array<{
  match: RegExp;
  icon: LucideIcon;
  accent: string;
  soft: string;
  badge: string;
}> = [
  {
    match: /hospital|health|medical|clinic|pharmacy/i,
    icon: HeartPulse,
    accent: "bg-[#0f766e]",
    soft: "bg-[#ecfdf8]",
    badge: "text-[#0f766e] bg-[#d1fae5]",
  },
  {
    match: /treasury|accounting|budget|finance|cashier|revenue/i,
    icon: Wallet,
    accent: "bg-[#1d4ed8]",
    soft: "bg-[#eff6ff]",
    badge: "text-[#1d4ed8] bg-[#dbeafe]",
  },
  {
    match: /engineer|works|infrastructure|building/i,
    icon: Wrench,
    accent: "bg-[#b45309]",
    soft: "bg-[#fffbeb]",
    badge: "text-[#b45309] bg-[#fef3c7]",
  },
  {
    match: /agriculture|fisher|veterinary|environment|tourism/i,
    icon: Trees,
    accent: "bg-[#15803d]",
    soft: "bg-[#f0fdf4]",
    badge: "text-[#15803d] bg-[#dcfce7]",
  },
  {
    match: /legal|attorney|prosecutor|justice|bids|awards|bac/i,
    icon: Gavel,
    accent: "bg-[#6d28d9]",
    soft: "bg-[#f5f3ff]",
    badge: "text-[#6d28d9] bg-[#ede9fe]",
  },
  {
    match: /social|welfare|youth|women|senior|employment|human/i,
    icon: Users,
    accent: "bg-[#be185d]",
    soft: "bg-[#fdf2f8]",
    badge: "text-[#be185d] bg-[#fce7f3]",
  },
  {
    match: /police|safety|disaster|risk|security|fire/i,
    icon: Shield,
    accent: "bg-[#b91c1c]",
    soft: "bg-[#fef2f2]",
    badge: "text-[#b91c1c] bg-[#fee2e2]",
  },
  {
    match: /governor|administrator|planning|sanggunian|records/i,
    icon: Landmark,
    accent: "bg-kiosk-navy",
    soft: "bg-[#eef2ff]",
    badge: "text-kiosk-navy bg-[#e0e7ff]",
  },
];

function themeForOffice(name: string) {
  return (
    OFFICE_THEMES.find((theme) => theme.match.test(name)) ?? {
      match: /.*/,
      icon: Building2,
      accent: "bg-kiosk-navy",
      soft: "bg-[#f1f5f9]",
      badge: "text-kiosk-navy bg-[#e2e8f0]",
    }
  );
}

function normalizeSearchText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function matchesSearch(values: unknown[], query: string) {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = normalizeSearchText(values.join(" "));
  return terms.every((term) => haystack.includes(term));
}

function serviceMatches(service: CharterServiceView, query: string) {
  return matchesSearch(
    [
      service.name,
      service.pageNumber,
      service.description,
      service.officeOrDivision,
      service.classification,
      service.typeOfTransaction,
      service.whoMayAvail,
      ...service.details,
      ...service.requirements.flatMap((item) => [
        item.requirement,
        item.whereToSecure,
      ]),
      ...service.steps.flatMap((item) => [
        item.step,
        item.action,
        item.fee,
        item.time,
        item.person,
      ]),
      ...service.medicines.flatMap((item) => [
        item.name,
        item.preparation,
        item.brand,
        item.price,
      ]),
    ],
    query
  );
}

export function CitizensCharterClient({ edition }: CitizensCharterClientProps) {
  const [query, setQuery] = useState("");
  const [expandedOfficeId, setExpandedOfficeId] = useState<string | null>(null);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [isOfficeClosing, setIsOfficeClosing] = useState(false);
  const [isServiceClosing, setIsServiceClosing] = useState(false);
  const officeCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serviceCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const groups = useMemo(() => {
    const offices = edition?.offices ?? [];
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return offices;

    if (
      edition &&
      matchesSearch(
        [
          edition.title,
          edition.year,
          edition.editionLabel,
          edition.description,
          edition.pdfFileName,
        ],
        trimmedQuery
      )
    ) {
      return offices;
    }

    return offices.flatMap((office) => {
      if (matchesSearch([office.name], trimmedQuery)) return [office];

      const categories = office.categories.flatMap((category) => {
        if (matchesSearch([category.name], trimmedQuery)) return [category];

        const services = category.services.filter((service) =>
          serviceMatches(service, trimmedQuery)
        );
        return services.length ? [{ ...category, services }] : [];
      });

      return categories.length ? [{ ...office, categories }] : [];
    });
  }, [edition?.offices, query]);

  const activeGroup = useMemo(
    () => groups.find((group) => group.id === expandedOfficeId) ?? null,
    [expandedOfficeId, groups]
  );

  const activeService = useMemo(() => {
    if (!activeGroup || !expandedServiceId) return null;
    for (const category of activeGroup.categories) {
      const found = category.services.find((service) => service.id === expandedServiceId);
      if (found) return found;
    }
    return null;
  }, [activeGroup, expandedServiceId]);

  const openOffice = useCallback((officeId: string) => {
    if (officeCloseTimerRef.current) clearTimeout(officeCloseTimerRef.current);
    if (serviceCloseTimerRef.current) clearTimeout(serviceCloseTimerRef.current);
    setIsOfficeClosing(false);
    setIsServiceClosing(false);
    setExpandedServiceId(null);
    setExpandedOfficeId(officeId);
  }, []);

  const closeService = useCallback(() => {
    if (isServiceClosing || !expandedServiceId) return;
    setIsServiceClosing(true);
    serviceCloseTimerRef.current = setTimeout(() => {
      setExpandedServiceId(null);
      setIsServiceClosing(false);
      serviceCloseTimerRef.current = null;
    }, 220);
  }, [expandedServiceId, isServiceClosing]);

  const closeOffice = useCallback(() => {
    if (isOfficeClosing) return;
    if (expandedServiceId) {
      closeService();
      return;
    }
    setIsOfficeClosing(true);
    officeCloseTimerRef.current = setTimeout(() => {
      setExpandedOfficeId(null);
      setExpandedServiceId(null);
      setIsOfficeClosing(false);
      officeCloseTimerRef.current = null;
    }, 220);
  }, [closeService, expandedServiceId, isOfficeClosing]);

  const openService = useCallback((serviceId: string) => {
    if (serviceCloseTimerRef.current) clearTimeout(serviceCloseTimerRef.current);
    setIsServiceClosing(false);
    setExpandedServiceId(serviceId);
  }, []);

  useEffect(() => {
    if (!activeGroup) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeOffice();
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeGroup, closeOffice]);

  useEffect(
    () => () => {
      if (officeCloseTimerRef.current) clearTimeout(officeCloseTimerRef.current);
      if (serviceCloseTimerRef.current) clearTimeout(serviceCloseTimerRef.current);
    },
    []
  );

  if (!edition) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <FileText className="mx-auto mb-3 h-8 w-8 text-gray-300" />
        <p className="font-semibold text-kiosk-navy">Citizens&apos; Charter is not published yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Ask an administrator to publish a draft edition from the admin panel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-[0_8px_30px_rgba(15,35,70,0.05)] backdrop-blur-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search any service, requirement, step, fee, person, or medicine…"
            aria-label="Search all Citizens' Charter data"
            className="w-full rounded-xl border-0 bg-[#f5f8fc] py-3.5 pr-4 pl-12 text-sm text-kiosk-navy outline-none ring-1 ring-slate-200/80 transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-kiosk-navy/20"
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-3 px-1">
          <p className="text-xs font-medium text-slate-500">
            {query.trim()
              ? `${groups.length} matching ${groups.length === 1 ? "office" : "offices"}`
              : `${groups.length} offices available`}
          </p>
          {query.trim() && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-xs font-semibold text-kiosk-navy transition hover:text-kiosk-green"
            >
              Clear search
            </button>
          )}
        </div>
      </div>

      {groups.length ? (
        <>
          <div className="kiosk-stagger grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {groups.map((group) => {
              const serviceCount = group.categories.reduce(
                (total, category) => total + category.services.length,
                0
              );
              const categoryCount = group.categories.length;
              const isActive = expandedOfficeId === group.id;
              const theme = themeForOffice(group.name);
              const Icon = theme.icon;

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => openOffice(group.id)}
                  className={cn(
                    "group relative flex min-h-[168px] flex-col overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-[0_6px_20px_rgba(15,35,70,0.05)] transition-all duration-300",
                    "hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(15,35,70,0.12)] active:scale-[0.99]",
                    isActive
                      ? "border-kiosk-green ring-2 ring-kiosk-green/25"
                      : "border-slate-200/80 hover:border-kiosk-navy/20"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm",
                        theme.accent
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide",
                        theme.badge
                      )}
                    >
                      {serviceCount} {serviceCount === 1 ? "service" : "services"}
                    </span>
                  </div>

                  <h3 className="mt-4 line-clamp-3 text-[15px] leading-snug font-bold text-kiosk-navy">
                    {group.name}
                  </h3>

                  <p className="mt-auto pt-4 text-xs font-medium text-slate-500">
                    {categoryCount} {categoryCount === 1 ? "category" : "categories"}
                  </p>
                </button>
              );
            })}
          </div>

          {activeGroup && (
            <OfficeModal
              group={activeGroup}
              isOfficeClosing={isOfficeClosing}
              isServiceClosing={isServiceClosing}
              expandedServiceId={expandedServiceId}
              activeService={activeService}
              onCloseOffice={closeOffice}
              onOpenService={openService}
              onCloseService={closeService}
            />
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Search className="h-6 w-6" />
          </div>
          <p className="text-lg font-bold text-kiosk-navy">No matching services found</p>
          <p className="mt-1 text-sm text-slate-500">
            Try another office, requirement, step, fee, or person name.
          </p>
        </div>
      )}
    </div>
  );
}

function OfficeModal({
  group,
  isOfficeClosing,
  isServiceClosing,
  expandedServiceId,
  activeService,
  onCloseOffice,
  onOpenService,
  onCloseService,
}: {
  group: CharterOfficeView;
  isOfficeClosing: boolean;
  isServiceClosing: boolean;
  expandedServiceId: string | null;
  activeService: CharterServiceView | null;
  onCloseOffice: () => void;
  onOpenService: (serviceId: string) => void;
  onCloseService: () => void;
}) {
  const theme = themeForOffice(group.name);
  const Icon = theme.icon;
  const serviceCount = group.categories.reduce(
    (total, category) => total + category.services.length,
    0
  );

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-kiosk-navy/65 p-3 backdrop-blur-sm sm:p-6 ${
        isOfficeClosing ? "charter-modal-backdrop-out" : "charter-modal-backdrop-in"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="charter-office-title"
      onClick={onCloseOffice}
    >
      <section
        className={`flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 ${
          isOfficeClosing ? "charter-modal-panel-out" : "charter-modal-panel-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center gap-4 border-b border-slate-100 bg-white px-5 py-5">
          <span
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm",
              theme.accent
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.16em] text-kiosk-green uppercase">
              List of Services
            </p>
            <h3 id="charter-office-title" className="text-lg font-bold text-kiosk-navy">
              {group.name}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {serviceCount} {serviceCount === 1 ? "service" : "services"} · {group.categories.length}{" "}
              {group.categories.length === 1 ? "category" : "categories"}
            </p>
          </div>
          <button
            type="button"
            onClick={onCloseOffice}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-kiosk-navy"
            aria-label="Close list of services"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-6 overflow-y-auto bg-[#f7f9fc] p-4 sm:p-6">
          {group.categories.map((category) => (
            <div key={category.id}>
              <div className="mb-3 flex items-center gap-3">
                <h4 className="text-xs font-bold tracking-[0.14em] text-kiosk-navy uppercase">
                  {category.name}
                </h4>
                <div className="h-px flex-1 bg-slate-200" />
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
                  {category.services.length}
                </span>
              </div>
              <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {category.services.map((service, serviceIndex) => {
                  const isSelected = expandedServiceId === service.id;
                  return (
                    <li key={service.id}>
                      <button
                        type="button"
                        onClick={() => onOpenService(service.id)}
                        className={cn(
                          "flex min-h-[148px] w-full flex-col rounded-2xl border bg-white p-3.5 text-left shadow-sm transition-all duration-300",
                          "hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]",
                          isSelected
                            ? "border-kiosk-green ring-2 ring-kiosk-green/20"
                            : "border-slate-200/80 hover:border-kiosk-navy/20"
                        )}
                      >
                        <div className="mb-2.5 flex items-start justify-between gap-2">
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                              theme.accent
                            )}
                          >
                            {serviceIndex + 1}
                          </span>
                          <span className="flex items-center gap-1.5">
                            {service.pageNumber != null && (
                              <span className="rounded-lg bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
                                p. {service.pageNumber}
                              </span>
                            )}
                            <ChevronRight className="h-4 w-4 text-kiosk-green" />
                          </span>
                        </div>
                        <p className="text-sm leading-snug font-semibold text-kiosk-navy">
                          {service.name}
                        </p>
                        {service.details.length > 0 && (
                          <ul className="mt-2 space-y-1 text-xs text-slate-600">
                            {service.details.slice(0, 2).map((detail) => (
                              <li
                                key={detail}
                                className="line-clamp-1 before:mr-1.5 before:text-kiosk-green before:content-['•']"
                              >
                                {detail}
                              </li>
                            ))}
                          </ul>
                        )}
                        {service.requirements.length > 0 && (
                          <p className="mt-auto flex items-center gap-1 pt-3 text-[10px] font-semibold text-kiosk-green">
                            <ListChecks className="h-3.5 w-3.5" />
                            {service.requirements.length}{" "}
                            {service.requirements.length === 1 ? "requirement" : "requirements"} ·
                            Tap to view
                          </p>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {activeService && (
        <ServiceDetailModal
          service={activeService}
          officeName={group.name}
          isClosing={isServiceClosing}
          onClose={onCloseService}
        />
      )}
    </div>
  );
}

function ServiceDetailModal({
  service,
  officeName,
  isClosing,
  onClose,
}: {
  service: CharterServiceView;
  officeName: string;
  isClosing: boolean;
  onClose: () => void;
}) {
  const requirements = service.requirements;
  const steps = service.steps;
  const medicines = service.medicines;
  const metaRows = (
    [
      ["Office or Division:", service.officeOrDivision],
      ["Classification:", service.classification],
      ["Type of Transaction:", service.typeOfTransaction],
      ["Who may avail:", service.whoMayAvail],
    ] as const
  ).filter(([, value]) => Boolean(value));

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-kiosk-navy/80 p-3 backdrop-blur-sm sm:p-6 ${
        isClosing ? "charter-modal-backdrop-out" : "charter-modal-backdrop-in"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="charter-service-title"
      onClick={onClose}
    >
      <section
        className={`flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-kiosk-green/40 bg-white shadow-2xl ${
          isClosing ? "charter-modal-panel-out" : "charter-modal-panel-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start gap-3 border-b border-gray-100 bg-kiosk-bg px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-wider text-kiosk-green uppercase">
              {officeName}
              {service.pageNumber != null ? ` · p. ${service.pageNumber}` : ""}
            </p>
            <h3 id="charter-service-title" className="mt-1 font-bold text-kiosk-navy">
              {service.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-100 hover:text-kiosk-navy"
            aria-label="Close service details"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 overflow-y-auto p-4 sm:p-5">
          {service.description && (
            <p className="text-sm leading-relaxed text-gray-700">{service.description}</p>
          )}

          {metaRows.length > 0 && (
            <table className="w-full border-collapse overflow-hidden rounded-lg text-sm ring-1 ring-gray-300">
              <tbody>
                {metaRows.map(([label, value]) => (
                  <tr key={label} className="border-b border-gray-300 last:border-b-0">
                    <th className="w-[38%] border-r border-gray-300 bg-sky-100 px-3 py-2.5 text-left align-top font-bold text-gray-900">
                      {label}
                    </th>
                    <td className="bg-white px-3 py-2.5 align-top text-gray-800">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {service.details.length > 0 && (
            <ul className="grid gap-x-4 gap-y-1 text-sm text-gray-600 sm:grid-cols-2">
              {service.details.map((detail) => (
                <li key={detail} className="before:mr-2 before:text-kiosk-green before:content-['•']">
                  {detail}
                </li>
              ))}
            </ul>
          )}

          {requirements.length > 0 ? (
            <div className="overflow-hidden rounded-lg ring-1 ring-gray-200">
              <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <p className="bg-kiosk-navy px-3 py-2 text-[10px] font-bold tracking-wider text-white uppercase">
                  Checklist of Requirements
                </p>
                <p className="bg-kiosk-green px-3 py-2 text-[10px] font-bold tracking-wider text-white uppercase">
                  Where to Secure
                </p>
              </div>
              {requirements.map((item) => {
                if (item.isSection) {
                  return (
                    <p
                      key={item.id}
                      className="border-t border-gray-200 bg-slate-100 px-3 py-2 text-[11px] font-bold tracking-wide text-kiosk-navy uppercase"
                    >
                      {item.requirement}
                    </p>
                  );
                }

                const rowTone = item.sortOrder % 2 ? "bg-gray-50/70" : "bg-white";
                return (
                  <div
                    key={item.id}
                    className={`grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] border-t border-gray-100 ${rowTone}`}
                  >
                    <p className="flex gap-2 px-3 py-2.5 text-xs leading-relaxed text-gray-700">
                      <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-kiosk-green" />
                      <span>{item.requirement}</span>
                    </p>
                    <p className="border-l border-gray-100 px-3 py-2.5 text-xs leading-relaxed font-semibold text-kiosk-navy">
                      {item.whereToSecure || "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
              No checklist details are available for this service. Open the full charter PDF for the
              official page.
            </p>
          )}

          {steps.length > 0 && (
            <div className="overflow-x-auto rounded-lg ring-1 ring-gray-200">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="bg-kiosk-navy text-[10px] font-bold tracking-wider text-white uppercase">
                    <th className="px-3 py-2 font-bold">Client Steps</th>
                    <th className="px-3 py-2 font-bold">Agency Actions</th>
                    <th className="px-3 py-2 font-bold">Fees to be Paid</th>
                    <th className="px-3 py-2 font-bold">Processing Time</th>
                    <th className="px-3 py-2 font-bold">Person Responsible</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-t border-gray-100 align-top ${
                        row.sortOrder % 2 ? "bg-gray-50/70" : "bg-white"
                      }`}
                    >
                      <td className="px-3 py-2 text-xs leading-relaxed font-semibold text-kiosk-navy">
                        {row.step}
                      </td>
                      <td className="border-l border-gray-100 px-3 py-2 text-xs leading-relaxed text-gray-700">
                        {row.action}
                      </td>
                      <td className="border-l border-gray-100 px-3 py-2 text-xs leading-relaxed font-medium text-kiosk-green">
                        {row.fee || "—"}
                      </td>
                      <td className="border-l border-gray-100 px-3 py-2 text-xs leading-relaxed text-gray-700">
                        {row.time || "—"}
                      </td>
                      <td className="border-l border-gray-100 px-3 py-2 text-xs leading-relaxed text-gray-700">
                        {row.person || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {medicines.length > 0 && (
            <div className="overflow-hidden rounded-lg ring-1 ring-gray-200">
              <div className="bg-kiosk-navy px-3 py-2.5">
                <p className="text-[10px] font-bold tracking-wider text-white uppercase">
                  List of Medicine available in the Hospital
                </p>
                <p className="mt-0.5 text-[11px] text-white/75">
                  See Price List — fees vary by item below
                </p>
              </div>
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-100 text-[10px] font-bold tracking-wider text-kiosk-navy uppercase">
                      <th className="px-3 py-2 font-bold">Name of Drugs</th>
                      <th className="px-3 py-2 font-bold">Preparation</th>
                      <th className="px-3 py-2 font-bold">Brand Name</th>
                      <th className="px-3 py-2 text-right font-bold">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicines.map((item) => {
                      if (item.isSection) {
                        return (
                          <tr key={item.id}>
                            <td
                              colSpan={4}
                              className="border-t border-gray-200 bg-slate-100 px-3 py-2 text-[11px] font-bold tracking-wide text-kiosk-navy uppercase"
                            >
                              {item.name}
                            </td>
                          </tr>
                        );
                      }

                      const rowTone = item.sortOrder % 2 ? "bg-gray-50/70" : "bg-white";
                      return (
                        <tr key={item.id} className={`border-t border-gray-100 align-top ${rowTone}`}>
                          <td className="px-3 py-2 text-xs leading-relaxed font-semibold text-kiosk-navy">
                            {item.name}
                          </td>
                          <td className="border-l border-gray-100 px-3 py-2 text-xs leading-relaxed text-gray-700 capitalize">
                            {item.preparation || "—"}
                          </td>
                          <td className="border-l border-gray-100 px-3 py-2 text-xs leading-relaxed text-gray-700">
                            {item.brand || "—"}
                          </td>
                          <td className="border-l border-gray-100 px-3 py-2 text-right text-xs leading-relaxed font-bold text-kiosk-green tabular-nums">
                            {item.price ? `₱${item.price}` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
