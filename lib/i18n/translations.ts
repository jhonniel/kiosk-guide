export type Language = "en" | "fil" | "bis";

export const LANGUAGES: Language[] = ["en", "fil", "bis"];

export interface TranslationKeys {
  home: string;
  smartSearch: string;
  smartSearchHint: string;
  smartSearchPlaceholder: string;
  quickStart: string;
  quickAccess: string;
  welcome: string;
  officeHours: string;
  contactUs: string;
  feedback: string;
  tapToExplore: string;
  english: string;
  filipino: string;
  cebuano: string;
  largeText: string;
  accessibility: string;
  highContrast: string;
  screenReader: string;
  backToHome: string;
  search: string;
  noResults: string;
  loading: string;
  submit: string;
  cancel: string;
  kioskTitle: string;
  kioskSubtitle: string;
}

export const translations: Record<Language, TranslationKeys> = {
  en: {
    home: "HOME",
    smartSearch: "SMART SEARCH",
    smartSearchHint: "Ask a question or type what you need.",
    smartSearchPlaceholder: "e.g. I need a business permit",
    quickStart: "QUICK START",
    quickAccess: "QUICK ACCESS",
    welcome: "Welcome!",
    officeHours: "Office Hours",
    contactUs: "Contact Us",
    feedback: "Feedback",
    tapToExplore: "TAP ANYWHERE TO EXPLORE",
    english: "ENGLISH",
    filipino: "FILIPINO",
    cebuano: "CEBUANO",
    largeText: "LARGE TEXT",
    accessibility: "ACCESSIBILITY",
    highContrast: "HIGH CONTRAST",
    screenReader: "SCREEN READER READY",
    backToHome: "Back to Home",
    search: "Search",
    noResults: "No results found",
    loading: "Loading...",
    submit: "Submit",
    cancel: "Cancel",
    kioskTitle: "LGU INFORMATION & VISITOR EXPERIENCE KIOSK",
    kioskSubtitle: "Your guide to government services and everything Camiguin.",
  },
  fil: {
    home: "BAHAY",
    smartSearch: "MATALINONG PAGHAHANAP",
    smartSearchHint: "Magtanong o i-type ang kailangan mo.",
    smartSearchPlaceholder: "hal. Kailangan ko ng business permit",
    quickStart: "MABILIS NA SIMULA",
    quickAccess: "MABILIS NA ACCESS",
    welcome: "Maligayang Pagdating!",
    officeHours: "Oras ng Opisina",
    contactUs: "Makipag-ugnayan",
    feedback: "Feedback",
    tapToExplore: "PINDUTIN KAHIT SAAN PARA MAG-EXPLORE",
    english: "ENGLISH",
    filipino: "FILIPINO",
    cebuano: "CEBUANO",
    largeText: "MALAKING TEKSTO",
    accessibility: "ACCESSIBILITY",
    highContrast: "MATAAS NA CONTRAST",
    screenReader: "HANDA SA SCREEN READER",
    backToHome: "Bumalik sa Home",
    search: "Maghanap",
    noResults: "Walang nahanap na resulta",
    loading: "Naglo-load...",
    submit: "Isumite",
    cancel: "Kanselahin",
    kioskTitle: "LGU INFORMATION & VISITOR EXPERIENCE KIOSK",
    kioskSubtitle: "Ang iyong gabay sa mga serbisyo ng pamahalaan at lahat ng tungkol sa Camiguin.",
  },
  bis: {
    home: "BALAY",
    smartSearch: "SMART PANGITA",
    smartSearchHint: "Pangutana o i-type ang imong gikinahanglan.",
    smartSearchPlaceholder: "pananglitan, kinahanglan ko ug business permit",
    quickStart: "DALI NGA SUGOD",
    quickAccess: "DALI NGA ACCESS",
    welcome: "Maayong Pag-abot!",
    officeHours: "Oras sa Opisina",
    contactUs: "Kontaka Kami",
    feedback: "Feedback",
    tapToExplore: "PINDOTA BISAN ASA ARON MAG-EXPLORAR",
    english: "ENGLISH",
    filipino: "FILIPINO",
    cebuano: "CEBUANO",
    largeText: "DAKONG TEXT",
    accessibility: "ACCESSIBILITY",
    highContrast: "TAAS NGA CONTRAST",
    screenReader: "ANDAM SA SCREEN READER",
    backToHome: "Balik sa Balay",
    search: "Pangita",
    noResults: "Walay resulta nga nakit-an",
    loading: "Nag-load...",
    submit: "Ipadala",
    cancel: "Kanselahon",
    kioskTitle: "LGU INFORMATION & VISITOR EXPERIENCE KIOSK",
    kioskSubtitle:
      "Imong giya sa mga serbisyo sa gobyerno ug tanan bahin sa Camiguin.",
  },
};

export function t(lang: Language, key: keyof TranslationKeys): string {
  return translations[lang][key];
}

function languageFieldSuffix(lang: Language): "En" | "Fil" | "Bis" {
  if (lang === "en") return "En";
  if (lang === "fil") return "Fil";
  return "Bis";
}

export function pickLang<T>(lang: Language, en: T, fil: T, bis?: T): T {
  if (lang === "en") return en;
  if (lang === "bis") return bis ?? en;
  return fil;
}

export function pickLocalizedText(
  lang: Language,
  en?: string | null,
  fil?: string | null,
  bis?: string | null
): string {
  const normalizedEn = en?.trim() ?? "";
  const normalizedFil = fil?.trim() ?? "";
  const normalizedBis = bis?.trim() ?? "";

  if (lang === "en") return normalizedEn || normalizedFil || normalizedBis;
  if (lang === "bis") return normalizedBis || normalizedEn;
  return normalizedFil || normalizedEn || normalizedBis;
}

export function pickLocalizedArray(
  lang: Language,
  en: string[],
  fil?: string[],
  bis?: string[]
): string[] {
  if (lang === "en") return en.length ? en : fil?.length ? fil : bis ?? [];
  if (lang === "bis") return bis?.length ? bis : en;
  return fil?.length ? fil : en;
}

export function localized<T extends Record<string, unknown>>(
  item: T,
  lang: Language,
  field: string
): string {
  const suffix = languageFieldSuffix(lang);
  const primary = item[`${field}${suffix}`];
  if (typeof primary === "string" && primary.trim()) return primary;

  const en = item[`${field}En`];
  if (typeof en === "string" && en.trim()) return en;

  if (lang === "fil") {
    const fil = item[`${field}Fil`];
    if (typeof fil === "string" && fil.trim()) return fil;
  }

  return "";
}
