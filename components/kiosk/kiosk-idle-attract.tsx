"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import { pickLang, t, type Language } from "@/lib/i18n/translations";
import { useKiosk } from "@/hooks/use-kiosk";
import { cn } from "@/lib/utils";

type AttractPhase = "watching" | "prompt" | "video";

const VIDEO_EXIT_MS = 600;
const VIDEO_ENTER_MS = 700;
const TAP_HOLD_MS = 10_000;
const TAP_TYPE_MS = 48;
const TAP_ERASE_MS = 28;
const TAP_LANGS: Language[] = ["en", "fil", "bis"];

type TypePhase = "typing" | "holding" | "erasing";

function TapToStartCycle({ active }: { active: boolean }) {
  const [display, setDisplay] = useState(() => t("en", "tapToStart"));
  const langIndexRef = useRef(0);
  const charIndexRef = useRef(t("en", "tapToStart").length);
  const phaseRef = useRef<TypePhase>("holding");

  useEffect(() => {
    if (!active) return;
    // Warm the Kocha face before/while the attract text cycles.
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "font";
    link.type = "font/otf";
    link.href = "/fonts/KochaRough.otf";
    link.crossOrigin = "anonymous";
    if (!document.querySelector(`link[href="${link.href}"]`)) {
      document.head.appendChild(link);
    }
    if ("fonts" in document) {
      void document.fonts.load('400 48px "Kocha"');
    }
  }, [active]);

  useEffect(() => {
    if (!active) {
      langIndexRef.current = 0;
      const full = t(TAP_LANGS[0], "tapToStart");
      charIndexRef.current = full.length;
      phaseRef.current = "holding";
      setDisplay(full);
      return;
    }

    let alive = true;
    let timeoutId = 0;

    const schedule = (fn: () => void, ms: number) => {
      timeoutId = window.setTimeout(() => {
        if (!alive) return;
        fn();
      }, ms);
    };

    const tick = () => {
      if (!alive) return;

      const lang = TAP_LANGS[langIndexRef.current % TAP_LANGS.length];
      const fullText = t(lang, "tapToStart");
      const phase = phaseRef.current;

      if (phase === "holding") {
        phaseRef.current = "erasing";
        schedule(tick, TAP_ERASE_MS);
        return;
      }

      if (phase === "erasing") {
        charIndexRef.current = Math.max(0, charIndexRef.current - 1);
        setDisplay(fullText.slice(0, charIndexRef.current));
        if (charIndexRef.current <= 0) {
          langIndexRef.current = (langIndexRef.current + 1) % TAP_LANGS.length;
          phaseRef.current = "typing";
          schedule(tick, TAP_TYPE_MS);
          return;
        }
        schedule(tick, TAP_ERASE_MS);
        return;
      }

      // typing next language
      const nextLang = TAP_LANGS[langIndexRef.current % TAP_LANGS.length];
      const nextText = t(nextLang, "tapToStart");
      charIndexRef.current = Math.min(nextText.length, charIndexRef.current + 1);
      setDisplay(nextText.slice(0, charIndexRef.current));
      if (charIndexRef.current >= nextText.length) {
        phaseRef.current = "holding";
        schedule(tick, TAP_HOLD_MS);
        return;
      }
      schedule(tick, TAP_TYPE_MS);
    };

    schedule(tick, TAP_HOLD_MS);

    return () => {
      alive = false;
      window.clearTimeout(timeoutId);
    };
  }, [active]);

  return (
    <p
      className="font-kocha min-h-[1.15em] text-5xl text-white sm:text-6xl md:text-7xl lg:text-8xl"
      style={{ fontFamily: '"Kocha", ui-sans-serif, system-ui, sans-serif' }}
      aria-live="polite"
    >
      {display}
      <span className="idle-tap-caret" aria-hidden="true" />
    </p>
  );
}

type Props = {
  language: Language;
  enabled: boolean;
  videoUrl: string;
  idleSeconds: number;
  countdownSeconds: number;
};

export function KioskIdleAttract({
  language: languageProp,
  enabled,
  videoUrl,
  idleSeconds,
  countdownSeconds,
}: Props) {
  const { language: liveLanguage } = useKiosk();
  const language = liveLanguage || languageProp;
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<AttractPhase>("watching");
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [videoShown, setVideoShown] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoEnterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const phaseRef = useRef<AttractPhase>("watching");
  const lastPathRef = useRef<string>("/");
  const pathnameRef = useRef(pathname);
  const enabledRef = useRef(enabled);
  const videoUrlRef = useRef(videoUrl);
  const idleSecondsRef = useRef(idleSeconds);
  const countdownSecondsRef = useRef(countdownSeconds);

  pathnameRef.current = pathname;
  enabledRef.current = enabled;
  videoUrlRef.current = videoUrl;
  idleSecondsRef.current = idleSeconds;
  countdownSecondsRef.current = countdownSeconds;

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const clearCountdownTimer = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const clearVideoEnterTimer = useCallback(() => {
    if (videoEnterTimerRef.current) {
      clearTimeout(videoEnterTimerRef.current);
      videoEnterTimerRef.current = null;
    }
  }, []);

  const setAttractPhase = useCallback((next: AttractPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const resetToWatching = useCallback(() => {
    clearIdleTimer();
    clearCountdownTimer();
    clearExitTimer();
    clearVideoEnterTimer();
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setCountdown(countdownSecondsRef.current);
    setVideoShown(false);
    setIsExiting(false);
    setAttractPhase("watching");
  }, [
    clearCountdownTimer,
    clearExitTimer,
    clearIdleTimer,
    clearVideoEnterTimer,
    setAttractPhase,
  ]);

  const armIdleTimer = useCallback(() => {
    if (!enabledRef.current || !videoUrlRef.current) return;
    if (phaseRef.current !== "watching") return;

    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      if (phaseRef.current !== "watching") return;
      if (!enabledRef.current || !videoUrlRef.current) return;

      clearIdleTimer();
      clearCountdownTimer();
      lastPathRef.current = pathnameRef.current || "/";

      const total = Math.max(1, countdownSecondsRef.current);
      setCountdown(total);
      setAttractPhase("prompt");

      let remaining = total;
      countdownTimerRef.current = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) {
          clearCountdownTimer();
          setAttractPhase("video");
        }
      }, 1000);
    }, Math.max(5, idleSecondsRef.current) * 1000);
  }, [clearCountdownTimer, clearIdleTimer, setAttractPhase]);

  const resumeLastScreen = useCallback(() => {
    const target = lastPathRef.current || "/";
    resetToWatching();
    armIdleTimer();
    if (pathnameRef.current !== target) {
      router.replace(target);
    }
  }, [armIdleTimer, resetToWatching, router]);

  const smoothReturnHome = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setVideoShown(false);

    const video = videoRef.current;
    if (video) {
      try {
        video.pause();
      } catch {
        // ignore
      }
    }

    clearExitTimer();
    exitTimerRef.current = setTimeout(() => {
      resetToWatching();
      armIdleTimer();
      if (pathnameRef.current !== "/") {
        router.replace("/");
      }
    }, VIDEO_EXIT_MS);
  }, [armIdleTimer, clearExitTimer, isExiting, resetToWatching, router]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phaseRef.current === "watching" && pathname) {
      lastPathRef.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    if (!enabled || !videoUrl) {
      resetToWatching();
      return;
    }
    if (phaseRef.current === "watching") {
      armIdleTimer();
    }
  }, [enabled, videoUrl, idleSeconds, countdownSeconds, armIdleTimer, resetToWatching]);

  useEffect(() => {
    return () => {
      clearIdleTimer();
      clearCountdownTimer();
      clearExitTimer();
      clearVideoEnterTimer();
    };
  }, [clearCountdownTimer, clearExitTimer, clearIdleTimer, clearVideoEnterTimer]);

  useEffect(() => {
    if (!enabled || !videoUrl) return;

    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "touchstart",
      "keydown",
      "wheel",
    ];

    const onActivity = () => {
      if (phaseRef.current !== "watching") return;
      armIdleTimer();
    };

    for (const eventName of events) {
      window.addEventListener(eventName, onActivity, { passive: true });
    }
    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, onActivity);
      }
    };
  }, [enabled, videoUrl, armIdleTimer]);

  useEffect(() => {
    if (phase !== "video") {
      setVideoShown(false);
      setIsExiting(false);
      clearVideoEnterTimer();
      return;
    }

    setIsExiting(false);
    setVideoShown(false);

    // Reliable enter: timeout beats rAF races under Fast Refresh / Strict Mode.
    clearVideoEnterTimer();
    videoEnterTimerRef.current = setTimeout(() => {
      setVideoShown(true);
    }, 40);

    const video = videoRef.current;
    if (video) {
      video.loop = true;
      video.muted = true;
      const tryPlay = async () => {
        try {
          await video.play();
        } catch {
          // Autoplay blocked; TAP TO START still works.
        }
      };
      void tryPlay();
    }

    return () => clearVideoEnterTimer();
  }, [phase, clearVideoEnterTimer]);

  useEffect(() => {
    if (phase !== "video") {
      setNow(null);
      return;
    }
    const minute = () => {
      const d = new Date();
      d.setSeconds(0, 0);
      return d;
    };
    setNow(minute());
    const msToNextMinute = 60_000 - (Date.now() % 60_000) + 50;
    let intervalId = 0;
    const timeoutId = window.setTimeout(() => {
      setNow(minute());
      intervalId = window.setInterval(() => setNow(minute()), 60_000);
    }, msToNextMinute);
    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [phase]);

  if (!enabled || !videoUrl) return null;
  if (phase === "watching") return null;

  const total = Math.max(1, countdownSeconds);
  const ringSize = 120;
  const stroke = 2;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, countdown / total));
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="fixed inset-0 z-[100]">
      {phase === "prompt" && (
        <button
          type="button"
          className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-[#07111f]/78 px-8 animate-[idle-prompt-in_0.45s_ease-out]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="idle-prompt-title"
          aria-describedby="idle-prompt-desc"
          onClick={(event) => {
            event.preventDefault();
            resumeLastScreen();
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.07),transparent_58%)]" />

          <div className="relative z-10 flex max-w-md flex-col items-center text-center">
            <h2
              id="idle-prompt-title"
              className="text-[2.35rem] leading-[1.12] font-medium tracking-[-0.03em] text-white sm:text-[2.75rem]"
            >
              {pickLang(language, "Are you still there?", "Nandito ka pa ba?", "Naa pa ba ka?")}
            </h2>

            <p id="idle-prompt-desc" className="mt-4 text-[1rem] font-normal text-white/50">
              {pickLang(
                language,
                "Tap anywhere to continue",
                "Pindutin kahit saan para magpatuloy",
                "Pindota bisan asa aron magpadayon"
              )}
            </p>

            <div
              className="relative mt-12"
              style={{ width: ringSize, height: ringSize }}
              role="status"
              aria-live="polite"
              aria-label={pickLang(
                language,
                `${countdown} seconds remaining`,
                `${countdown} segundo ang natitira`,
                `${countdown} segundo ang nahabilin`
              )}
            >
              <svg width={ringSize} height={ringSize} className="-rotate-90" aria-hidden="true">
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={stroke}
                />
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[2.5rem] font-light tracking-tight text-white tabular-nums">
                  {countdown}
                </span>
              </div>
            </div>

            <span className="mt-12 min-w-[200px] rounded-full bg-white px-9 py-3.5 text-[15px] font-medium tracking-wide text-[#0b1628]">
              {pickLang(language, "Continue", "Magpatuloy", "Padayon")}
            </span>
          </div>
        </button>
      )}

      {phase === "video" && (
        <button
          type="button"
          onClick={smoothReturnHome}
          disabled={isExiting}
          className={cn(
            "absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black",
            "transition-[opacity,transform] ease-[cubic-bezier(0.22,1,0.36,1)]",
            isExiting ? "duration-[600ms]" : `duration-[${VIDEO_ENTER_MS}ms]`,
            videoShown && !isExiting ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]",
            isExiting && "pointer-events-none"
          )}
          style={{
            transitionDuration: isExiting ? `${VIDEO_EXIT_MS}ms` : `${VIDEO_ENTER_MS}ms`,
          }}
          aria-label={t(language, "tapToStart")}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-[opacity,transform] ease-[cubic-bezier(0.22,1,0.36,1)]",
              videoShown && !isExiting ? "scale-100 opacity-100" : "scale-[1.03] opacity-0"
            )}
            style={{
              transitionDuration: isExiting ? `${VIDEO_EXIT_MS}ms` : `${VIDEO_ENTER_MS}ms`,
            }}
            playsInline
            autoPlay
            muted
            loop
            preload="metadata"
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/55",
              "transition-opacity ease-[cubic-bezier(0.22,1,0.36,1)]",
              videoShown && !isExiting ? "opacity-100" : "opacity-0"
            )}
            style={{
              transitionDuration: isExiting ? `${VIDEO_EXIT_MS}ms` : `${VIDEO_ENTER_MS}ms`,
            }}
          />
          {now && (
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 top-[16vh] z-10 flex flex-col items-center px-8 text-center text-white transition-[opacity,transform] ease-[cubic-bezier(0.22,1,0.36,1)]",
                videoShown && !isExiting
                  ? "translate-y-0 opacity-100"
                  : "-translate-y-3 opacity-0"
              )}
              style={{
                transitionDuration: isExiting ? "400ms" : `${VIDEO_ENTER_MS}ms`,
                transitionDelay: videoShown && !isExiting ? "80ms" : "0ms",
              }}
            >
              <p className="text-4xl font-light tracking-tight tabular-nums sm:text-5xl md:text-6xl">
                {format(now, "h:mm a")}
              </p>
              <p className="mt-1 text-sm font-medium uppercase tracking-[0.22em] text-white/75 sm:text-base md:text-lg">
                {format(now, "EEEE, MMMM d, yyyy")}
              </p>
            </div>
          )}
          <div
            className={cn(
              "relative z-10 flex flex-col items-center px-8 text-center transition-[opacity,transform] ease-[cubic-bezier(0.22,1,0.36,1)]",
              videoShown && !isExiting
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            )}
            style={{
              transitionDuration: isExiting ? "400ms" : `${VIDEO_ENTER_MS}ms`,
              transitionDelay: videoShown && !isExiting ? "120ms" : "0ms",
            }}
          >
            <TapToStartCycle active={videoShown && !isExiting} />
          </div>
        </button>
      )}
    </div>
  );
}
