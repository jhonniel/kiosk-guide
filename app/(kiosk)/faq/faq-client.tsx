"use client";

import { useMemo, useState } from "react";
import { ChevronDown, MessageCircle, Search, X } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { localized, pickLang } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { Faq } from "@prisma/client";

const CATEGORY_META: Record<string, { en: string; fil: string; bis: string }> = {
  all: { en: "All", fil: "Lahat", bis: "Tanan" },
  general: { en: "General", fil: "Pangkalahatan", bis: "Kinatibuk-an" },
  services: { en: "Services", fil: "Serbisyo", bis: "Serbisyo" },
  tourism: { en: "Tourism", fil: "Turismo", bis: "Turismo" },
  travel: { en: "Travel", fil: "Paglalakbay", bis: "Pagbiyahe" },
  emergency: { en: "Emergency", fil: "Emergency", bis: "Emergency" },
  events: { en: "Events", fil: "Mga Kaganapan", bis: "Mga Kalihokan" },
  kiosk: { en: "Kiosk", fil: "Kiosk", bis: "Kiosk" },
};

function categoryLabel(category: string | null | undefined, language: "en" | "fil" | "bis") {
  const key = category || "general";
  const meta = CATEGORY_META[key] ?? CATEGORY_META.general;
  return pickLang(language, meta.en, meta.fil, meta.bis);
}

export function FaqClient({ faqs }: { faqs: Faq[] }) {
  const { language } = useKiosk();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const present = new Set(faqs.map((faq) => faq.category || "general"));
    return ["all", ...Object.keys(CATEGORY_META).filter((key) => key !== "all" && present.has(key))];
  }, [faqs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter((faq) => {
      if (category !== "all" && (faq.category || "general") !== category) return false;
      if (!q) return true;
      const question = localized(faq, language, "question").toLowerCase();
      const answer = localized(faq, language, "answer").toLowerCase();
      return question.includes(q) || answer.includes(q) || (faq.category ?? "").includes(q);
    });
  }, [faqs, category, query, language]);

  const grouped = useMemo(() => {
    const order = Object.keys(CATEGORY_META).filter((key) => key !== "all");
    const buckets = new Map<string, Faq[]>();

    for (const faq of filtered) {
      const key = faq.category || "general";
      const list = buckets.get(key) ?? [];
      list.push(faq);
      buckets.set(key, list);
    }

    const known = order
      .filter((key) => buckets.has(key))
      .map((key) => ({ key, items: buckets.get(key)! }));

    const extras = [...buckets.keys()]
      .filter((key) => !order.includes(key))
      .map((key) => ({ key, items: buckets.get(key)! }));

    return [...known, ...extras];
  }, [filtered]);

  return (
    <div className="w-full space-y-5 pb-8">
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80">
        <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_55%,#f0f9ff_100%)] px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                {pickLang(language, "Knowledge base", "Knowledge base", "Knowledge base")}
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-kiosk-navy">
                {pickLang(
                  language,
                  "Find answers about Camiguin & the Capitol",
                  "Maghanap ng sagot tungkol sa Camiguin at Capitol",
                  "Pangita og tubag bahin sa Camiguin ug Capitol"
                )}
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-xs font-medium text-sky-900 ring-1 ring-sky-100">
              <MessageCircle className="h-3.5 w-3.5 shrink-0 text-sky-700" />
              <span>
                {pickLang(
                  language,
                  "Need more help? Tap Cami at the bottom right.",
                  "Kailangan ng tulong? Pindutin si Cami sa ibabang kanan.",
                  "Kinahanglan og tabang? Pindota si Cami sa ubos tuo."
                )}
              </span>
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={pickLang(
                language,
                "Search questions and answers…",
                "Maghanap sa mga tanong at sagot…",
                "Pangita sa mga pangutana ug tubag…"
              )}
              className="w-full rounded-xl border-0 bg-white py-3.5 pr-11 pl-11 text-sm text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-kiosk-navy/20"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-3 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label={pickLang(language, "Clear search", "I-clear ang search", "I-clear ang search")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-4">
          {categories.map((key) => {
            const meta = CATEGORY_META[key] ?? CATEGORY_META.general;
            const selected = category === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setCategory(key);
                  setOpenId(null);
                }}
                className={cn(
                  "shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold tracking-wide transition",
                  selected
                    ? "bg-kiosk-navy text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-kiosk-navy"
                )}
              >
                {pickLang(language, meta.en, meta.fil, meta.bis)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="kiosk-stagger space-y-7">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-600">
              {pickLang(
                language,
                "No matching FAQs. Try another search or ask Cami.",
                "Walang tumugmang FAQ. Subukan ang ibang search o magtanong kay Cami.",
                "Walay mohaum nga FAQ. Sulayi ang laing search o pangutana kang Cami."
              )}
            </p>
          </div>
        )}

        {grouped.map((group) => (
          <section key={group.key} className="space-y-3">
            <div className="flex items-center gap-3 px-1">
              <h3 className="text-[11px] font-bold tracking-[0.16em] text-slate-500 uppercase">
                {categoryLabel(group.key, language)}
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
            </div>

            <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80">
              {group.items.map((faq, index) => {
                const isOpen = openId === faq.id;
                const question = localized(faq, language, "question");
                const answer = localized(faq, language, "answer");
                const isLast = index === group.items.length - 1;

                return (
                  <article
                    key={faq.id}
                    className={cn(!isLast && "border-b border-slate-100")}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : faq.id)}
                      className={cn(
                        "flex w-full items-center gap-4 px-5 py-4 text-left transition sm:px-6 sm:py-5",
                        isOpen ? "bg-slate-50/80" : "hover:bg-slate-50/70"
                      )}
                      aria-expanded={isOpen}
                    >
                      <div
                        className={cn(
                          "mt-0.5 h-8 w-1 shrink-0 rounded-full transition",
                          isOpen ? "bg-kiosk-navy" : "bg-slate-200"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <h4
                          className={cn(
                            "text-[15px] leading-snug font-semibold text-balance sm:text-[16px]",
                            isOpen ? "text-kiosk-navy" : "text-slate-800"
                          )}
                        >
                          {question}
                        </h4>
                      </div>
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition",
                          isOpen
                            ? "bg-kiosk-navy text-white"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            isOpen && "rotate-180"
                          )}
                        />
                      </span>
                    </button>

                    <div
                      className={cn(
                        "grid transition-[grid-template-rows] duration-300 ease-out",
                        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="px-5 pb-5 pl-[2.15rem] sm:px-6 sm:pb-6 sm:pl-[2.4rem]">
                          <p className="max-w-4xl text-sm leading-7 whitespace-pre-line text-slate-600">
                            {answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
