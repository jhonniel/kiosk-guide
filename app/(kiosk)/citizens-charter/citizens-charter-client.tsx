"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  FileText,
  HeartPulse,
  Info,
  Landmark,
  LayoutGrid,
  ListChecks,
  Loader2,
  Mail,
  QrCode,
  Search,
  Signpost,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { DateTimeWidget } from "@/components/kiosk/date-time-widget";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useKiosk } from "@/hooks/use-kiosk";
import { pickLang, t } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type {
  CharterEditionView,
  CharterOfficeView,
  CharterServiceView,
} from "@/features/citizens-charter/types";
import {
  CHARTER_BROWSE_CATEGORIES,
  CHARTER_CORE_TOPICS,
  CHARTER_COVER_IMAGE,
  CHARTER_SCENIC_IMAGE,
  categoryForOffice,
  countServices,
  mostRequestedServices,
  officeThemeIcon,
  officesInCategory,
  type CharterBrowseCategory,
  type CharterBrowseCategoryId,
  type CharterCoreTopicId,
} from "@/features/citizens-charter/ui-catalog";

interface CitizensCharterClientProps {
  edition: CharterEditionView | null;
}

type CharterView = "overview" | "browse";
type BrowseMode = "category" | "department";

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
      ...service.requirements.flatMap((item) => [item.requirement, item.whereToSecure]),
      ...service.steps.flatMap((item) => [item.step, item.action, item.fee, item.time, item.person]),
      ...service.medicines.flatMap((item) => [item.name, item.preparation, item.brand, item.price]),
    ],
    query
  );
}

function absolutePdfUrl(pdfUrl: string) {
  if (!pdfUrl) return "";
  if (/^https?:\/\//i.test(pdfUrl)) return pdfUrl;
  if (typeof window === "undefined") return pdfUrl;
  return new URL(pdfUrl, window.location.origin).toString();
}

function usePdfQr(pdfUrl?: string | null) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfUrl) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(absolutePdfUrl(pdfUrl), {
      width: 220,
      margin: 1,
      color: { dark: "#111827", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  return qrDataUrl;
}

export function CitizensCharterClient({ edition }: CitizensCharterClientProps) {
  const { language } = useKiosk();
  const [view, setView] = useState<CharterView>("overview");
  const [browseMode, setBrowseMode] = useState<BrowseMode>("category");
  const [query, setQuery] = useState("");
  const [activeTopicId, setActiveTopicId] = useState<CharterCoreTopicId>("pledge");
  const [expandedCategoryId, setExpandedCategoryId] = useState<CharterBrowseCategoryId | null>(null);
  const [expandedOfficeId, setExpandedOfficeId] = useState<string | null>(null);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [isOfficeClosing, setIsOfficeClosing] = useState(false);
  const [isServiceClosing, setIsServiceClosing] = useState(false);
  const officeCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serviceCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const didApplyUrlQuery = useRef(false);
  const qrDataUrl = usePdfQr(edition?.pdfUrl);

  useEffect(() => {
    if (didApplyUrlQuery.current || !edition) return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q")?.trim();
    if (!q) return;
    didApplyUrlQuery.current = true;
    setQuery(q);
    setView("browse");
    setBrowseMode("department");
  }, [edition]);

  const groups = useMemo(() => {
    const offices = edition?.offices ?? [];
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return offices;

    if (
      edition &&
      matchesSearch(
        [edition.title, edition.year, edition.editionLabel, edition.description, edition.pdfFileName],
        trimmedQuery
      )
    ) {
      return offices;
    }

    return offices.flatMap((office) => {
      if (matchesSearch([office.name], trimmedQuery)) return [office];

      const categories = office.categories.flatMap((category) => {
        if (matchesSearch([category.name], trimmedQuery)) return [category];
        const services = category.services.filter((service) => serviceMatches(service, trimmedQuery));
        return services.length ? [{ ...category, services }] : [];
      });

      return categories.length ? [{ ...office, categories }] : [];
    });
  }, [edition, query]);

  const categoryCards = useMemo(() => {
    const offices = groups;
    return CHARTER_BROWSE_CATEGORIES.map((category) => {
      const matched = offices.filter((office) => category.match.test(office.name));
      const serviceCount = matched.reduce((total, office) => total + countServices(office), 0);
      return { category, offices: matched, serviceCount };
    }).filter((item) => item.offices.length > 0);
  }, [groups]);

  const requested = useMemo(
    () => mostRequestedServices(edition?.offices ?? [], 4),
    [edition?.offices]
  );

  const activeGroup = useMemo(
    () => groups.find((group) => group.id === expandedOfficeId) ?? null,
    [expandedOfficeId, groups]
  );

  const activeCategory = useMemo(
    () => CHARTER_BROWSE_CATEGORIES.find((item) => item.id === expandedCategoryId) ?? null,
    [expandedCategoryId]
  );

  const activeCategoryOffices = useMemo(() => {
    if (!expandedCategoryId) return [];
    return officesInCategory(groups, expandedCategoryId);
  }, [expandedCategoryId, groups]);

  const activeService = useMemo(() => {
    if (!activeGroup || !expandedServiceId) return null;
    for (const category of activeGroup.categories) {
      const found = category.services.find((service) => service.id === expandedServiceId);
      if (found) return found;
    }
    return null;
  }, [activeGroup, expandedServiceId]);

  const activeTopic =
    CHARTER_CORE_TOPICS.find((topic) => topic.id === activeTopicId) ?? CHARTER_CORE_TOPICS[0];

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

  const editionLabel = `${edition.year}${edition.editionLabel ? ` (${edition.editionLabel})` : ""}`;

  return (
    <div
      className={cn(
        "relative -mx-8 min-h-0 flex-1 overflow-hidden",
        view === "overview"
          ? "-mt-8 bg-[#f7f9fc] px-6 pb-3 pt-0 sm:px-8"
          : "-mt-2 px-8 pb-2"
      )}
    >
      {view === "overview" ? (
        <div
          className="pointer-events-none absolute top-0 right-0 z-0 h-[17rem] w-[min(70%,46rem)] sm:h-[19rem]"
          aria-hidden
        >
          <div
            className="absolute inset-0 bg-cover bg-[center_top]"
            style={{ backgroundImage: `url(${CHARTER_SCENIC_IMAGE})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f7f9fc] from-[8%] via-[#f7f9fc]/75 via-[42%] to-transparent to-[78%]" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#f7f9fc] to-transparent" />
        </div>
      ) : (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${CHARTER_SCENIC_IMAGE})` }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/82 via-white/92 to-[#f4f7fb]"
            aria-hidden
          />
        </>
      )}

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        {view === "overview" ? (
          <OverviewView
            languageBackLabel={t(language, "backToHome")}
            edition={edition}
            editionLabel={editionLabel}
            qrDataUrl={qrDataUrl}
            activeTopicId={activeTopicId}
            activeTopic={activeTopic}
            onSelectTopic={setActiveTopicId}
            onBrowse={() => setView("browse")}
          />
        ) : (
          <BrowseView
            browseMode={browseMode}
            query={query}
            searchInputRef={searchInputRef}
            categoryCards={categoryCards}
            groups={groups}
            requested={requested}
            onBack={() => setView("overview")}
            onBrowseMode={setBrowseMode}
            onQueryChange={setQuery}
            onOpenCategory={setExpandedCategoryId}
            onOpenOffice={openOffice}
            onOpenRequested={(officeId, serviceId) => {
              openOffice(officeId);
              window.setTimeout(() => openService(serviceId), 40);
            }}
            onViewAll={() => {
              setBrowseMode("department");
              setQuery("");
              searchInputRef.current?.focus();
            }}
          />
        )}
      </div>

      {expandedCategoryId && activeCategory && !activeGroup && (
        <CategoryOfficesModal
          category={activeCategory}
          offices={activeCategoryOffices}
          onClose={() => setExpandedCategoryId(null)}
          onOpenOffice={(officeId) => {
            setExpandedCategoryId(null);
            openOffice(officeId);
          }}
        />
      )}

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
    </div>
  );
}

function OverviewView({
  languageBackLabel,
  edition,
  editionLabel,
  qrDataUrl,
  activeTopicId,
  activeTopic,
  onSelectTopic,
  onBrowse,
}: {
  languageBackLabel: string;
  edition: CharterEditionView;
  editionLabel: string;
  qrDataUrl: string | null;
  activeTopicId: CharterCoreTopicId;
  activeTopic: (typeof CHARTER_CORE_TOPICS)[number];
  onSelectTopic: (id: CharterCoreTopicId) => void;
  onBrowse: () => void;
}) {
  const { language } = useKiosk();
  const [topicOpen, setTopicOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  function openEmailDialog() {
    setEmail("");
    setEmailSent(false);
    setEmailSending(false);
    setEmailOpen(true);
  }

  async function handleSendCharterPdf(event: FormEvent) {
    event.preventDefault();
    setEmailSending(true);
    try {
      const res = await fetch("/api/kiosk/citizens-charter/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang: language }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to send email");
      setEmailSent(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setEmailSending(false);
    }
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-transparent">
      <header className="relative z-10 shrink-0 pt-6 pb-3">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-[13px] font-medium text-kiosk-navy/75 shadow-sm transition hover:bg-white hover:text-kiosk-navy"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {languageBackLabel}
        </Link>

        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0 max-w-xl">
            <h1 className="text-[1.85rem] leading-none font-black tracking-tight text-kiosk-navy uppercase sm:text-[2.15rem] lg:text-[2.35rem]">
              Citizens&apos; Charter
            </h1>
            <p className="mt-1.5 text-[11px] font-bold tracking-[0.34em] text-[#0f766e] uppercase">
              Overview
            </p>
            <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-slate-500">
              Your guide to government services in Camiguin. Explore services, requirements,
              processing time, and fees all in one place.
            </p>
          </div>
          <div className="shrink-0 pt-1">
            <DateTimeWidget subtle />
          </div>
        </div>
      </header>

      {/* Fill remaining kiosk height so content isn't stuck in the top half */}
      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col gap-4 pb-1 lg:flex-row lg:items-stretch lg:gap-5">
        <article className="flex w-full shrink-0 flex-col rounded-[20px] bg-white p-3.5 shadow-[0_10px_28px_-16px_rgba(15,35,70,0.32)] lg:w-[320px] xl:w-[360px]">
          {/* Crop bottom pillar strip (Transparent / Accountable / …) — not needed on Overview */}
          <div className="relative min-h-[16rem] flex-1 overflow-hidden rounded-[16px] bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={CHARTER_COVER_IMAGE}
              alt="Citizens' Charter 2026 cover"
              className="absolute inset-0 h-[118%] w-full object-cover object-top"
            />
          </div>
          <div className="mt-3 shrink-0 text-center">
            <h2 className="text-[17px] font-extrabold text-kiosk-navy">{editionLabel}</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">Complete Citizens&apos; Charter</p>
            {edition.pdfUrl ? (
              <button
                type="button"
                onClick={openEmailDialog}
                className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#e8eef6] text-[13px] font-semibold text-kiosk-navy transition hover:bg-[#dce5f1]"
              >
                <FileText className="h-4 w-4 text-slate-500" />
                <span>PDF Document</span>
                <span className="font-normal text-slate-300">|</span>
                <span className="font-medium text-slate-500">5.3 MB</span>
              </button>
            ) : null}
          </div>
        </article>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          {/* Browse + QR share equal height */}
          <div className="grid min-h-0 flex-1 grid-rows-2 gap-4">
            <button
              type="button"
              onClick={onBrowse}
              className="flex h-full min-h-0 items-center gap-6 rounded-[22px] bg-white px-6 py-5 text-left shadow-[0_8px_24px_-16px_rgba(15,35,70,0.28)] transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.995]"
            >
              <span className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-[#0d9488] text-white">
                <Landmark className="h-14 w-14" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[1.65rem] leading-tight font-extrabold text-kiosk-navy sm:text-[1.85rem]">
                  Browse By Department / Category
                </h2>
                <p className="mt-2 text-base leading-snug text-slate-500 sm:text-lg">
                  Browse official services, published fees, processing time, and source pages.
                </p>
              </div>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eef2f7] text-slate-500">
                <ChevronRight className="h-6 w-6" />
              </span>
            </button>

            <div className="flex h-full min-h-0 items-center gap-6 rounded-[22px] border-2 border-dashed border-[#14b8a6] bg-white px-6 py-5 shadow-[0_8px_24px_-16px_rgba(15,35,70,0.2)]">
              <div className="flex min-w-0 flex-1 items-center gap-6">
                <span className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-[#7c3aed] text-white">
                  <QrCode className="h-14 w-14" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[1.65rem] leading-tight font-extrabold text-kiosk-navy sm:text-[1.85rem]">
                    Scan QR to Open the Document
                  </h2>
                  <p className="mt-2 max-w-xl text-base leading-snug text-slate-500 sm:text-lg">
                    Scan the QR code to view or download the complete {edition.year} Citizens&apos;
                    Charter.
                  </p>
                </div>
              </div>
              <div className="flex w-[148px] shrink-0 flex-col items-center gap-2.5">
                <div className="rounded-xl bg-white p-2 ring-1 ring-slate-200">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrDataUrl}
                      alt="Citizens' Charter PDF QR code"
                      className="h-[7.75rem] w-[7.75rem]"
                    />
                  ) : (
                    <div className="flex h-[7.75rem] w-[7.75rem] items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400">
                      QR
                    </div>
                  )}
                </div>
                {edition.pdfUrl ? (
                  <button
                    type="button"
                    onClick={() => setQrOpen(true)}
                    className="inline-flex w-full items-center justify-center rounded-md bg-[#0d9488] px-3 py-2.5 text-sm font-bold tracking-wide text-white uppercase transition hover:bg-[#0f766e]"
                  >
                    Scan Here
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid shrink-0 gap-3.5 lg:grid-cols-[minmax(0,1.3fr)_minmax(220px,0.85fr)] lg:items-end">
            <div className="min-w-0">
              <p className="mb-2 text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase">
                Core Charter Topics
              </p>
              <div className="grid grid-cols-4 gap-2.5">
                {CHARTER_CORE_TOPICS.map((topic) => {
                  const Icon = topic.icon;
                  const selected = topic.id === activeTopicId;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => {
                        onSelectTopic(topic.id);
                        setTopicOpen(true);
                      }}
                      className={cn(
                        "flex aspect-square flex-col items-center justify-center gap-2.5 rounded-[16px] bg-white px-1.5 text-center shadow-[0_6px_18px_-12px_rgba(15,35,70,0.3)] transition",
                        selected
                          ? "ring-2 ring-[#f59e0b]"
                          : "ring-1 ring-slate-200/80 hover:-translate-y-0.5 hover:shadow-md"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16",
                          topic.soft,
                          topic.accent
                        )}
                      >
                        <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.25} />
                      </span>
                      <span className="text-[11px] leading-tight font-extrabold tracking-wide text-kiosk-navy uppercase sm:text-xs">
                        {topic.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="flex items-start gap-4 rounded-[16px] bg-[#eef5ff] px-4 py-4 ring-1 ring-[#dbeafe]">
              <span className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-white">
                <Info className="h-6 w-6" strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <p className="text-base font-extrabold text-kiosk-navy sm:text-lg">
                  For Reference and Information Only
                </p>
                <p className="mt-1.5 text-sm leading-snug text-slate-500 sm:text-[15px]">
                  The Citizens&apos; Charter provides detailed information on our services, policies,
                  and commitments to the public.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {topicOpen && (
        <div
          className="charter-modal-backdrop-in fixed inset-0 z-50 flex items-center justify-center bg-kiosk-navy/50 p-6 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          onClick={() => setTopicOpen(false)}
        >
          <div
            className="charter-modal-panel-in w-full max-w-3xl rounded-[28px] bg-white p-8 shadow-2xl sm:p-10"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold tracking-[0.18em] text-[#0d9488] uppercase sm:text-sm">
                  Core Charter Topic
                </p>
                <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-kiosk-navy sm:text-4xl">
                  {activeTopic.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTopicOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-lg leading-relaxed text-slate-600 sm:text-xl sm:leading-8">
              {activeTopic.body}
            </p>
          </div>
        </div>
      )}

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="gap-1 border-b border-gray-100 bg-kiosk-bg px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0d9488] text-white">
                <QrCode className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-kiosk-navy">
                  {pickLang(
                    language,
                    "Download via QR",
                    "I-download via QR",
                    "I-download via QR"
                  )}
                </DialogTitle>
                <DialogDescription className="mt-0.5 truncate text-xs">
                  {editionLabel} · Citizens&apos; Charter PDF
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 px-6 py-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="Citizens' Charter PDF QR code"
                  className="h-[16rem] w-[16rem]"
                />
              ) : (
                <div className="flex h-[16rem] w-[16rem] items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin text-[#0d9488]" />
                </div>
              )}
            </div>
            <p className="max-w-xs text-center text-sm leading-relaxed text-gray-500">
              {pickLang(
                language,
                "Scan this QR code with your phone camera to view or download the Citizens' Charter PDF.",
                "I-scan ang QR code gamit ang camera ng iyong telepono upang makita o i-download ang Citizens' Charter PDF.",
                "I-scan kini nga QR code gamit ang camera sa imong telepono aron makita o makadownload sa Citizens' Charter PDF."
              )}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-1"
              onClick={() => setQrOpen(false)}
            >
              {pickLang(language, "Close", "Isara", "Sirado")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="gap-1 border-b border-gray-100 bg-kiosk-bg px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-kiosk-navy text-white">
                <Mail className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-kiosk-navy">
                  {pickLang(language, "Send via Email", "Ipadala sa Email", "Ipadala sa Email")}
                </DialogTitle>
                <DialogDescription className="mt-0.5 truncate text-xs">
                  {editionLabel} · Citizens&apos; Charter PDF
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 py-5">
            {emailSent ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 className="h-8 w-8 text-kiosk-green" />
                </span>
                <p className="text-sm font-semibold text-kiosk-navy">
                  {pickLang(
                    language,
                    "Email sent!",
                    "Naipadala na ang email!",
                    "Napadala na ang email!"
                  )}
                </p>
                <p className="max-w-xs text-xs leading-relaxed text-gray-500">
                  {pickLang(
                    language,
                    `Check your inbox at ${email}`,
                    `Tingnan ang iyong inbox sa ${email}`,
                    `Tan-awa ang imong inbox sa ${email}`
                  )}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1"
                  onClick={() => setEmailOpen(false)}
                >
                  {pickLang(language, "Done", "Tapos na", "Human na")}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSendCharterPdf} className="space-y-4">
                <div>
                  <Label htmlFor="charter-pdf-email" className="text-xs font-semibold text-gray-700">
                    {pickLang(language, "Email address", "Email address", "Email address")}
                  </Label>
                  <Input
                    id="charter-pdf-email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5 h-11"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    {pickLang(
                      language,
                      "The Citizens' Charter PDF will be sent as an attachment.",
                      "Ipapadala ang Citizens' Charter PDF bilang attachment.",
                      "Ipadala ang Citizens' Charter PDF isip attachment."
                    )}
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={emailSending}
                  className="h-11 w-full bg-kiosk-navy font-semibold hover:bg-kiosk-navy/90"
                >
                  {emailSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {pickLang(language, "Sending…", "Ipinapadala…", "Ginapadala…")}
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      {pickLang(language, "Send PDF", "Ipadala ang PDF", "Ipadala ang PDF")}
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BrowseView({
  browseMode,
  query,
  searchInputRef,
  categoryCards,
  groups,
  requested,
  onBack,
  onBrowseMode,
  onQueryChange,
  onOpenCategory,
  onOpenOffice,
  onOpenRequested,
  onViewAll,
}: {
  browseMode: BrowseMode;
  query: string;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  categoryCards: Array<{
    category: CharterBrowseCategory;
    offices: CharterOfficeView[];
    serviceCount: number;
  }>;
  groups: CharterOfficeView[];
  requested: Array<{ office: CharterOfficeView; service: CharterServiceView }>;
  onBack: () => void;
  onBrowseMode: (mode: BrowseMode) => void;
  onQueryChange: (value: string) => void;
  onOpenCategory: (id: CharterBrowseCategoryId) => void;
  onOpenOffice: (officeId: string) => void;
  onOpenRequested: (officeId: string, serviceId: string) => void;
  onViewAll: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2">
      <header className="flex flex-wrap items-start justify-between gap-4 pt-1">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onBack}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-kiosk-navy/70 transition-colors hover:text-kiosk-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Overview
          </button>
          <h1 className="text-3xl font-black tracking-tight text-kiosk-navy uppercase sm:text-4xl">
            Browse Services
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Find services, requirements, processing time, and fees.
          </p>
        </div>

        <div className="shrink-0 pt-1">
          <DateTimeWidget />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-semibold text-kiosk-navy">Browse By</p>
        <div className="flex flex-wrap gap-2">
          <ModeChip
            active={browseMode === "category"}
            icon={LayoutGrid}
            label="By Category"
            onClick={() => onBrowseMode("category")}
          />
          <ModeChip
            active={browseMode === "department"}
            icon={Building2}
            label="By Department"
            onClick={() => onBrowseMode("department")}
          />
        </div>
        <CharterCollapsibleSearch
          query={query}
          searchInputRef={searchInputRef}
          onQueryChange={onQueryChange}
        />
      </div>

      {browseMode === "category" ? (
        <div className="kiosk-stagger grid grid-cols-2 gap-3 xl:grid-cols-4">
          {categoryCards.map(({ category, serviceCount }) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onOpenCategory(category.id)}
                className="kiosk-hover-lift flex min-h-[148px] flex-col rounded-[22px] bg-white p-4 text-left shadow-[0_10px_28px_-18px_rgba(15,35,70,0.35)] ring-1 ring-slate-200/70"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white",
                      category.accent
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <h3
                    className={cn(
                      "pt-1 text-[13px] font-extrabold tracking-wide uppercase",
                      category.titleColor
                    )}
                  >
                    {category.title}
                  </h3>
                </div>
                <p className="mt-3 line-clamp-2 flex-1 text-sm leading-snug text-slate-500">
                  {category.description}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-kiosk-navy">
                    {serviceCount} {serviceCount === 1 ? "Service" : "Services"}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="kiosk-stagger grid grid-cols-2 gap-3 xl:grid-cols-4">
          {groups.map((office) => {
            const theme = categoryForOffice(office.name);
            const Icon = officeThemeIcon(office.name);
            const serviceCount = countServices(office);
            return (
              <button
                key={office.id}
                type="button"
                onClick={() => onOpenOffice(office.id)}
                className="kiosk-hover-lift flex min-h-[148px] flex-col rounded-[22px] bg-white p-4 text-left shadow-[0_10px_28px_-18px_rgba(15,35,70,0.35)] ring-1 ring-slate-200/70"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white",
                      theme?.accent ?? "bg-kiosk-navy"
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <h3
                    className={cn(
                      "line-clamp-2 pt-1 text-[13px] font-extrabold tracking-wide uppercase",
                      theme?.titleColor ?? "text-kiosk-navy"
                    )}
                  >
                    {office.name}
                  </h3>
                </div>
                <p className="mt-3 line-clamp-2 flex-1 text-sm leading-snug text-slate-500">
                  {office.categories.map((category) => category.name).slice(0, 2).join(" · ") ||
                    "Provincial office services"}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-kiosk-navy">
                    {serviceCount} {serviceCount === 1 ? "Service" : "Services"}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!categoryCards.length && browseMode === "category" ? (
        <EmptySearch />
      ) : null}
      {!groups.length && browseMode === "department" ? <EmptySearch /> : null}

      <section className="mt-auto shrink-0 rounded-[22px] bg-[#e8eef6]/90 px-4 py-4 ring-1 ring-[#d5deea]/80 sm:px-5">
        <h2 className="mb-3 text-[13px] font-extrabold tracking-[0.14em] text-kiosk-navy uppercase">
          Most Requested Services
        </h2>
        <div className="flex flex-wrap items-stretch gap-2.5">
          {requested.map(({ office, service }) => {
            const meta = requestedServiceMeta(service.name);
            const Icon = meta.icon;
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => onOpenRequested(office.id, service.id)}
                className="inline-flex min-h-[48px] min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-left shadow-[0_1px_2px_rgba(15,35,70,0.04)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:scale-[0.99] sm:flex-none sm:px-4"
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0", meta.iconClass)} strokeWidth={2} />
                <span className="truncate text-[13px] font-semibold text-kiosk-navy sm:text-sm">
                  {meta.label}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex min-h-[48px] items-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 text-[13px] font-semibold text-[#2563eb] shadow-[0_1px_2px_rgba(15,35,70,0.04)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:scale-[0.99] sm:text-sm"
          >
            View All
            <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>
      </section>
    </div>
  );
}

function ModeChip({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition",
        active
          ? "bg-[#0d9488] text-white shadow-md shadow-teal-900/10"
          : "bg-white text-kiosk-navy ring-1 ring-slate-200 hover:bg-slate-50"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

const CHARTER_SEARCH_EXAMPLES = [
  "Business Permit",
  "Medical Assistance",
  "Barangay Clearance",
  "Road Right-of-Way",
  "Health Services",
  "Treasury / Payments",
  "Tourism Services",
  "Social Welfare",
];

const HINT_TYPE_MS = 48;
const HINT_ERASE_MS = 28;
const HINT_HOLD_MS = 1400;
const HINT_GAP_MS = 350;

type HintPhase = "typing" | "holding" | "erasing" | "gap";

function CharterCollapsibleSearch({
  query,
  searchInputRef,
  onQueryChange,
}: {
  query: string;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onQueryChange: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(() => Boolean(query.trim()));
  const [hint, setHint] = useState(CHARTER_SEARCH_EXAMPLES[0] ?? "");
  const containerRef = useRef<HTMLDivElement>(null);
  const queryRef = useRef(query);
  const exampleIndexRef = useRef(0);
  const charIndexRef = useRef(CHARTER_SEARCH_EXAMPLES[0]?.length ?? 0);
  const phaseRef = useRef<HintPhase>("holding");

  queryRef.current = query;

  useEffect(() => {
    if (query.trim()) setExpanded(true);
  }, [query]);

  useEffect(() => {
    exampleIndexRef.current = 0;
    charIndexRef.current = CHARTER_SEARCH_EXAMPLES[0]?.length ?? 0;
    phaseRef.current = "holding";
    setHint(CHARTER_SEARCH_EXAMPLES[0] ?? "");

    let alive = true;
    let timeoutId = 0;

    const schedule = (ms: number) => {
      timeoutId = window.setTimeout(tick, ms);
    };

    const tick = () => {
      if (!alive) return;
      if (queryRef.current.trim()) {
        schedule(400);
        return;
      }

      const fullText =
        CHARTER_SEARCH_EXAMPLES[exampleIndexRef.current % CHARTER_SEARCH_EXAMPLES.length] ?? "";
      const phase = phaseRef.current;

      if (phase === "typing") {
        charIndexRef.current = Math.min(fullText.length, charIndexRef.current + 1);
        setHint(fullText.slice(0, charIndexRef.current));
        if (charIndexRef.current >= fullText.length) {
          phaseRef.current = "holding";
          schedule(HINT_HOLD_MS);
          return;
        }
        schedule(HINT_TYPE_MS);
        return;
      }

      if (phase === "holding") {
        phaseRef.current = "erasing";
        schedule(HINT_ERASE_MS);
        return;
      }

      if (phase === "erasing") {
        charIndexRef.current = Math.max(0, charIndexRef.current - 1);
        setHint(fullText.slice(0, charIndexRef.current));
        if (charIndexRef.current <= 0) {
          phaseRef.current = "gap";
          schedule(HINT_GAP_MS);
          return;
        }
        schedule(HINT_ERASE_MS);
        return;
      }

      exampleIndexRef.current = (exampleIndexRef.current + 1) % CHARTER_SEARCH_EXAMPLES.length;
      charIndexRef.current = 0;
      phaseRef.current = "typing";
      schedule(HINT_TYPE_MS);
    };

    schedule(HINT_HOLD_MS);
    return () => {
      alive = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node) && !query.trim()) {
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query]);

  function expand() {
    setExpanded(true);
    window.setTimeout(() => searchInputRef.current?.focus(), 40);
  }

  const showHint = !query.trim();

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative ml-0 min-w-0 flex-1 basis-[15.5rem] transition-[max-width,margin-right] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        expanded ? "mr-[2%] max-w-[62.5rem]" : "mr-0 max-w-[15.5rem]"
      )}
    >
      <form
        className="relative"
        onSubmit={(event) => {
          event.preventDefault();
          expand();
        }}
      >
        <div className="relative h-12 rounded-full bg-white shadow-sm ring-1 ring-slate-200/80">
          {showHint && (
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-y-0 left-0 right-12 z-0 flex items-center truncate text-[13px] text-[#9baabf] transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                expanded ? "pl-11" : "pl-3.5"
              )}
            >
              {hint || "Search…"}
            </span>
          )}
          <Search
            className={cn(
              "pointer-events-none absolute top-1/2 left-4 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 transition-opacity duration-300",
              expanded ? "opacity-100" : "opacity-0"
            )}
          />
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onFocus={expand}
            onClick={expand}
            placeholder=""
            aria-label="Search Citizens' Charter services"
            className={cn(
              "relative z-10 h-full w-full rounded-full border-0 bg-transparent text-[13px] text-kiosk-navy outline-none transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus:ring-2 focus:ring-kiosk-navy/15",
              "appearance-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
              expanded ? "pr-14 pl-11" : "cursor-pointer pr-12 pl-3.5"
            )}
          />
          <button
            type="button"
            onClick={expand}
            className="absolute top-1/2 right-1.5 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-kiosk-navy text-white transition hover:scale-105 active:scale-95"
            aria-label="Expand search"
          >
            <Search className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </div>
  );
}

function EmptySearch() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/90 px-6 py-14 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Search className="h-6 w-6" />
      </div>
      <p className="text-lg font-bold text-kiosk-navy">No matching services found</p>
      <p className="mt-1 text-sm text-slate-500">Try another office, requirement, step, fee, or person name.</p>
    </div>
  );
}

function requestedServiceMeta(serviceName: string): {
  icon: LucideIcon;
  iconClass: string;
  label: string;
} {
  const name = serviceName.trim();
  const lower = name.toLowerCase();

  if (/business\s+permit|mayor'?s\s+permit|permit\s+to\s+operate/i.test(lower)) {
    return { icon: Briefcase, iconClass: "text-[#1d4ed8]", label: "Business Permit" };
  }
  if (/barangay\s+clearance/i.test(lower)) {
    return { icon: FileText, iconClass: "text-[#1d4ed8]", label: "Barangay Clearance" };
  }
  if (/medical\s+assistance/i.test(lower)) {
    return { icon: HeartPulse, iconClass: "text-[#e11d48]", label: "Medical Assistance" };
  }
  if (/right[-\s]?of[-\s]?way/i.test(lower)) {
    return {
      icon: Signpost,
      iconClass: "text-[#0d9488]",
      label: "Road Right-of-Way Permit",
    };
  }
  if (/medical|hospital|health|assistance/i.test(lower)) {
    return { icon: HeartPulse, iconClass: "text-[#e11d48]", label: name };
  }
  if (/permit|clearance|cedula|tax/i.test(lower)) {
    return { icon: FileText, iconClass: "text-[#1d4ed8]", label: name };
  }
  if (/procurement|bid|award|contract/i.test(lower)) {
    return { icon: Briefcase, iconClass: "text-kiosk-navy", label: name };
  }
  return { icon: Building2, iconClass: "text-kiosk-navy", label: name };
}

function CategoryOfficesModal({
  category,
  offices,
  onClose,
  onOpenOffice,
}: {
  category: CharterBrowseCategory;
  offices: CharterOfficeView[];
  onClose: () => void;
  onOpenOffice: (officeId: string) => void;
}) {
  const Icon = category.icon;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="charter-modal-backdrop-in fixed inset-0 z-50 flex items-center justify-center bg-kiosk-navy/65 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <section
        className="charter-modal-panel-in flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center gap-4 border-b border-slate-100 px-5 py-5">
          <span
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl text-white",
              category.accent
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.16em] text-[#0d9488] uppercase">Category</p>
            <h3 className="text-lg font-bold text-kiosk-navy">{category.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200"
            aria-label="Close category"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="kiosk-stagger grid gap-3 overflow-y-auto bg-[#f7f9fc] p-4 sm:grid-cols-2 sm:p-5">
          {offices.map((office) => {
            const serviceCount = countServices(office);
            return (
              <button
                key={office.id}
                type="button"
                onClick={() => onOpenOffice(office.id)}
                className="kiosk-hover-lift flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-4 text-left shadow-sm ring-1 ring-slate-200/80"
              >
                <div className="min-w-0">
                  <p className="font-bold text-kiosk-navy">{office.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {serviceCount} {serviceCount === 1 ? "service" : "services"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function themeForOffice(name: string) {
  const category = categoryForOffice(name);
  if (category) {
    return {
      icon: category.icon,
      accent: category.accent,
      soft: category.soft,
      badge: `${category.titleColor} ${category.soft}`,
    };
  }
  return {
    icon: Building2,
    accent: "bg-kiosk-navy",
    soft: "bg-[#f1f5f9]",
    badge: "text-kiosk-navy bg-[#e2e8f0]",
  };
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
  const serviceCount = countServices(group);

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
                            {service.requirements.length === 1 ? "requirement" : "requirements"} · Tap
                            to view
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
