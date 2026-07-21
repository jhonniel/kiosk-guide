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
import type {
  CharterEditionView,
  CharterOfficeView,
  CharterServiceView,
} from "@/features/citizens-charter/types";

interface CitizensCharterClientProps {
  edition: CharterEditionView | null;
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
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return offices;

    return offices.flatMap((office) => {
      if (office.name.toLowerCase().includes(normalizedQuery)) return [office];

      const categories = office.categories.flatMap((category) => {
        const services = category.services.filter(
          (service) =>
            service.name.toLowerCase().includes(normalizedQuery) ||
            service.details.some((detail) => detail.toLowerCase().includes(normalizedQuery))
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
      <section className="rounded-2xl bg-gradient-to-br from-kiosk-navy to-blue-900 p-5 text-white shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-kiosk-green uppercase">
              {edition.year} · {edition.editionLabel}
            </p>
            <h2 className="mt-1 text-xl font-bold">{edition.title}</h2>
            <p className="mt-1 text-sm text-blue-100">
              {edition.description ||
                `${edition.serviceCount} services grouped under ${edition.offices.length} offices.`}
            </p>
            <p className="mt-1 text-xs text-blue-200">
              {edition.serviceCount} services · {edition.offices.length} offices
            </p>
          </div>
          <a
            href={edition.pdfUrl}
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
              const isActive = expandedOfficeId === group.id;

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => openOffice(group.id)}
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
                    {group.name}
                  </h3>
                  <p className="mt-3 text-xs font-semibold text-gray-500">
                    {serviceCount} {serviceCount === 1 ? "service" : "services"}
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
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="font-semibold text-kiosk-navy">No matching services found</p>
          <p className="mt-1 text-sm text-gray-500">Try another office or service name.</p>
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
              {group.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCloseOffice}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-100 hover:text-kiosk-navy"
            aria-label="Close list of services"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-5 overflow-y-auto p-4 sm:p-5">
          {group.categories.map((category) => (
            <div key={category.id}>
              <h4 className="mb-3 text-xs font-bold tracking-wider text-kiosk-green uppercase">
                {category.name}
              </h4>
              <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {category.services.map((service, serviceIndex) => {
                  const isSelected = expandedServiceId === service.id;
                  return (
                    <li key={service.id}>
                      <button
                        type="button"
                        onClick={() => onOpenService(service.id)}
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
                            {service.pageNumber != null && (
                              <span className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-500 ring-1 ring-gray-200">
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
                        {service.requirements.length > 0 && (
                          <p className="mt-auto flex items-center gap-1 pt-2 text-[10px] font-semibold text-kiosk-green">
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
