"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  ChevronRight,
  ExternalLink,
  FileText,
  ListChecks,
  Search,
  X,
} from "lucide-react";
import {
  CITIZENS_CHARTER_PDF_URL,
  CITIZENS_CHARTER_SERVICE_COUNT,
  CITIZENS_CHARTER_SERVICE_GROUPS,
  type CharterService,
} from "@/features/citizens-charter/services-2026";
import {
  CITIZENS_CHARTER_META,
  CITIZENS_CHARTER_REQUIREMENTS,
  CITIZENS_CHARTER_STEPS,
} from "@/features/citizens-charter/requirements-2026";

export function CitizensCharterClient() {
  const [query, setQuery] = useState("");
  const [expandedOffice, setExpandedOffice] = useState<string | null>(null);
  const [expandedService, setExpandedService] = useState<number | null>(null);
  const [isOfficeClosing, setIsOfficeClosing] = useState(false);
  const [isServiceClosing, setIsServiceClosing] = useState(false);
  const officeCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serviceCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const groups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return CITIZENS_CHARTER_SERVICE_GROUPS;

    return CITIZENS_CHARTER_SERVICE_GROUPS.flatMap((group) => {
      if (group.office.toLowerCase().includes(normalizedQuery)) return [group];

      const categories = group.categories.flatMap((category) => {
        const services = category.services.filter(
          (service) =>
            service.name.toLowerCase().includes(normalizedQuery) ||
            service.details?.some((detail) => detail.toLowerCase().includes(normalizedQuery))
        );
        return services.length ? [{ ...category, services }] : [];
      });

      return categories.length ? [{ ...group, categories }] : [];
    });
  }, [query]);

  const activeGroup = useMemo(
    () => groups.find((group) => group.office === expandedOffice) ?? null,
    [expandedOffice, groups]
  );

  const activeService = useMemo(() => {
    if (!activeGroup || expandedService == null) return null;
    for (const category of activeGroup.categories) {
      const found = category.services.find((service) => service.page === expandedService);
      if (found) return found;
    }
    return null;
  }, [activeGroup, expandedService]);

  const openOffice = useCallback((office: string) => {
    if (officeCloseTimerRef.current) clearTimeout(officeCloseTimerRef.current);
    if (serviceCloseTimerRef.current) clearTimeout(serviceCloseTimerRef.current);
    setIsOfficeClosing(false);
    setIsServiceClosing(false);
    setExpandedService(null);
    setExpandedOffice(office);
  }, []);

  const closeService = useCallback(() => {
    if (isServiceClosing || expandedService == null) return;
    setIsServiceClosing(true);
    serviceCloseTimerRef.current = setTimeout(() => {
      setExpandedService(null);
      setIsServiceClosing(false);
      serviceCloseTimerRef.current = null;
    }, 220);
  }, [expandedService, isServiceClosing]);

  const closeOffice = useCallback(() => {
    if (isOfficeClosing) return;
    if (expandedService != null) {
      closeService();
      return;
    }
    setIsOfficeClosing(true);
    officeCloseTimerRef.current = setTimeout(() => {
      setExpandedOffice(null);
      setExpandedService(null);
      setIsOfficeClosing(false);
      officeCloseTimerRef.current = null;
    }, 220);
  }, [closeService, expandedService, isOfficeClosing]);

  const openService = useCallback((page: number) => {
    if (serviceCloseTimerRef.current) clearTimeout(serviceCloseTimerRef.current);
    setIsServiceClosing(false);
    setExpandedService(page);
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

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-gradient-to-br from-kiosk-navy to-blue-900 p-5 text-white shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-kiosk-green uppercase">
              2026 · 1st Edition
            </p>
            <h2 className="mt-1 text-xl font-bold">Provincial Government of Camiguin</h2>
            <p className="mt-1 text-sm text-blue-100">
              {CITIZENS_CHARTER_SERVICE_COUNT} services grouped under{" "}
              {CITIZENS_CHARTER_SERVICE_GROUPS.length} offices.
            </p>
          </div>
          <a
            href={CITIZENS_CHARTER_PDF_URL}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-kiosk-navy shadow-sm transition-transform hover:scale-[1.02]"
          >
            <FileText className="h-5 w-5" />
            View Full Charter
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </section>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search an office or service…"
          className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pr-4 pl-12 text-sm text-kiosk-navy shadow-sm outline-none transition focus:border-kiosk-green focus:ring-2 focus:ring-kiosk-green/20"
        />
      </div>

      {groups.length ? (
        <>
          <div className="kiosk-stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
            {groups.map((group, groupIndex) => {
              const serviceCount = group.categories.reduce(
                (total, category) => total + category.services.length,
                0
              );
              const isActive = expandedOffice === group.office;

              return (
                <button
                  key={group.office}
                  type="button"
                  onClick={() => openOffice(group.office)}
                  className={`flex min-h-[160px] flex-col rounded-2xl border p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    isActive
                      ? "border-kiosk-green bg-green-50 ring-2 ring-kiosk-green/30"
                      : "border-gray-200 bg-white hover:border-kiosk-green/40"
                  }`}
                >
                  <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-kiosk-navy text-white">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <p className="text-[10px] font-bold tracking-wider text-kiosk-green uppercase">
                    Group {groupIndex + 1}
                  </p>
                  <h3 className="mt-1 line-clamp-3 flex-1 text-sm leading-snug font-bold text-kiosk-navy">
                    {group.office}
                  </h3>
                  <p className="mt-3 text-xs font-semibold text-gray-500">
                    {serviceCount} {serviceCount === 1 ? "service" : "services"}
                  </p>
                </button>
              );
            })}
          </div>

          {activeGroup && (
            <div
              className={`fixed inset-0 z-50 flex items-center justify-center bg-kiosk-navy/65 p-3 backdrop-blur-sm sm:p-6 ${
                isOfficeClosing ? "charter-modal-backdrop-out" : "charter-modal-backdrop-in"
              }`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="charter-office-title"
              onClick={closeOffice}
            >
              <section
                className={`flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-kiosk-green/30 bg-white shadow-2xl ${
                  isOfficeClosing ? "charter-modal-panel-out" : "charter-modal-panel-in"
                }`}
                onClick={(event) => event.stopPropagation()}
              >
                <header className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-kiosk-bg px-5 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-kiosk-navy text-white">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold tracking-wider text-kiosk-green uppercase">
                      List of Services
                    </p>
                    <h3 id="charter-office-title" className="font-bold text-kiosk-navy">
                      {activeGroup.office}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={closeOffice}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-100 hover:text-kiosk-navy"
                    aria-label="Close list of services"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </header>

                <div className="space-y-5 overflow-y-auto p-4 sm:p-5">
                  {activeGroup.categories.map((category) => (
                    <div key={category.type}>
                      <h4 className="mb-3 text-xs font-bold tracking-wider text-kiosk-green uppercase">
                        {category.type}
                      </h4>
                      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {category.services.map((service, serviceIndex) => {
                          const requirements =
                            CITIZENS_CHARTER_REQUIREMENTS[service.page] ?? [];
                          const isSelected = expandedService === service.page;

                          return (
                            <li key={`${service.name}-${service.page}`}>
                              <button
                                type="button"
                                onClick={() => openService(service.page)}
                                className={`flex min-h-[140px] w-full flex-col rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                                  isSelected
                                    ? "border-kiosk-green bg-white shadow-md ring-2 ring-kiosk-green/20"
                                    : "border-gray-100 bg-gray-50/70 hover:border-kiosk-green/40"
                                }`}
                              >
                                <div className="mb-2 flex items-start justify-between gap-2">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-kiosk-navy text-xs font-bold text-white">
                                    {serviceIndex + 1}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <span className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-500 ring-1 ring-gray-200">
                                      p. {service.page}
                                    </span>
                                    <ChevronRight className="h-4 w-4 text-kiosk-green" />
                                  </span>
                                </div>
                                <p className="text-sm leading-snug font-semibold text-kiosk-navy">
                                  {service.name}
                                </p>
                                {service.details && (
                                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                                    {service.details.map((detail) => (
                                      <li
                                        key={detail}
                                        className="before:mr-1.5 before:text-kiosk-green before:content-['•']"
                                      >
                                        {detail}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                {requirements.length > 0 && (
                                  <p className="mt-auto flex items-center gap-1 pt-2 text-[10px] font-semibold text-kiosk-green">
                                    <ListChecks className="h-3.5 w-3.5" />
                                    {requirements.length}{" "}
                                    {requirements.length === 1 ? "requirement" : "requirements"} ·
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
                  officeName={activeGroup.office}
                  isClosing={isServiceClosing}
                  onClose={closeService}
                />
              )}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="font-semibold text-kiosk-navy">No matching services found</p>
          <p className="mt-1 text-sm text-gray-500">Try another office or service name.</p>
        </div>
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
  service: CharterService;
  officeName: string;
  isClosing: boolean;
  onClose: () => void;
}) {
  const requirements = CITIZENS_CHARTER_REQUIREMENTS[service.page] ?? [];
  const steps = CITIZENS_CHARTER_STEPS[service.page] ?? [];
  const meta = CITIZENS_CHARTER_META[service.page];
  const metaRows = meta
    ? (
        [
          ["Office or Division:", meta.officeOrDivision],
          ["Classification:", meta.classification],
          ["Type of Transaction:", meta.typeOfTransaction],
          ["Who may avail:", meta.whoMayAvail],
        ] as const
      ).filter(([, value]) => Boolean(value))
    : [];

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
              {officeName} · p. {service.page}
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
          {meta?.description && (
            <p className="text-sm leading-relaxed text-gray-700">{meta.description}</p>
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

          {service.details && (
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
              {requirements.map((item, itemIndex) => {
                if (item.isSection) {
                  return (
                    <p
                      key={itemIndex}
                      className="border-t border-gray-200 bg-slate-100 px-3 py-2 text-[11px] font-bold tracking-wide text-kiosk-navy uppercase"
                    >
                      {item.requirement}
                    </p>
                  );
                }

                const rowTone = itemIndex % 2 ? "bg-gray-50/70" : "bg-white";
                return (
                  <div
                    key={itemIndex}
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
              No checklist details were extracted for this service. Open the full charter PDF for the
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
                  {steps.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={`border-t border-gray-100 align-top ${
                        rowIndex % 2 ? "bg-gray-50/70" : "bg-white"
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
        </div>
      </section>
    </div>
  );
}
