"use client";

import "pdfjs-dist/web/pdf_viewer.css";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist";
import type { EventBus, PDFLinkService, PDFViewer } from "pdfjs-dist/web/pdf_viewer.mjs";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  File,
  ListTree,
  MoveHorizontal,
  RefreshCw,
  RotateCw,
  ScrollText,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { pickLang } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

type PdfjsModules = {
  pdfjs: typeof import("pdfjs-dist");
  viewer: typeof import("pdfjs-dist/web/pdf_viewer.mjs");
};

let modulesPromise: Promise<PdfjsModules> | null = null;

function loadPdfjs(): Promise<PdfjsModules> {
  modulesPromise ??= (async () => {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    // The viewer bundle reads the core library from this global while it is being evaluated.
    (globalThis as { pdfjsLib?: unknown }).pdfjsLib = pdfjs;
    const viewer = await import("pdfjs-dist/web/pdf_viewer.mjs");
    return { pdfjs, viewer };
  })().catch((error: unknown) => {
    modulesPromise = null;
    throw error;
  });
  return modulesPromise;
}

type OutlineNode = { title: string; dest: string | unknown[] | null; items: OutlineNode[] };

/** A contents entry points at the page number printed in the charter, not the PDF page index. */
export type CharterPdfContentsEntry = { title: string; page: number };
export type CharterPdfContentsSection = { title: string; entries: CharterPdfContentsEntry[] };

const compactText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Printed page numbers trail the PDF index by the unnumbered front pages. Each charter page's text
 * starts with its printed number, so look for that (or the entry's title) on nearby pages; the jump
 * stays right even if the front matter changes.
 */
async function findPrintedPage(
  pdfDocument: PDFDocumentProxy,
  entry: CharterPdfContentsEntry,
  knownOffset: number | null
): Promise<{ page: number; offset: number | null }> {
  const printed = String(entry.page);
  const needle = compactText(entry.title).slice(0, 32);
  const offsets = [...new Set([knownOffset ?? 2, 2, 1, 3, 0, 4, 5, 6, -1, 7, 8])];
  for (const offset of offsets) {
    const candidate = entry.page + offset;
    if (candidate < 1 || candidate > pdfDocument.numPages) continue;
    try {
      const content = await (await pdfDocument.getPage(candidate)).getTextContent();
      const strings = content.items.map((item) => ("str" in item ? item.str.trim() : "")).filter(Boolean);
      if (strings[0] === printed || (needle && compactText(strings.join("")).includes(needle))) {
        return { page: candidate, offset };
      }
    } catch {
      // Unreadable page: keep looking.
    }
  }
  const fallback = entry.page + (knownOffset ?? 0);
  return { page: Math.min(Math.max(fallback, 1), pdfDocument.numPages), offset: null };
}
type PageView = "continuous" | "single" | "spread";
type Matches = { current: number; total: number };

const SCALE_PRESETS = new Set(["auto", "page-actual", "page-fit", "page-width"]);
const FIND_NOT_FOUND = 1;
const FIND_PENDING = 3;

/**
 * Read-only Citizens' Charter viewer: contents, search, zoom, page number, page view and rotate.
 * Deliberately has no print, download or annotation tools.
 */
export function CharterPdfViewer({
  src,
  contents = [],
}: {
  src: string;
  /** Charter offices and services; used as the table of contents when the PDF has no bookmarks. */
  contents?: CharterPdfContentsSection[];
}) {
  const { language } = useKiosk();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const pdfDocumentRef = useRef<PDFDocumentProxy | null>(null);
  const resolvedPagesRef = useRef(new Map<string, number>());
  const pageOffsetRef = useRef<number | null>(null);
  const pdfViewerRef = useRef<PDFViewer | null>(null);
  const linkServiceRef = useRef<PDFLinkService | null>(null);
  const eventBusRef = useRef<EventBus | null>(null);
  const modulesRef = useRef<PdfjsModules | null>(null);

  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [pagesCount, setPagesCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [scale, setScale] = useState(1);
  const [pageView, setPageView] = useState<PageView>("continuous");
  const [outline, setOutline] = useState<OutlineNode[] | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Matches>({ current: 0, total: 0 });
  const [findState, setFindState] = useState<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const viewerElement = viewerRef.current;
    if (!container || !viewerElement) return;

    const abort = new AbortController();
    let loadingTask: PDFDocumentLoadingTask | null = null;
    let disposed = false;
    setStatus("loading");
    setOutline(null);

    void (async () => {
      try {
        const modules = await loadPdfjs();
        if (disposed) return;
        const { pdfjs, viewer } = modules;
        modulesRef.current = modules;

        const eventBus = new viewer.EventBus();
        const linkService = new viewer.PDFLinkService({ eventBus });
        // A public kiosk must not navigate away to websites linked inside the PDF.
        linkService.externalLinkEnabled = false;
        const findController = new viewer.PDFFindController({ eventBus, linkService });
        const pdfViewer = new viewer.PDFViewer({
          container,
          viewer: viewerElement,
          eventBus,
          linkService,
          findController,
          annotationMode: pdfjs.AnnotationMode.ENABLE,
          annotationEditorMode: pdfjs.AnnotationEditorType.DISABLE,
          imagesRightClickMinSize: -1,
          abortSignal: abort.signal,
        } as ConstructorParameters<typeof viewer.PDFViewer>[0]);
        linkService.setViewer(pdfViewer);

        // Fit-to-width must follow the pane when the contents panel opens or the screen resizes.
        const resizeObserver = new ResizeObserver(() => {
          const value = pdfViewer.currentScaleValue;
          if (SCALE_PRESETS.has(value)) pdfViewer.currentScaleValue = value;
        });
        resizeObserver.observe(container);
        abort.signal.addEventListener("abort", () => resizeObserver.disconnect(), { once: true });

        eventBus.on("pagesinit", () => {
          pdfViewer.currentScaleValue = "page-width";
        });
        eventBus.on("pagechanging", ({ pageNumber }: { pageNumber: number }) => setPage(pageNumber));
        eventBus.on("scalechanging", ({ scale: next }: { scale: number }) => setScale(next));
        eventBus.on("updatefindmatchescount", ({ matchesCount }: { matchesCount: Matches }) =>
          setMatches(matchesCount)
        );
        eventBus.on(
          "updatefindcontrolstate",
          ({ state, matchesCount }: { state: number; matchesCount?: Matches }) => {
            setFindState(state);
            if (matchesCount) setMatches(matchesCount);
          }
        );

        pdfViewerRef.current = pdfViewer;
        linkServiceRef.current = linkService;
        eventBusRef.current = eventBus;

        loadingTask = pdfjs.getDocument({ url: src });
        const pdfDocument = await loadingTask.promise;
        if (disposed) return;
        pdfDocumentRef.current = pdfDocument;
        resolvedPagesRef.current = new Map();
        pageOffsetRef.current = null;
        pdfViewer.setDocument(pdfDocument);
        linkService.setDocument(pdfDocument);
        setPagesCount(pdfDocument.numPages);
        setPage(1);
        setStatus("ready");

        const tree = await pdfDocument.getOutline().catch(() => null);
        if (!disposed) setOutline((tree as OutlineNode[] | null) ?? []);
      } catch {
        if (!disposed) setStatus("error");
      }
    })();

    return () => {
      disposed = true;
      abort.abort();
      try {
        pdfViewerRef.current?.setDocument(null as never);
      } catch {
        // Already torn down.
      }
      void loadingTask?.destroy();
      pdfDocumentRef.current = null;
      pdfViewerRef.current = null;
      linkServiceRef.current = null;
      eventBusRef.current = null;
      viewerElement.replaceChildren();
    };
  }, [src, attempt]);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  // Search as the visitor types; Enter / arrows step through the matches.
  useEffect(() => {
    if (status !== "ready") return;
    const timer = window.setTimeout(() => {
      eventBusRef.current?.dispatch("find", {
        source: null,
        type: "",
        query: query.trim(),
        caseSensitive: false,
        entireWord: false,
        highlightAll: true,
        findPrevious: false,
        matchDiacritics: false,
      });
      if (!query.trim()) {
        setMatches({ current: 0, total: 0 });
        setFindState(null);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, status]);

  const findAgain = useCallback(
    (previous: boolean) => {
      if (!query.trim()) return;
      eventBusRef.current?.dispatch("find", {
        source: null,
        type: "again",
        query: query.trim(),
        caseSensitive: false,
        entireWord: false,
        highlightAll: true,
        findPrevious: previous,
        matchDiacritics: false,
      });
    },
    [query]
  );

  const goToPage = (event: Pick<FormEvent, "preventDefault">) => {
    event.preventDefault();
    const viewer = pdfViewerRef.current;
    const target = Number.parseInt(pageInput, 10);
    if (!viewer || !Number.isFinite(target)) {
      setPageInput(String(page));
      return;
    }
    viewer.currentPageNumber = Math.min(Math.max(target, 1), pagesCount);
    setPageInput(String(viewer.currentPageNumber));
  };

  const applyPageView = (next: PageView) => {
    const viewer = pdfViewerRef.current;
    const modules = modulesRef.current;
    if (!viewer || !modules) return;
    const { ScrollMode, SpreadMode } = modules.viewer;
    viewer.scrollMode = next === "single" ? ScrollMode.PAGE : ScrollMode.VERTICAL;
    viewer.spreadMode = next === "spread" ? SpreadMode.ODD : SpreadMode.NONE;
    viewer.currentScaleValue = "page-width";
    setPageView(next);
  };

  const goToContentsEntry = async (entry: CharterPdfContentsEntry) => {
    const pdfDocument = pdfDocumentRef.current;
    const viewer = pdfViewerRef.current;
    if (!pdfDocument || !viewer) return;
    const key = `${entry.page}|${entry.title}`;
    let target = resolvedPagesRef.current.get(key);
    if (target == null) {
      const found = await findPrintedPage(pdfDocument, entry, pageOffsetRef.current);
      if (found.offset != null) pageOffsetRef.current = found.offset;
      target = found.page;
      resolvedPagesRef.current.set(key, target);
    }
    if (pdfViewerRef.current === viewer) viewer.currentPageNumber = target;
  };

  const rotate = () => {
    const viewer = pdfViewerRef.current;
    if (viewer) viewer.pagesRotation = (viewer.pagesRotation + 90) % 360;
  };

  const ready = status === "ready";
  const searchStatus = !query.trim()
    ? ""
    : findState === FIND_PENDING
      ? pickLang(language, "Searching…", "Hinahanap…", "Gipangita…")
      : matches.total > 0
        ? `${matches.current} / ${matches.total}`
        : findState === FIND_NOT_FOUND
          ? pickLang(language, "No results", "Walang resulta", "Walay resulta")
          : "";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 sm:px-4"
        role="toolbar"
        aria-label={pickLang(language, "PDF tools", "Mga tool ng PDF", "Mga himan sa PDF")}
      >
        <ToolButton
          label={pickLang(language, "Table of contents", "Talaan ng nilalaman", "Talaan sa sulod")}
          active={tocOpen}
          disabled={!ready}
          onClick={() => setTocOpen((open) => !open)}
        >
          <ListTree className="h-5 w-5" />
        </ToolButton>

        <div className="flex min-w-[15rem] flex-1 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 pr-1 pl-3 focus-within:border-kiosk-navy/40 focus-within:bg-white">
          <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          <input
            type="search"
            value={query}
            disabled={!ready}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              findAgain(event.shiftKey);
            }}
            placeholder={pickLang(language, "Search the charter", "Maghanap sa charter", "Pangitaa sa charter")}
            aria-label={pickLang(language, "Search the charter", "Maghanap sa charter", "Pangitaa sa charter")}
            className="h-11 min-w-0 flex-1 bg-transparent text-sm text-kiosk-navy outline-none placeholder:text-slate-400"
          />
          {searchStatus ? (
            <span className="shrink-0 px-1 text-xs font-semibold whitespace-nowrap text-slate-500 tabular-nums" aria-live="polite">
              {searchStatus}
            </span>
          ) : null}
          <ToolButton
            small
            label={pickLang(language, "Previous match", "Nakaraang tugma", "Miaging tugma")}
            disabled={matches.total === 0}
            onClick={() => findAgain(true)}
          >
            <ChevronUp className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            small
            label={pickLang(language, "Next match", "Susunod na tugma", "Sunod nga tugma")}
            disabled={matches.total === 0}
            onClick={() => findAgain(false)}
          >
            <ChevronDown className="h-4 w-4" />
          </ToolButton>
        </div>

        <ToolGroup>
          <ToolButton
            label={pickLang(language, "Previous page", "Nakaraang pahina", "Miaging panid")}
            disabled={!ready || page <= 1}
            onClick={() => pdfViewerRef.current?.previousPage()}
          >
            <ChevronLeft className="h-5 w-5" />
          </ToolButton>
          <form onSubmit={goToPage} className="flex items-center gap-1.5 px-1 text-sm text-slate-500">
            <input
              type="text"
              inputMode="numeric"
              value={pageInput}
              disabled={!ready}
              onChange={(event) => setPageInput(event.target.value.replace(/\D/g, ""))}
              onBlur={goToPage}
              aria-label={pickLang(language, "Page number", "Numero ng pahina", "Numero sa panid")}
              className="h-10 w-12 rounded-lg border border-slate-200 bg-white text-center font-semibold text-kiosk-navy tabular-nums outline-none focus:border-kiosk-navy/40"
            />
            <span className="whitespace-nowrap tabular-nums">
              {pickLang(language, "of", "ng", "sa")} {pagesCount || "–"}
            </span>
          </form>
          <ToolButton
            label={pickLang(language, "Next page", "Susunod na pahina", "Sunod nga panid")}
            disabled={!ready || page >= pagesCount}
            onClick={() => pdfViewerRef.current?.nextPage()}
          >
            <ChevronRight className="h-5 w-5" />
          </ToolButton>
        </ToolGroup>

        <ToolGroup>
          <ToolButton
            label={pickLang(language, "Zoom out", "Paliitin", "Gamyon")}
            disabled={!ready}
            onClick={() => pdfViewerRef.current?.decreaseScale()}
          >
            <ZoomOut className="h-5 w-5" />
          </ToolButton>
          <span className="w-12 text-center text-sm font-semibold text-kiosk-navy tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <ToolButton
            label={pickLang(language, "Zoom in", "Palakihin", "Dakoon")}
            disabled={!ready}
            onClick={() => pdfViewerRef.current?.increaseScale()}
          >
            <ZoomIn className="h-5 w-5" />
          </ToolButton>
          <ToolButton
            label={pickLang(language, "Fit to width", "Sukat sa lapad", "Haom sa gilapdon")}
            disabled={!ready}
            onClick={() => {
              if (pdfViewerRef.current) pdfViewerRef.current.currentScaleValue = "page-width";
            }}
          >
            <MoveHorizontal className="h-5 w-5" />
          </ToolButton>
        </ToolGroup>

        <ToolGroup label={pickLang(language, "Page view", "Tingin ng pahina", "Pagtan-aw sa panid")}>
          <ToolButton
            label={pickLang(language, "Continuous scroll", "Tuloy-tuloy na scroll", "Padayon nga scroll")}
            active={pageView === "continuous"}
            disabled={!ready}
            onClick={() => applyPageView("continuous")}
          >
            <ScrollText className="h-5 w-5" />
          </ToolButton>
          <ToolButton
            label={pickLang(language, "Single page", "Isang pahina", "Usa ka panid")}
            active={pageView === "single"}
            disabled={!ready}
            onClick={() => applyPageView("single")}
          >
            <File className="h-5 w-5" />
          </ToolButton>
          <ToolButton
            label={pickLang(language, "Two pages", "Dalawang pahina", "Duha ka panid")}
            active={pageView === "spread"}
            disabled={!ready}
            onClick={() => applyPageView("spread")}
          >
            <BookOpen className="h-5 w-5" />
          </ToolButton>
        </ToolGroup>

        <ToolButton label={pickLang(language, "Rotate", "Iikot", "Ibalik")} disabled={!ready} onClick={rotate}>
          <RotateCw className="h-5 w-5" />
        </ToolButton>
      </div>

      <div className="relative flex min-h-0 flex-1">
        {tocOpen ? (
          <aside
            className="kiosk-main-scroll w-80 max-w-[45%] shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-2"
            aria-label={pickLang(language, "Table of contents", "Talaan ng nilalaman", "Talaan sa sulod")}
          >
            {outline && outline.length > 0 ? (
              <OutlineList items={outline} onSelect={(dest) => void linkServiceRef.current?.goToDestination(dest)} />
            ) : contents.length > 0 ? (
              <ContentsList
                sections={contents}
                pageLabel={pickLang(language, "p.", "p.", "p.")}
                onSelect={(entry) => void goToContentsEntry(entry)}
              />
            ) : (
              <ul className="space-y-0.5">
                {Array.from({ length: pagesCount }, (_, index) => index + 1).map((number) => (
                  <li key={number}>
                    <button
                      type="button"
                      onClick={() => {
                        if (pdfViewerRef.current) pdfViewerRef.current.currentPageNumber = number;
                      }}
                      className={cn(
                        "w-full rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-slate-100",
                        number === page ? "bg-kiosk-navy/10 font-bold text-kiosk-navy" : "text-slate-700"
                      )}
                    >
                      {pickLang(language, "Page", "Pahina", "Panid")} {number}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        ) : null}

        <div className="relative min-w-0 flex-1 bg-slate-100">
          <div
            ref={containerRef}
            className="kiosk-main-scroll absolute inset-0 overflow-auto"
            onContextMenu={(event) => event.preventDefault()}
          >
            <div ref={viewerRef} className="pdfViewer" />
          </div>

          {status !== "ready" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-100 text-sm text-slate-600">
              {status === "loading" ? (
                <>
                  <RefreshCw className="h-6 w-6 animate-spin text-kiosk-navy" aria-hidden />
                  {pickLang(language, "Loading the charter…", "Nilo-load ang charter…", "Gikarga ang charter…")}
                </>
              ) : (
                <>
                  <p className="font-semibold text-slate-700">
                    {pickLang(
                      language,
                      "The charter PDF could not be opened.",
                      "Hindi mabuksan ang PDF ng charter.",
                      "Dili maablihan ang PDF sa charter."
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => setAttempt((count) => count + 1)}
                    className="min-h-11 rounded-xl bg-kiosk-navy px-5 text-sm font-semibold text-white active:scale-95"
                  >
                    {pickLang(language, "Try again", "Subukang muli", "Sulayi pag-usab")}
                  </button>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OutlineList({
  items,
  onSelect,
  depth = 0,
}: {
  items: OutlineNode[];
  onSelect: (dest: string | unknown[]) => void;
  depth?: number;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((item, index) => (
        <li key={`${depth}-${index}-${item.title}`}>
          <button
            type="button"
            disabled={!item.dest}
            onClick={() => item.dest && onSelect(item.dest)}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm leading-snug text-slate-700 transition hover:bg-slate-100 disabled:cursor-default disabled:hover:bg-transparent"
            style={{ paddingLeft: `${0.75 + depth * 0.9}rem` }}
          >
            {item.title}
          </button>
          {item.items?.length ? <OutlineList items={item.items} onSelect={onSelect} depth={depth + 1} /> : null}
        </li>
      ))}
    </ul>
  );
}

function ContentsList({
  sections,
  pageLabel,
  onSelect,
}: {
  sections: CharterPdfContentsSection[];
  pageLabel: string;
  onSelect: (entry: CharterPdfContentsEntry) => void;
}) {
  return (
    <ul className="space-y-2">
      {sections.map((section) => (
        <li key={section.title}>
          <button
            type="button"
            onClick={() => onSelect(section.entries[0])}
            className="w-full rounded-lg px-3 py-2 text-left text-[13px] leading-snug font-extrabold text-kiosk-navy uppercase transition hover:bg-slate-100"
          >
            {section.title}
          </button>
          <ul className="space-y-0.5">
            {section.entries.map((entry) => (
              <li key={`${entry.page}-${entry.title}`}>
                <button
                  type="button"
                  onClick={() => onSelect(entry)}
                  className="flex w-full items-start gap-2 rounded-lg py-2 pr-3 pl-5 text-left text-sm leading-snug text-slate-700 transition hover:bg-slate-100"
                >
                  <span className="min-w-0 flex-1">{entry.title}</span>
                  <span className="shrink-0 pt-0.5 text-xs text-slate-400 tabular-nums">
                    {pageLabel} {entry.page}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function ToolGroup({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-0.5" role="group" aria-label={label}>
      {children}
    </div>
  );
}

function ToolButton({
  label,
  children,
  onClick,
  active = false,
  disabled = false,
  small = false,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active || undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg text-kiosk-navy transition active:scale-95 disabled:pointer-events-none disabled:opacity-35",
        small ? "h-9 w-9" : "h-11 w-11",
        active ? "bg-kiosk-navy text-white shadow-sm" : "hover:bg-slate-200/70"
      )}
    >
      {children}
    </button>
  );
}
