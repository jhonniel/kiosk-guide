"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { KioskBackButton } from "@/components/kiosk/kiosk-back-button";
import QRCode from "qrcode";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
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
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { kioskDateTimeReserveClass } from "@/components/kiosk/date-time-widget";
import { KioskBrandLogos } from "@/components/kiosk/kiosk-brand-logos";
import { KioskFitPanel } from "@/components/kiosk/kiosk-fit-panel";
import { ScrollFadeContainer } from "@/components/kiosk/scroll-fade-container";
import { useOffline } from "@/components/providers/offline-provider";
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
import { logVisitor } from "@/features/kiosk/actions";
import {
  charterOfficeVisitKey,
  charterServiceVisitKey,
} from "@/features/kiosk/charter-quick-start";
import { getKioskSessionId } from "@/features/kiosk/visit-tracking";
import { useQuickStartVisits } from "@/components/kiosk/quick-start-visit-provider";
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
type BrowseMode = "category" | "department" | "requested";

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
  const { recordVisit } = useQuickStartVisits();
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
  const didApplyUrlParams = useRef(false);
  const qrDataUrl = usePdfQr(edition?.pdfUrl);

  useEffect(() => {
    if (didApplyUrlParams.current || !edition) return;
    const params = new URLSearchParams(window.location.search);
    const officeId = params.get("office");
    const serviceId = params.get("service");

    if (officeId) {
      didApplyUrlParams.current = true;
      setView("browse");
      const office = edition.offices.find((item) => item.id === officeId);
      if (office) {
        const category = categoryForOffice(office.name);
        setExpandedCategoryId(category?.id ?? null);
        setExpandedOfficeId(officeId);
        if (serviceId) {
          window.setTimeout(() => setExpandedServiceId(serviceId), 40);
        }
      }
      return;
    }

    const q = params.get("q")?.trim();
    if (!q) return;
    didApplyUrlParams.current = true;
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

  const allRequested = useMemo(
    () => mostRequestedServices(edition?.offices ?? [], 24),
    [edition?.offices]
  );
  const requested = useMemo(() => allRequested.slice(0, 4), [allRequested]);

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

  const openOffice = useCallback(
    (officeId: string) => {
      if (officeCloseTimerRef.current) clearTimeout(officeCloseTimerRef.current);
      if (serviceCloseTimerRef.current) clearTimeout(serviceCloseTimerRef.current);
      setIsOfficeClosing(false);
      setIsServiceClosing(false);
      setExpandedServiceId(null);
      setExpandedOfficeId(officeId);

      const visitKey = charterOfficeVisitKey(officeId);
      recordVisit(visitKey);
      void logVisitor(visitKey, language, getKioskSessionId()).catch(() => undefined);
    },
    [language, recordVisit]
  );

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
      setExpandedCategoryId(null);
      setIsOfficeClosing(false);
      officeCloseTimerRef.current = null;
    }, 220);
  }, [closeService, expandedServiceId, isOfficeClosing]);

  const openService = useCallback(
    (serviceId: string) => {
      if (serviceCloseTimerRef.current) clearTimeout(serviceCloseTimerRef.current);
      setIsServiceClosing(false);
      setExpandedServiceId(serviceId);

      const visitKey = charterServiceVisitKey(serviceId);
      recordVisit(visitKey);
      void logVisitor(visitKey, language, getKioskSessionId()).catch(() => undefined);
    },
    [language, recordVisit]
  );

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

  const modalCategory = useMemo(() => {
    if (activeCategory) return activeCategory;
    if (!activeGroup) return null;
    return categoryForOffice(activeGroup.name);
  }, [activeCategory, activeGroup]);

  const modalRelatedOffices = useMemo(() => {
    if (!activeGroup) return [];
    if (modalCategory) return officesInCategory(groups, modalCategory.id);
    return [activeGroup];
  }, [activeGroup, groups, modalCategory]);

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
    <div className="relative flex min-h-0 flex-1 basis-0 flex-col overflow-hidden bg-transparent">
      <div
        className={cn(
          "relative z-10 flex min-h-0 flex-1 flex-col",
          view === "overview"
            ? "min-h-0 overflow-hidden px-4 pb-3 sm:px-6 sm:pb-4 lg:px-8 lg:pb-5"
            : "min-h-0 overflow-hidden px-4 pb-2 sm:px-6 lg:px-8"
        )}
      >
        {view === "overview" ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <BrowseView
            browseMode={browseMode}
            query={query}
            searchInputRef={searchInputRef}
            categoryCards={categoryCards}
            groups={groups}
            requested={requested}
            allRequested={allRequested}
            onBack={() => setView("overview")}
            onBrowseMode={setBrowseMode}
            onQueryChange={setQuery}
            onOpenCategory={(categoryId) => {
              setExpandedCategoryId(categoryId);
              const offices = officesInCategory(groups, categoryId);
              if (offices[0]) openOffice(offices[0].id);
            }}
            onOpenOffice={(officeId) => {
              const office = groups.find((item) => item.id === officeId);
              const category = office ? categoryForOffice(office.name) : null;
              setExpandedCategoryId(category?.id ?? null);
              openOffice(officeId);
            }}
            onOpenRequested={(officeId, serviceId) => {
              const office = groups.find((item) => item.id === officeId);
              const category = office ? categoryForOffice(office.name) : null;
              setExpandedCategoryId(category?.id ?? null);
              openOffice(officeId);
              window.setTimeout(() => openService(serviceId), 40);
            }}
            onViewAll={() => {
              setBrowseMode("requested");
              setQuery("");
            }}
          />
          </div>
        )}
      </div>

      {activeGroup && (
        <OfficeModal
          group={activeGroup}
          relatedOffices={modalRelatedOffices}
          category={modalCategory}
          edition={edition}
          isOfficeClosing={isOfficeClosing}
          isServiceClosing={isServiceClosing}
          expandedServiceId={expandedServiceId}
          activeService={activeService}
          onSelectOffice={openOffice}
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
  const { offlineData } = useOffline();
  const settings = offlineData?.settings ?? {};
  const [topicOpen, setTopicOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [coverLoaded, setCoverLoaded] = useState(false);
  const coverRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (coverRef.current?.complete) {
      setCoverLoaded(true);
    }
  }, []);

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
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
      <header className={cn("relative z-10 shrink-0 px-1 pt-4 pb-3", kioskDateTimeReserveClass)}>
        <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
          <KioskBackButton href="/">{languageBackLabel}</KioskBackButton>
          <h1 className="min-w-0 text-[1.85rem] leading-none font-black tracking-tight text-kiosk-navy uppercase lg:text-[2.15rem]">
            Citizens&apos; Charter
          </h1>
        </div>

        <div className="mt-1.5 min-w-0 max-w-xl">
          <p className="text-[11px] font-bold tracking-[0.34em] text-[#0f766e] uppercase">
            Overview
          </p>
          <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-slate-500">
            Your guide to government services in Camiguin. Explore services, requirements,
            processing time, and fees all in one place.
          </p>
        </div>
      </header>

      {/* Classic overview: cover | (equal Browse/QR + topics) */}
      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-row items-stretch gap-5 px-1 pb-2">
        <article className="flex w-[300px] shrink-0 flex-col rounded-[20px] border-0 bg-white p-3.5 shadow-[0_10px_28px_-16px_rgba(15,35,70,0.32)] ring-0 lg:w-[320px]">
          <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-[16px] bg-[#0b3d6e]">
            {!coverLoaded ? (
              <div
                aria-hidden="true"
                className="absolute inset-0 animate-pulse bg-[linear-gradient(180deg,#0b3d6e_0%,#0f4a82_100%)]"
              />
            ) : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={coverRef}
              src={CHARTER_COVER_IMAGE}
              alt="Citizens' Charter 2026 cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onLoad={() => setCoverLoaded(true)}
              className={cn(
                "block h-full min-h-[320px] w-full object-cover object-top transition-opacity duration-300",
                coverLoaded ? "opacity-100" : "opacity-0"
              )}
            />
            <div className="pointer-events-none absolute inset-x-0 top-[5%] flex justify-center">
              <KioskBrandLogos settings={settings} variant="cover" />
            </div>
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
          {/* Browse + QR share equal natural height (not stretched sparse) */}
          <div className="grid shrink-0 grid-rows-2 gap-4">
            <button
              type="button"
              onClick={onBrowse}
              className="flex h-full min-h-[9.5rem] items-center gap-6 rounded-[22px] border-0 bg-white px-6 py-5 text-left shadow-[0_8px_24px_-16px_rgba(15,35,70,0.28)] ring-0 transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.995]"
            >
              <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[#0d9488] text-white">
                <Landmark className="h-12 w-12" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[1.5rem] leading-tight font-extrabold text-kiosk-navy lg:text-[1.75rem]">
                  Browse By Department / Category
                </h2>
                <p className="mt-2 text-base leading-snug text-slate-500 lg:text-lg">
                  Browse official services, published fees, processing time, and source pages.
                </p>
              </div>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eef2f7] text-slate-500">
                <ChevronRight className="h-6 w-6" />
              </span>
            </button>

            <div className="flex h-full min-h-[9.5rem] items-center gap-6 rounded-[22px] border-0 bg-white px-6 py-5 shadow-[0_8px_24px_-16px_rgba(15,35,70,0.2)] outline outline-2 outline-dashed outline-[#14b8a6] ring-0">
              <div className="flex min-w-0 flex-1 items-center gap-6">
                <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[#7c3aed] text-white">
                  <QrCode className="h-12 w-12" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[1.5rem] leading-tight font-extrabold text-kiosk-navy lg:text-[1.75rem]">
                    Scan QR to Open the Document
                  </h2>
                  <p className="mt-2 max-w-xl text-base leading-snug text-slate-500 lg:text-lg">
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

          <div className="mt-auto flex shrink-0 items-stretch gap-3.5">
            <div className="min-w-0 shrink-0">
              <p className="mb-2 text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase">
                Core Charter Topics
              </p>
              <div className="flex gap-2.5">
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
                        "flex h-[7.25rem] w-[7.25rem] flex-col items-center justify-center gap-2 overflow-hidden rounded-[16px] border-0 bg-white px-1.5 text-center shadow-[0_6px_18px_-12px_rgba(15,35,70,0.3)] ring-0 transition",
                        selected
                          ? "outline outline-2 outline-[#f59e0b] outline-offset-0"
                          : "hover:-translate-y-0.5 hover:shadow-md"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-full",
                          topic.soft,
                          topic.accent
                        )}
                      >
                        <Icon className="h-7 w-7" strokeWidth={2.25} />
                      </span>
                      <span className="px-0.5 text-[11px] leading-tight font-extrabold tracking-wide text-kiosk-navy uppercase">
                        {topic.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="flex min-w-0 flex-1 items-start gap-4 rounded-[16px] border-0 bg-[#eef5ff] px-4 py-4 shadow-none ring-0">
              <span className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-white">
                <Info className="h-6 w-6" strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <p className="text-base font-extrabold text-kiosk-navy lg:text-lg">
                  For Reference and Information Only
                </p>
                <p className="mt-1.5 text-sm leading-snug text-slate-500 lg:text-[15px]">
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
          className="charter-modal-backdrop-in fixed inset-0 z-50 flex items-center justify-center bg-kiosk-navy/50 p-4 backdrop-blur-sm sm:p-6 lg:p-8"
          role="dialog"
          aria-modal="true"
          onClick={() => setTopicOpen(false)}
        >
          <div
            className="charter-modal-panel-in w-full max-w-3xl rounded-[28px] bg-white p-5 shadow-2xl sm:p-8 lg:p-10"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4 sm:mb-5">
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold tracking-[0.18em] text-[#0d9488] uppercase sm:text-sm">
                  Core Charter Topic
                </p>
                <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-kiosk-navy sm:text-3xl lg:text-4xl">
                  {activeTopic.title}
                </h3>
              </div>
              <CharterCloseButton
                onClick={() => setTopicOpen(false)}
                label={pickLang(language, "CLOSE", "ISARA", "SIRADO")}
                size="md"
              />
            </div>
            <p className="text-base leading-relaxed text-slate-600 sm:text-lg sm:leading-8 lg:text-xl">
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
                  className="h-48 w-48 sm:h-56 sm:w-56 lg:h-[16rem] lg:w-[16rem]"
                />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-400 sm:h-56 sm:w-56 lg:h-[16rem] lg:w-[16rem]">
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
  allRequested,
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
  allRequested: Array<{ office: CharterOfficeView; service: CharterServiceView }>;
  onBack: () => void;
  onBrowseMode: (mode: BrowseMode) => void;
  onQueryChange: (value: string) => void;
  onOpenCategory: (id: CharterBrowseCategoryId) => void;
  onOpenOffice: (officeId: string) => void;
  onOpenRequested: (officeId: string, serviceId: string) => void;
  onViewAll: () => void;
}) {
  const fitKey = `${browseMode}:${query}:${categoryCards.length}:${groups.length}:${allRequested.length}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className={cn("flex shrink-0 flex-wrap items-start gap-3 pt-1 sm:gap-4", kioskDateTimeReserveClass)}>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
            <KioskBackButton onClick={onBack}>Back to Overview</KioskBackButton>
            <h1 className="min-w-0 text-2xl font-black tracking-tight text-kiosk-navy uppercase sm:text-3xl lg:text-4xl">
              {browseMode === "requested" ? "Most Requested Services" : "Browse Services"}
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {browseMode === "requested"
              ? "Quick access to commonly requested provincial services."
              : "Find services, requirements, processing time, and fees."}
          </p>
        </div>
      </header>

      <div
        className={cn(
          "relative z-10 mb-3 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2.5 sm:mb-4",
          kioskDateTimeReserveClass
        )}
      >
        <p className="shrink-0 text-sm font-semibold text-kiosk-navy">Browse By</p>
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
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
          <ModeChip
            active={browseMode === "requested"}
            icon={ListChecks}
            label="Most Requested"
            onClick={() => onBrowseMode("requested")}
          />
        </div>
        {browseMode !== "requested" ? (
          <CharterCollapsibleSearch
            query={query}
            searchInputRef={searchInputRef}
            onQueryChange={onQueryChange}
          />
        ) : null}
      </div>

      <KioskFitPanel className="min-h-0 flex-1" measureKey={fitKey} fit="height">
        {browseMode === "category" ? (
          <div className="kiosk-stagger grid grid-cols-4 gap-4">
            {categoryCards.map(({ category, serviceCount }) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onOpenCategory(category.id)}
                  className="kiosk-hover-lift flex min-h-[14rem] flex-col justify-between rounded-[20px] bg-white p-6 text-left shadow-[0_10px_28px_-18px_rgba(15,35,70,0.35)]"
                >
                  <div className="flex items-start gap-5">
                    <Icon className="h-24 w-24 shrink-0" />
                    <h3
                      className={cn(
                        "line-clamp-2 pt-2 text-xl leading-snug font-extrabold tracking-wide uppercase",
                        category.titleColor
                      )}
                    >
                      {category.title}
                    </h3>
                  </div>
                  <p className="mt-5 line-clamp-3 text-[15px] leading-relaxed text-slate-600">
                    {category.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-base font-bold text-kiosk-navy">
                      {serviceCount} {serviceCount === 1 ? "Service" : "Services"}
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}

        {browseMode === "department" ? (
          <div className="kiosk-stagger grid grid-cols-4 gap-4">
            {groups.map((office) => {
              const theme = categoryForOffice(office.name);
              const Icon = officeThemeIcon(office.name);
              const serviceCount = countServices(office);
              return (
                <button
                  key={office.id}
                  type="button"
                  onClick={() => onOpenOffice(office.id)}
                  className="kiosk-hover-lift flex min-h-[14rem] flex-col justify-between rounded-[20px] bg-white p-6 text-left shadow-[0_10px_28px_-18px_rgba(15,35,70,0.35)]"
                >
                  <div className="flex items-start gap-5">
                    {theme ? (
                      <Icon className="h-24 w-24 shrink-0" />
                    ) : (
                      <span
                        className={cn(
                          "flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-white shadow-sm",
                          "bg-kiosk-navy"
                        )}
                      >
                        <Icon className="h-11 w-11" />
                      </span>
                    )}
                    <h3
                      className={cn(
                        "line-clamp-2 pt-2 text-xl leading-snug font-extrabold tracking-wide uppercase",
                        theme?.titleColor ?? "text-kiosk-navy"
                      )}
                    >
                      {office.name}
                    </h3>
                  </div>
                  <p className="mt-5 line-clamp-3 text-[15px] leading-relaxed text-slate-600">
                    {office.categories.map((category) => category.name).slice(0, 2).join(" · ") ||
                      "Provincial office services"}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-base font-bold text-kiosk-navy">
                      {serviceCount} {serviceCount === 1 ? "Service" : "Services"}
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}

        {browseMode === "requested" ? (
          <div className="kiosk-stagger grid grid-cols-3 items-start gap-3 lg:grid-cols-4">
            {allRequested.map(({ office, service }) => {
              const meta = requestedServiceMeta(service.name);
              const Icon = meta.icon;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => onOpenRequested(office.id, service.id)}
                  className="kiosk-hover-lift flex flex-col gap-2.5 rounded-[18px] bg-white p-4 text-left shadow-[0_10px_28px_-18px_rgba(15,35,70,0.35)]"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef5ff]",
                        meta.iconClass
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-[15px] leading-snug font-extrabold text-kiosk-navy">
                        {meta.label}
                      </h3>
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{office.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="text-xs font-semibold text-slate-500">Open service</span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}

        {!categoryCards.length && browseMode === "category" ? <EmptySearch /> : null}
        {!groups.length && browseMode === "department" ? <EmptySearch /> : null}
        {!allRequested.length && browseMode === "requested" ? <EmptySearch /> : null}
      </KioskFitPanel>

      {browseMode !== "requested" ? (
        <section className="shrink-0 rounded-[22px] bg-[#e8eef6]/90 px-4 py-4 sm:px-5">
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
                  className="inline-flex min-h-[48px] min-w-0 flex-1 items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 text-left shadow-[0_1px_2px_rgba(15,35,70,0.04)] transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] sm:flex-none sm:px-4"
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
              className="inline-flex min-h-[48px] items-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-[13px] font-semibold text-[#2563eb] shadow-[0_1px_2px_rgba(15,35,70,0.04)] transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] sm:text-sm"
            >
              View All
              <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </div>
        </section>
      ) : null}
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
          : "bg-white text-kiosk-navy shadow-sm hover:bg-slate-50"
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
        <div className="relative h-12 rounded-full bg-white shadow-sm">
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

function officeInitials(name: string) {
  const words = name
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((word) => word[0] ?? "")
      .join("")
      .toUpperCase();
  }
  return name.slice(0, 3).toUpperCase();
}

function CharterCloseButton({
  onClick,
  label = "CLOSE",
  size = "lg",
  ariaLabel = "Close",
}: {
  onClick: () => void;
  label?: string;
  size?: "lg" | "md";
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-rose-300 bg-rose-50 font-extrabold tracking-[0.12em] text-rose-700 shadow-sm transition hover:border-rose-400 hover:bg-rose-100 active:scale-[0.98]",
        size === "lg" ? "min-h-[3rem] px-6 py-3 text-base" : "min-h-[2.75rem] px-5 py-2.5 text-sm"
      )}
      aria-label={ariaLabel}
    >
      <X className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} strokeWidth={2.5} />
      {label}
    </button>
  );
}

function isPublishedFeeAmount(raw: string): boolean {
  const fee = raw.trim();
  if (!fee || /^(none|n\/a|free|-|—)$/i.test(fee)) return false;
  if (/^none\b/i.test(fee) && !/(?:₱|php|\d+(?:\.\d+)?\s*(?:pesos?|php))/i.test(fee)) {
    return false;
  }

  if (
    /as reflected/i.test(fee) ||
    /see (?:price list|table|cash slip|steps?|charter)/i.test(fee) ||
    /refer to/i.test(fee)
  ) {
    return false;
  }

  if (/₱|php\.?\s*\d|\bpeso?s?\b/i.test(fee)) return true;
  if (/\d+(?:\.\d{1,2})?\s*(?:\+|\/)\s*\d+/i.test(fee)) return true;
  if (/\d+(?:\.\d{1,2})?(?:\s*(?:\/head|\/ copy|per ))/i.test(fee)) return true;

  return (
    /\d+(?:\.\d{2})\b/.test(fee) &&
    !/(?:minutes?|mins?|hours?|hrs?|days?|calendar|working day)/i.test(fee)
  );
}

function publishedFee(service: CharterServiceView) {
  const fees = service.steps
    .map((step) => step.fee.trim())
    .filter(isPublishedFeeAmount);
  if (!fees.length) return "None";
  const unique = [...new Set(fees)];
  if (unique.length === 1) return unique[0];
  return "See steps";
}

/** Parse a charter step time string into minutes (best-effort). */
function parseDurationToMinutes(raw: string): number | null {
  const text = raw.toLowerCase().trim();
  if (!text || /^(none|n\/a|-|—)+$/i.test(text)) return null;

  let total = 0;
  let found = false;

  for (const match of text.matchAll(/(\d+(?:\.\d+)?)\s*(?:working\s*)?days?/gi)) {
    total += Number.parseFloat(match[1]) * 8 * 60; // working day ≈ 8 hours
    found = true;
  }
  for (const match of text.matchAll(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/gi)) {
    total += Number.parseFloat(match[1]) * 60;
    found = true;
  }
  for (const match of text.matchAll(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|min\.?)/gi)) {
    total += Number.parseFloat(match[1]);
    found = true;
  }

  return found && Number.isFinite(total) ? total : null;
}

function formatTotalMinutes(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return "See charter";

  const workingDayMinutes = 8 * 60;
  const days = Math.floor(totalMinutes / workingDayMinutes);
  let rem = Math.round(totalMinutes - days * workingDayMinutes);
  const hours = Math.floor(rem / 60);
  const minutes = rem % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  return parts.join(" ") || "See charter";
}

function totalProcessingTime(service: CharterServiceView) {
  const parsed = service.steps
    .map((step) => parseDurationToMinutes(step.time))
    .filter((value): value is number => value != null && value > 0);

  if (parsed.length) {
    return formatTotalMinutes(parsed.reduce((sum, value) => sum + value, 0));
  }

  const times = service.steps
    .map((step) => step.time.trim())
    .filter((time) => time && !/^none$|^n\/a$|^-$|^—$/i.test(time));
  if (!times.length) return "See charter";
  if (times.length === 1) return times[0];
  return "See steps";
}

function officeBlurb(office: CharterOfficeView) {
  const first = office.categories[0]?.services[0];
  if (first?.description) return first.description;
  if (first?.whoMayAvail) return `Services for ${first.whoMayAvail.toLowerCase()}.`;
  return "Official services, published fees, processing time, and charter source pages.";
}

function themeForOffice(name: string) {
  const category = categoryForOffice(name);
  if (category) {
    return {
      icon: category.icon,
      iconSrc: category.iconSrc,
      accent: category.accent,
      soft: category.soft,
      badge: `${category.titleColor} ${category.soft}`,
      titleColor: category.titleColor,
    };
  }
  return {
    icon: Building2,
    iconSrc: null as string | null,
    accent: "bg-kiosk-navy",
    soft: "bg-[#f1f5f9]",
    badge: "text-kiosk-navy bg-[#e2e8f0]",
    titleColor: "text-kiosk-navy",
  };
}

function OfficeModal({
  group,
  relatedOffices,
  category,
  edition,
  isOfficeClosing,
  isServiceClosing,
  expandedServiceId,
  activeService,
  onSelectOffice,
  onCloseOffice,
  onOpenService,
  onCloseService,
}: {
  group: CharterOfficeView;
  relatedOffices: CharterOfficeView[];
  category: CharterBrowseCategory | null;
  edition: CharterEditionView;
  isOfficeClosing: boolean;
  isServiceClosing: boolean;
  expandedServiceId: string | null;
  activeService: CharterServiceView | null;
  onSelectOffice: (officeId: string) => void;
  onCloseOffice: () => void;
  onOpenService: (serviceId: string) => void;
  onCloseService: () => void;
}) {
  const theme = themeForOffice(group.name);
  const serviceCount = countServices(group);
  const services = group.categories.flatMap((item) => item.services);
  const initials = officeInitials(group.name);
  const whoMayAvail =
    services.find((service) => service.whoMayAvail)?.whoMayAvail || "Clients and citizens";
  const [pdfOpen, setPdfOpen] = useState(false);
  const pdfSrc = edition.pdfUrl ? absolutePdfUrl(edition.pdfUrl) : "";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-kiosk-navy/55 p-3 backdrop-blur-sm sm:p-5 ${
        isOfficeClosing ? "charter-modal-backdrop-out" : "charter-modal-backdrop-in"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="charter-office-title"
      onClick={onCloseOffice}
    >
      <section
        className={`flex h-[min(92vh,920px)] w-full max-w-7xl overflow-hidden rounded-[28px] bg-[#eef3f8] shadow-2xl ring-1 ring-black/5 ${
          isOfficeClosing ? "charter-modal-panel-out" : "charter-modal-panel-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <aside className="flex min-h-0 w-[min(20rem,34%)] shrink-0 flex-col border-r border-slate-200/80 bg-[#f7fafc] p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-[10px] font-bold tracking-[0.16em] text-[#0d9488] uppercase">
              Provincial Offices
            </p>
            <div className="mt-1 flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-kiosk-navy">Departments</h3>
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#dbeafe] px-1.5 text-xs font-bold text-[#1d4ed8]">
                {relatedOffices.length}
              </span>
            </div>
          </div>

          <ScrollFadeContainer
            className="min-h-0 flex-1"
            contentClassName="space-y-2 pr-1"
            fadeClassName="from-[#f7fafc] via-[#f7fafc]/80"
          >
            {relatedOffices.map((office) => {
              const active = office.id === group.id;
              const count = countServices(office);
              return (
                <button
                  key={office.id}
                  type="button"
                  onClick={() => onSelectOffice(office.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition",
                    active
                      ? "border-l-4 border-[#0d9488] bg-[#e8f7f5] shadow-sm"
                      : "border-l-4 border-transparent bg-white hover:bg-slate-50"
                  )}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0d9488] text-[11px] font-extrabold tracking-wide text-white">
                    {officeInitials(office.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block line-clamp-2 text-sm font-bold text-kiosk-navy">
                      {office.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {count} {count === 1 ? "service" : "services"}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
              );
            })}
          </ScrollFadeContainer>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
          <header className="shrink-0 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#0d9488] text-lg font-black tracking-wide text-white sm:h-[4.5rem] sm:w-[4.5rem] sm:text-xl">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  {category ? (
                    <span className="inline-flex rounded-full bg-[#dbeafe] px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-[#1d4ed8] uppercase">
                      {category.title.replace(/ services$/i, "")}
                    </span>
                  ) : null}
                  <h2
                    id="charter-office-title"
                    className={cn(
                      "text-2xl font-extrabold tracking-tight text-kiosk-navy sm:text-[1.75rem]",
                      category ? "mt-2" : "mt-0"
                    )}
                  >
                    {group.name}
                  </h2>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
                {edition.pdfUrl ? (
                  <button
                    type="button"
                    onClick={() => setPdfOpen(true)}
                    className="inline-flex min-h-[3rem] items-center gap-2 rounded-xl border border-[#2563eb]/30 bg-white px-5 py-3 text-base font-semibold text-[#2563eb] shadow-sm transition hover:bg-blue-50"
                  >
                    <FileText className="h-5 w-5" />
                    Open full PDF
                  </button>
                ) : null}
                <CharterCloseButton onClick={onCloseOffice} />
              </div>
            </div>
            <p className="mt-4 max-w-4xl text-[15px] leading-relaxed text-slate-600">
              {officeBlurb(group)}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-2xl bg-[#f3f7fb] px-4 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0d9488] shadow-sm">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-kiosk-navy">{serviceCount} services</p>
                  <p className="text-xs text-slate-500">Documented services</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-[#f3f7fb] px-4 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0d9488] shadow-sm">
                  <UserPlus className="h-5 w-5" />
                </span>
                <div>
                  <p className="line-clamp-1 text-sm font-extrabold text-kiosk-navy">{whoMayAvail}</p>
                  <p className="text-xs text-slate-500">For whom</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-[#f3f7fb] px-4 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0d9488] shadow-sm">
                  <ListChecks className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-kiosk-navy">
                    Complete {edition.year} Charter
                  </p>
                  <p className="text-xs text-slate-500">Source</p>
                </div>
              </div>
            </div>
          </header>

          <ScrollFadeContainer
            className="min-h-0 flex-1"
            contentClassName="bg-[#f7f9fc] p-4 sm:p-5"
            fadeClassName="from-[#f7f9fc] via-[#f7f9fc]/80"
          >
            <div className="mb-4 flex items-end justify-between gap-3">
              <h3 className="text-lg font-extrabold text-kiosk-navy">Documented services</h3>
              <p className="text-xs font-medium text-slate-500">
                {services.length} {services.length === 1 ? "service" : "services"} shown
              </p>
            </div>

            <div className="kiosk-stagger grid gap-3 sm:grid-cols-2">
              {services.map((service, index) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => onOpenService(service.id)}
                  className={cn(
                    "flex flex-col rounded-[22px] border bg-white p-4 text-left shadow-[0_8px_24px_-18px_rgba(15,35,70,0.35)] transition hover:-translate-y-0.5",
                    expandedServiceId === service.id
                      ? "border-[#0d9488] ring-2 ring-[#0d9488]/15"
                      : "border-slate-200/70"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ccfbf1] text-xs font-extrabold text-[#0f766e]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] leading-snug font-extrabold text-kiosk-navy">
                        {service.name}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {service.classification ? (
                          <span className="max-w-full truncate rounded-full bg-[#ccfbf1] px-2 py-0.5 text-[10px] font-bold text-[#0f766e]">
                            {service.classification}
                          </span>
                        ) : null}
                        {service.typeOfTransaction ? (
                          <span className="max-w-[14rem] truncate rounded-full bg-[#ccfbf1] px-2 py-0.5 text-[10px] font-bold text-[#0f766e]">
                            {service.typeOfTransaction}
                          </span>
                        ) : null}
                        {service.pageNumber != null ? (
                          <span className="rounded-full bg-[#ccfbf1] px-2 py-0.5 text-[10px] font-bold text-[#0f766e]">
                            Charter p. {service.pageNumber}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-[#eef4fa] px-3 py-2.5">
                      <p className="flex items-center gap-1 text-[9px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                        <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-[9px] font-black text-[#0d9488]">
                          ₱
                        </span>
                        Published Fee
                      </p>
                      <p className="mt-1 text-sm font-bold text-kiosk-navy">{publishedFee(service)}</p>
                    </div>
                    <div className="rounded-xl bg-[#eef4fa] px-3 py-2.5">
                      <p className="flex items-center gap-1 text-[9px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                        <Clock className="h-3.5 w-3.5 text-[#0d9488]" />
                        Total Processing Time
                      </p>
                      <p className="mt-1 text-sm font-bold text-kiosk-navy">
                        {totalProcessingTime(service)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollFadeContainer>
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

      {pdfOpen && pdfSrc ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-kiosk-navy/80 p-3 backdrop-blur-sm sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-label="Citizens' Charter PDF"
          onClick={() => setPdfOpen(false)}
        >
          <div
            className="flex h-[min(94vh,960px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-kiosk-navy">
                  {edition.title || "Citizens' Charter"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {edition.year}
                  {edition.editionLabel ? ` · ${edition.editionLabel}` : ""} · Full PDF
                </p>
              </div>
              <CharterCloseButton
                onClick={() => setPdfOpen(false)}
                size="md"
                ariaLabel="Close PDF"
              />
            </header>
            <div className="min-h-0 flex-1 bg-slate-100">
              <iframe
                title="Citizens' Charter PDF"
                src={`${pdfSrc}#toolbar=1&navpanes=0`}
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      ) : null}
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
        className={`flex max-h-[92vh] min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-kiosk-green/40 bg-white shadow-2xl ${
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
          <CharterCloseButton
            onClick={onClose}
            size="md"
            ariaLabel="Close service details"
          />
        </header>

        <ScrollFadeContainer
          className="min-h-0 flex-1"
          contentClassName="p-4 sm:p-5"
          fadeClassName="from-white via-white/80"
        >
          <div className="space-y-4">
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
        </ScrollFadeContainer>
      </section>
    </div>
  );
}
