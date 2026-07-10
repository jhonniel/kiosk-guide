"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { Language } from "@/lib/i18n/translations";

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

const KioskContext = createContext<KioskContextValue | null>(null);

export function KioskProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [screenReader, setScreenReader] = useState(false);

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
    if (savedLargeText) setLargeText(savedLargeText === "true");
    if (savedContrast) setHighContrast(savedContrast === "true");
    if (savedScreenReader) setScreenReader(savedScreenReader === "true");
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

  return (
    <KioskContext.Provider
      value={{
        language,
        setLanguage,
        largeText,
        setLargeText,
        highContrast,
        setHighContrast,
        screenReader,
        setScreenReader,
      }}
    >
      {children}
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
