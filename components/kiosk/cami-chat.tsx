"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Send, X } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { pickLang } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import {
  buildCamiCorpus,
  buildLocalReply,
  isGreetingOrMetaQuery,
  isInScopeQuery,
  outOfScopeReply,
  rankChunks,
} from "@/features/cami/retrieve-context";
import type { CamiCitation, CamiMessage } from "@/features/cami/types";

const CAMI_ICON = "/images/cami/cami-clear.webp";
const CAMI_ICON_STATIC = "/images/cami/cami-badge-solid.jpg";
const IDLE_CLEAR_MS = 5 * 60 * 1000;

type ChatItem = CamiMessage & {
  citations?: CamiCitation[];
  source?: string;
  usedWeb?: boolean;
};

const SUGGESTIONS = [
  {
    en: "What can I find on this kiosk?",
    fil: "Ano ang makikita sa kiosk na ito?",
    bis: "Unsa ang makita niining kiosk?",
  },
  {
    en: "What are the Capitol office hours?",
    fil: "Ano ang oras ng opisina sa Capitol?",
    bis: "Unsa ang oras sa opisina sa Capitol?",
  },
  {
    en: "Where are emergency hotlines?",
    fil: "Saan ang emergency hotlines?",
    bis: "Asa ang emergency hotlines?",
  },
  {
    en: "How do I download forms?",
    fil: "Paano mag-download ng forms?",
    bis: "Unsaon pag-download og forms?",
  },
];

function welcomeMessage(language: "en" | "fil" | "bis") {
  return pickLang(
    language,
    "Hi, I’m Cami—your Camiguin kiosk assistant. Ask me about tourism, services, events, emergency contacts, downloads, or other information in this system.",
    "Kumusta, ako si Cami—ang Camiguin assistant ng kiosk. Magtanong tungkol sa turismo, serbisyo, events, emergency contacts, downloads, o iba pang impormasyon sa system na ito.",
    "Kumusta, ako si Cami—ang Camiguin assistant sa kiosk. Pangutana bahin sa turismo, serbisyo, events, emergency contacts, downloads, o ubang impormasyon niining system."
  );
}

export function CamiChat() {
  const { language } = useKiosk();
  const offlineData = useKioskOfflineData();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatItem[]>([
    { role: "assistant", content: welcomeMessage(language) },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const lastActiveRef = useRef(Date.now());
  const idleTimerRef = useRef<number | null>(null);
  const languageRef = useRef(language);
  const openRef = useRef(open);
  languageRef.current = language;
  openRef.current = open;

  function resetChat(nextLanguage = languageRef.current) {
    setMessages([{ role: "assistant", content: welcomeMessage(nextLanguage) }]);
    setInput("");
    setBusy(false);
  }

  function touchActivity() {
    lastActiveRef.current = Date.now();
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      resetChat();
      if (openRef.current) {
        setClosing(false);
        setOpen(false);
      }
    }, IDLE_CLEAR_MS);
  }

  useEffect(() => {
    touchActivity();
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0]?.role === "assistant") {
        return [{ role: "assistant", content: welcomeMessage(language) }];
      }
      return prev;
    });
  }, [language]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, closing]);

  function openChat() {
    touchActivity();
    setClosing(false);
    setOpen(true);
  }

  function closeChat() {
    if (closing) return;
    touchActivity();
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
      resetChat();
    }, 220);
  }

  async function sendMessage(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;

    touchActivity();
    const history = messages.map(({ role, content }) => ({ role, content }));
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setBusy(true);

    try {
      const online = typeof navigator === "undefined" ? true : navigator.onLine;
      if (online) {
        const res = await fetch("/api/cami/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            language,
            history: history.slice(-8),
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as {
            reply: string;
            citations?: CamiCitation[];
            source?: string;
            usedWeb?: boolean;
          };
          touchActivity();
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.reply,
              citations: data.citations,
              source: data.source,
              usedWeb: data.usedWeb,
            },
          ]);
          return;
        }
      }

      const corpus = buildCamiCorpus(
        {
          faqs: offlineData?.faqs,
          tourism: offlineData?.tourism,
          events: offlineData?.events,
          emergency: offlineData?.emergency,
          services: offlineData?.services,
          directories: offlineData?.directories,
          downloads: offlineData?.downloads,
          announcements: offlineData?.announcements,
        },
        language
      );

      if (!isInScopeQuery(text)) {
        touchActivity();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: outOfScopeReply(language),
            source: "offline",
          },
        ]);
        return;
      }

      if (isGreetingOrMetaQuery(text)) {
        touchActivity();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: pickLang(
              language,
              "Hi! I’m Cami. Ask me about Camiguin—tourism, services, events, emergency contacts, or other info on this kiosk.",
              "Kumusta! Ako si Cami. Magtanong tungkol sa Camiguin—turismo, serbisyo, events, emergency contacts, o iba pang impormasyon sa kiosk.",
              "Kumusta! Ako si Cami. Pangutana bahin sa Camiguin—turismo, serbisyo, events, emergency contacts, o ubang impormasyon sa kiosk."
            ),
            source: "offline",
          },
        ]);
        return;
      }

      const ranked = rankChunks(text, corpus, 6);
      touchActivity();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: buildLocalReply(text, ranked, language),
          citations: ranked.slice(0, 4).map((chunk) => ({
            title: chunk.title,
            href: chunk.href,
            type: chunk.type,
          })),
          source: "offline",
        },
      ]);
    } catch {
      touchActivity();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: pickLang(
            language,
            "I couldn’t reach the assistant service just now. Please try again.",
            "Hindi maabot ang assistant service sa ngayon. Subukan ulit.",
            "Dili maabot ang assistant service karon. Sulayi pag-usab."
          ),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pointer-events-none fixed right-4 bottom-20 z-[80] flex flex-col items-end gap-3 sm:right-6 sm:bottom-[5.5rem]">
      {(open || closing) && (
        <div
          className={cn(
            "pointer-events-auto flex h-[min(560px,calc(100vh-9.5rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.55)] ring-1 ring-slate-200/80",
            closing ? "cami-popup-out" : "cami-popup-in"
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cami-chat-title"
          onPointerDown={touchActivity}
          onKeyDown={touchActivity}
        >
          <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-600 px-4 py-3.5 text-white">
            <div className="absolute -top-8 -right-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative flex items-start gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white shadow-md ring-2 ring-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={CAMI_ICON_STATIC}
                  alt="Cami"
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
              <div className="min-w-0 flex-1 pr-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">
                  {pickLang(language, "Camiguin assistant", "Camiguin assistant", "Camiguin assistant")}
                </p>
                <h2 id="cami-chat-title" className="text-lg font-extrabold tracking-tight">
                  Cami
                </h2>
              </div>
              <button
                type="button"
                onClick={closeChat}
                className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-kiosk-navy shadow-md transition hover:scale-105 hover:bg-white"
                aria-label={pickLang(language, "Close Cami", "Isara si Cami", "Isira si Cami")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-slate-100 bg-slate-50/90 px-3 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SUGGESTIONS.map((item) => {
              const label = pickLang(language, item.en, item.fil, item.bis);
              return (
                <button
                  key={item.en}
                  type="button"
                  disabled={busy}
                  onClick={() => sendMessage(label)}
                  className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-sky-50 hover:text-sky-800 disabled:opacity-60"
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div ref={listRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    message.role === "user"
                      ? "bg-kiosk-navy text-white"
                      : "bg-slate-100 text-slate-800 ring-1 ring-slate-200/70"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div
                  className="cami-typing inline-flex items-center rounded-2xl rounded-bl-md bg-slate-100 px-3.5 py-2.5 ring-1 ring-slate-200/70"
                  role="status"
                  aria-live="polite"
                  aria-label={pickLang(
                    language,
                    "Cami is composing a reply",
                    "Gumagawa si Cami ng sagot",
                    "Naghimog tubag si Cami"
                  )}
                >
                  <span className="cami-typing-dots" aria-hidden="true">
                    <span className="cami-typing-dot" />
                    <span className="cami-typing-dot" />
                    <span className="cami-typing-dot" />
                  </span>
                </div>
              </div>
            )}
          </div>

          <form
            className="shrink-0 border-t border-slate-100 bg-white p-2.5"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <div className="flex items-end gap-2 rounded-xl bg-slate-50 p-1.5 ring-1 ring-slate-200 focus-within:ring-sky-300">
              <textarea
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  touchActivity();
                }}
                rows={2}
                placeholder={pickLang(
                  language,
                  "Ask Cami…",
                  "Magtanong kay Cami…",
                  "Pangutana kang Cami…"
                )}
                className="max-h-24 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                onKeyDown={(event) => {
                  touchActivity();
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage(input);
                  }
                }}
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-kiosk-navy text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={pickLang(language, "Send", "Ipadala", "Ipadala")}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => (open ? closeChat() : openChat())}
        className={cn(
          "pointer-events-auto group flex items-center gap-2.5 rounded-full bg-white py-2 pr-4 pl-2 text-kiosk-navy shadow-[0_14px_36px_-12px_rgba(8,145,178,0.55)] ring-1 ring-sky-200/80 transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_18px_40px_-12px_rgba(8,145,178,0.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400",
          open && "ring-2 ring-cyan-400"
        )}
        aria-expanded={open}
        aria-label={
          open
            ? pickLang(language, "Close Cami chat", "Isara ang chat ni Cami", "Isira ang chat ni Cami")
            : pickLang(language, "Open Cami chat", "Buksan ang chat ni Cami", "Ablihi ang chat ni Cami")
        }
      >
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center">
          {open ? (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-kiosk-navy">
              <X className="h-5 w-5" />
            </span>
          ) : (
            <Image
              src={CAMI_ICON}
              alt="Cami"
              width={56}
              height={56}
              className="h-14 w-14 object-contain object-center drop-shadow-sm"
              priority
              unoptimized
            />
          )}
        </span>
        <span className="pr-1 text-left leading-tight">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {pickLang(language, "Ask", "Magtanong", "Pangutana")}
          </span>
          <span className="block text-sm font-extrabold text-kiosk-navy">Cami</span>
        </span>
      </button>
    </div>
  );
}
