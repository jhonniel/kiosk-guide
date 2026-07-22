import type { Language } from "@/lib/i18n/translations";

const UI = {
  demoMode: {
    en: "Demo Mode",
    fil: "Demo Mode",
    bis: "Demo Mode",
  },
  findingWay: {
    en: "Finding your way...",
    fil: "Hinahanap ang daan...",
    bis: "Gipangita ang dalan...",
  },
  locationLabel: {
    en: "Location:",
    fil: "Lokasyon:",
    bis: "Asa:",
  },
  nearbyLabel: {
    en: "Nearby:",
    fil: "Malapit:",
    bis: "Duol:",
  },
  directionsLabel: {
    en: "Directions:",
    fil: "Mga Direksyon:",
    bis: "Mga Lakang:",
  },
  startNavigation: {
    en: "Start Navigation",
    fil: "Simulan ang Navigation",
    bis: "Sugdi ang Navigation",
  },
  accessibleRoute: {
    en: "Accessible Route",
    fil: "Accessible Route",
    bis: "Accessible nga Ruta",
  },
  selectLocation: {
    en: "Select a location:",
    fil: "Pumili ng lokasyon:",
    bis: "Pilia ang lokasyon:",
  },
  trySearching: {
    en: "Try searching for:",
    fil: "Subukang hanapin:",
    bis: "Sulayi pangitaa:",
  },
  roomLabel: {
    en: "Room",
    fil: "Silid",
    bis: "Kwarto",
  },
  nearLabel: {
    en: "Near",
    fil: "Malapit",
    bis: "Duol sa",
  },
  directionsButton: {
    en: "Directions",
    fil: "Direksyon",
    bis: "Lakang",
  },
  buildingLayoutTitle: {
    en: "3D BUILDING LAYOUT",
    fil: "3D LAYOUT NG GUSALI",
    bis: "3D LAYOUT SA BUILDING",
  },
  tapRoomHint: {
    en: "Tap a room · Rotate · Zoom",
    fil: "Pindutin ang silid · I-rotate · Zoom",
    bis: "Pindota ang kwarto · I-rotate · Zoom",
  },
  phoneLabel: {
    en: "Phone",
    fil: "Telepono",
    bis: "Numero sa Telepono",
  },
  emailLabel: {
    en: "Email",
    fil: "Email",
    bis: "Email",
  },
  addressLabel: {
    en: "Address",
    fil: "Address",
    bis: "Direksyon sa Balay",
  },
  ratingLabel: {
    en: "Rating",
    fil: "Rating",
    bis: "Rating",
  },
  nameOptional: {
    en: "Name (optional)",
    fil: "Pangalan (opsyonal)",
    bis: "Ngalan (opsyonal)",
  },
  emailOptional: {
    en: "Email (optional)",
    fil: "Email (opsyonal)",
    bis: "Email (opsyonal)",
  },
  yourFeedback: {
    en: "Your Feedback",
    fil: "Iyong Feedback",
    bis: "Imong Feedback",
  },
  feedbackThanks: {
    en: "Thank you for your feedback!",
    fil: "Salamat sa iyong feedback!",
    bis: "Salamat sa imong feedback!",
  },
  feedbackSavedOffline: {
    en: "Feedback saved offline. It will sync when connection is restored.",
    fil: "Na-save ang feedback offline. Isi-sync kapag may koneksyon na.",
    bis: "Na-save ang feedback offline. Mo-sync kung naay koneksyon na.",
  },
  offlineReady: {
    en: "Offline mode — using saved kiosk data",
    fil: "Offline mode — gumagamit ng naka-save na impormasyon",
    bis: "Offline mode — naggamit sa na-save nga impormasyon",
  },
  offlineLimited: {
    en: "Offline — limited features available",
    fil: "Offline — limitadong tampok",
    bis: "Offline — limitado nga mga feature",
  },
  loadingKioskData: {
    en: "Loading kiosk data…",
    fil: "Nilo-load ang kiosk data…",
    bis: "Nag-load ang kiosk data…",
  },
  preparingOffline: {
    en: "Preparing information for offline use.",
    fil: "Inihahanda ang impormasyon para sa offline na paggamit.",
    bis: "Giandam ang impormasyon para sa offline nga paggamit.",
  },
  downloadAria: {
    en: (title: string) => `Download ${title}`,
    fil: (title: string) => `I-download ang ${title}`,
    bis: (title: string) => `Kuhaa ang ${title}`,
  },
  officialDirectory: {
    en: "OFFICIAL DIRECTORY",
    fil: "OPISYAL NA DIREKTORYO",
    bis: "OPISYAL NGA DIREKTORYO",
  },
  regularOfficeHours: {
    en: "Regular Office Hours",
    fil: "Regular na Oras ng Opisina",
    bis: "Regular nga Oras sa Opisina",
  },
  closedWeekends: {
    en: "Closed on weekends and national holidays.",
    fil: "Sarado tuwing weekend at pambansang holiday.",
    bis: "Sirado sa weekend ug national holidays.",
  },
  officesLegend: {
    en: "Offices",
    fil: "Mga Opisina",
    bis: "Mga Opisinahan",
  },
  landmarksLegend: {
    en: "Landmarks",
    fil: "Mga Landmark",
    bis: "Mga Timailhan",
  },
  municipalitiesLegend: {
    en: "Municipalities",
    fil: "Mga Munisipalidad",
    bis: "Mga Lungsod",
  },
  governmentOffice: {
    en: "Government Office",
    fil: "Opisina ng Pamahalaan",
    bis: "Opisina sa Gobyerno",
  },
  landmarkType: {
    en: "Landmark",
    fil: "Palatandaan",
    bis: "Timailhan",
  },
  municipalityType: {
    en: "Municipality",
    fil: "Munisipalidad",
    bis: "Lungsod",
  },
  howToGetHere: {
    en: "How to get here",
    fil: "Paano pumunta rito",
    bis: "Unsaon pag-adto dinhi",
  },
  capitolOffices: {
    en: "CAPITOL & GOVERNMENT OFFICES",
    fil: "CAPITOL AT MGA OPISINA",
    bis: "CAPITOL UG MGA OPISINA",
  },
  visitLocationHint: {
    en: "Visit this location on Camiguin Island. For capitol offices, tap a green marker for indoor directions.",
    fil: "Bisitahin ang lokasyong ito sa Isla ng Camiguin. Para sa mga opisina sa capitol, pindutin ang berdeng marker para sa indoor directions.",
    bis: "Bisitaha kini nga lokasyon sa Isla sa Camiguin. Para sa mga opisina sa capitol, pindota ang green marker para sa indoor directions.",
  },
  requirements: {
    en: "Requirements",
    fil: "Mga Kinakailangan",
    bis: "Mga Kinahanglanon",
  },
  documents: {
    en: "Documents",
    fil: "Mga Dokumento",
    bis: "Mga Papeles",
  },
  officeLocation: {
    en: "Office Location",
    fil: "Lokasyon ng Opisina",
    bis: "Lokasyon sa Opisina",
  },
  officeHoursLabel: {
    en: "Office Hours",
    fil: "Oras ng Opisina",
    bis: "Oras sa Opisina",
  },
  processingTime: {
    en: "Processing Time",
    fil: "Oras ng Pagproseso",
    bis: "Oras sa Pagproseso",
  },
  fee: {
    en: "Fee",
    fil: "Bayad",
    bis: "Bayad",
  },
  contact: {
    en: "Contact",
    fil: "Contact",
    bis: "Kontak",
  },
  firstFloor: {
    en: "1st Floor",
    fil: "1st Floor",
    bis: "Unang Palapag",
  },
  secondFloor: {
    en: "2nd Floor",
    fil: "2nd Floor",
    bis: "Ikaduha nga Palapag",
  },
  thirdFloor: {
    en: "3rd Floor",
    fil: "3rd Floor",
    bis: "Ikatulo nga Palapag",
  },
  mapFilterAll: {
    en: "All",
    fil: "Lahat",
    bis: "Tanan",
  },
  mapFilterTourist: {
    en: "Tourist Spots",
    fil: "Mga Turista",
    bis: "Mga Turista",
  },
  mapFilterOffices: {
    en: "Offices",
    fil: "Mga Opisina",
    bis: "Mga Opisina",
  },
  mapFilterMunicipalities: {
    en: "Towns",
    fil: "Mga Bayan",
    bis: "Mga Lungsod",
  },
  mapZoomIn: {
    en: "Zoom in",
    fil: "Mag-zoom in",
    bis: "Zoom in",
  },
  mapZoomOut: {
    en: "Zoom out",
    fil: "Mag-zoom out",
    bis: "Zoom out",
  },
  mapResetView: {
    en: "Reset view",
    fil: "I-reset ang view",
    bis: "I-reset ang view",
  },
  mapExploreHint: {
    en: "Pinch or drag to explore the island. Tap a marker to view details.",
    fil: "I-pinch o i-drag upang tuklasin ang isla. Pindutin ang marker para sa detalye.",
    bis: "I-pinch o i-drag aron susihon ang isla. Pindota ang marker para sa detalye.",
  },
  touristSpotsTitle: {
    en: "TOURIST SPOTS",
    fil: "MGA TURISTA",
    bis: "MGA TURISTA",
  },
  mapTapHint: {
    en: "Tap a spot on the map or choose from the list below.",
    fil: "Pindutin ang lugar sa mapa o pumili mula sa listahan sa ibaba.",
    bis: "Pindota ang lugar sa mapa o pilia gikan sa listahan sa ubos.",
  },
} as const;

export type UiStringKey = keyof typeof UI;

export function uiText(lang: Language, key: UiStringKey): string {
  const entry = UI[key];
  const value = entry[lang];
  return typeof value === "string" ? value : value("");
}

export function uiTextFn(
  lang: Language,
  key: Extract<UiStringKey, "downloadAria">,
  arg: string
): string {
  return UI[key][lang](arg);
}
