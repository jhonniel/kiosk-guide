"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import type { Language } from "@/lib/i18n/translations";
import { KIOSK_IDLE_ATTRACT_EVENT, type KioskIdleAttractDetail } from "@/lib/kiosk-events";

interface KioskContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  largeText: boolean;
  setLargeText: (value: boolean) => void;
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
  screenReader: boolean;
  setScreenReader: (value: boolean) => void;
}

interface WheelchairContextValue {
  /** Lowers the whole kiosk into reach from a wheelchair. */
  wheelchairMode: boolean;
  setWheelchairMode: (value: boolean) => void;
}

const KioskContext = createContext<KioskContextValue | null>(null);
/** Separate so toggling it only re-renders the shell, not every page that reads the language. */
const WheelchairContext = createContext<WheelchairContextValue | null>(null);

export function KioskProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const [wheelchairMode, setWheelchairMode] = useState(false);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("kiosk-language", lang);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("kiosk-language") as Language | null;
    if (saved === "en" || saved === "fil" || saved === "bis") {
      setLanguageState(saved);
    }
    const savedLargeText = localStorage.getItem("kiosk-large-text");
    const savedContrast = localStorage.getItem("kiosk-high-contrast");
    const savedScreenReader = localStorage.getItem("kiosk-screen-reader");
    const savedWheelchair = localStorage.getItem("kiosk-wheelchair-mode");
    if (savedLargeText) setLargeText(savedLargeText === "true");
    if (savedContrast) setHighContrast(savedContrast === "true");
    if (savedScreenReader) setScreenReader(savedScreenReader === "true");
    if (savedWheelchair) setWheelchairMode(savedWheelchair === "true");
  }, []);

  // Each visitor starts without the previous visitor's text size, contrast, or lowered screen.
  useEffect(() => {
    const onIdle = (event: Event) => {
      // Only the full idle screen; the "Are you still there?" prompt keeps the visitor's settings.
      if ((event as CustomEvent<KioskIdleAttractDetail>).detail?.phase !== "video") return;
      setLargeText(false);
      setHighContrast(false);
      setWheelchairMode(false);
    };
    window.addEventListener(KIOSK_IDLE_ATTRACT_EVENT, onIdle);
    return () => window.removeEventListener(KIOSK_IDLE_ATTRACT_EVENT, onIdle);
  }, []);

  useEffect(() => {
    localStorage.setItem("kiosk-large-text", String(largeText));
    document.documentElement.classList.toggle("kiosk-large-text", largeText);
  }, [largeText]);

  useEffect(() => {
    localStorage.setItem("kiosk-high-contrast", String(highContrast));
    document.documentElement.classList.toggle("kiosk-high-contrast", highContrast);
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem("kiosk-screen-reader", String(screenReader));
    document.documentElement.classList.toggle("kiosk-screen-reader", screenReader);
  }, [screenReader]);

  useEffect(() => {
    localStorage.setItem("kiosk-wheelchair-mode", String(wheelchairMode));
    document.documentElement.classList.toggle("kiosk-lowered", wheelchairMode);
  }, [wheelchairMode]);

  const kioskValue = useMemo(
    () => ({
      language,
      setLanguage,
      largeText,
      setLargeText,
      highContrast,
      setHighContrast,
      screenReader,
      setScreenReader,
    }),
    [language, setLanguage, largeText, highContrast, screenReader]
  );
  const wheelchairValue = useMemo(() => ({ wheelchairMode, setWheelchairMode }), [wheelchairMode]);

  return (
    <KioskContext.Provider value={kioskValue}>
      <WheelchairContext.Provider value={wheelchairValue}>{children}</WheelchairContext.Provider>
    </KioskContext.Provider>
  );
}

export function useKiosk() {
  const context = useContext(KioskContext);
  if (!context) {
    throw new Error("useKiosk must be used within KioskProvider");
  }
  return context;
}

export function useWheelchairMode() {
  const context = useContext(WheelchairContext);
  if (!context) {
    throw new Error("useWheelchairMode must be used within KioskProvider");
  }
  return context;
}
