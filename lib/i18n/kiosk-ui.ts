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
    bis: "Lokasyon:",
  },
  nearbyLabel: {
    en: "Nearby:",
    fil: "Malapit:",
    bis: "Duol:",
  },
  directionsLabel: {
    en: "Directions:",
    fil: "Mga Direksyon:",
    bis: "Mga Direksyon:",
  },
  startNavigation: {
    en: "Start Navigation",
    fil: "Simulan ang Paggabay",
    bis: "Sugdi ang Paggiya",
  },
  accessibleRoute: {
    en: "Accessible Route",
    fil: "Rutang Accessible",
    bis: "Ruta nga Accessible",
  },
  selectLocation: {
    en: "Select a location:",
    fil: "Pumili ng lokasyon:",
    bis: "Pili og lokasyon:",
  },
  officesHeading: {
    en: "Offices",
    fil: "Mga Opisina",
    bis: "Mga Opisina",
  },
  officesHint: {
    en: "Tap an office for directions",
    fil: "Pindutin ang opisina para sa direksyon",
    bis: "Pindota ang opisina aron makita ang direksyon",
  },
  closeLabel: {
    en: "Close",
    fil: "Isara",
    bis: "Isira",
  },
  trySearching: {
    en: "Try searching for:",
    fil: "Subukang hanapin:",
    bis: "Sulayi pagpangita:",
  },
  roomLabel: {
    en: "Room",
    fil: "Silid",
    bis: "Kwarto",
  },
  nearLabel: {
    en: "Near",
    fil: "Malapit sa",
    bis: "Duol sa",
  },
  directionsButton: {
    en: "Directions",
    fil: "Direksyon",
    bis: "Direksyon",
  },
  buildingLayoutTitle: {
    en: "3D BUILDING LAYOUT",
    fil: "3D LAYOUT NG GUSALI",
    bis: "3D LAYOUT SA BILDING",
  },
  tapRoomHint: {
    en: "Tap a room · Rotate · Zoom",
    fil: "Pindutin ang silid · I-ikot · I-zoom",
    bis: "Pindota ang kwarto · Ilingi · I-zoom",
  },
  phoneLabel: {
    en: "Phone",
    fil: "Telepono",
    bis: "Telepono",
  },
  emailLabel: {
    en: "Email",
    fil: "Email",
    bis: "Email",
  },
  addressLabel: {
    en: "Address",
    fil: "Address",
    bis: "Address",
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
    fil: "Na-save ang feedback offline. Isi-sync ito kapag bumalik ang koneksyon.",
    bis: "Na-save ang feedback offline. Mo-sync kini inig balik sa koneksyon.",
  },
  offlineReady: {
    en: "Offline mode — using saved kiosk data",
    fil: "Offline mode — gumagamit ng naka-save na impormasyon",
    bis: "Offline mode — naggamit sa na-save nga impormasyon",
  },
  offlineLimited: {
    en: "Offline — limited features available",
    fil: "Offline — limitado ang mga feature",
    bis: "Offline — limitado ang mga feature",
  },
  loadingKioskData: {
    en: "Loading kiosk data…",
    fil: "Inihahanda ang impormasyon ng kiosk…",
    bis: "Giandam ang impormasyon sa kiosk…",
  },
  preparingOffline: {
    en: "Preparing information for offline use.",
    fil: "Inihahanda ang impormasyon para sa offline na paggamit.",
    bis: "Giandam ang impormasyon alang sa offline nga paggamit.",
  },
  downloadAria: {
    en: (title: string) => `Download ${title}`,
    fil: (title: string) => `I-download ang ${title}`,
    bis: (title: string) => `I-download ang ${title}`,
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
    fil: "Sarado tuwing Sabado, Linggo, at pambansang holiday.",
    bis: "Sirado kon Sabado, Domingo, ug mga national holiday.",
  },
  officesLegend: {
    en: "Offices",
    fil: "Mga Opisina",
    bis: "Mga Opisina",
  },
  landmarksLegend: {
    en: "Landmarks",
    fil: "Mga Palatandaan",
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
    fil: "CAPITOL AT MGA OPISINA NG PAMAHALAAN",
    bis: "CAPITOL UG MGA OPISINA SA GOBYERNO",
  },
  visitLocationHint: {
    en: "Visit this location on Camiguin Island. For capitol offices, tap a green marker for indoor directions.",
    fil: "Bisitahin ang lugar na ito sa Isla ng Camiguin. Para sa mga opisina sa Capitol, pindutin ang berdeng marker para sa direksyon sa loob ng gusali.",
    bis: "Bisitaha kini nga lugar sa Isla sa Camiguin. Para sa mga opisina sa Capitol, pindota ang berde nga marker para sa direksyon sulod sa bilding.",
  },
  requirements: {
    en: "Requirements",
    fil: "Mga Kinakailangan",
    bis: "Mga Kinahanglanon",
  },
  documents: {
    en: "Documents",
    fil: "Mga Dokumento",
    bis: "Mga Dokumento",
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
    fil: "Tagal ng Pagproseso",
    bis: "Gidugayon sa Pagproseso",
  },
  fee: {
    en: "Fee",
    fil: "Bayarin",
    bis: "Bayranan",
  },
  contact: {
    en: "Contact",
    fil: "Kontak",
    bis: "Kontak",
  },
  firstFloor: {
    en: "1st Floor",
    fil: "Unang Palapag",
    bis: "Unang Andana",
  },
  secondFloor: {
    en: "2nd Floor",
    fil: "Ikalawang Palapag",
    bis: "Ikaduhang Andana",
  },
  thirdFloor: {
    en: "3rd Floor",
    fil: "Ikatlong Palapag",
    bis: "Ikatulong Andana",
  },
  mapFilterAll: {
    en: "All",
    fil: "Lahat",
    bis: "Tanan",
  },
  mapFilterTourist: {
    en: "Tourist Spots",
    fil: "Mga Pasyalan",
    bis: "Mga Destinasyon sa Turista",
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
    fil: "Palakihin",
    bis: "Padak-a",
  },
  mapZoomOut: {
    en: "Zoom out",
    fil: "Paliitin",
    bis: "Pagamaya",
  },
  mapResetView: {
    en: "Reset view",
    fil: "Ibalik ang view",
    bis: "Ibalik ang view",
  },
  mapExploreHint: {
    en: "Pinch or drag to explore the island. Tap a marker to view details.",
    fil: "I-pinch o i-drag para malibot ang isla. Pindutin ang marker para makita ang detalye.",
    bis: "I-pinch o i-drag aron malibot ang isla. Pindota ang marker aron makita ang detalye.",
  },
  touristSpotsTitle: {
    en: "TOURIST SPOTS",
    fil: "MGA PASYALAN",
    bis: "MGA DESTINASYON SA TURISTA",
  },
  mapTapHint: {
    en: "Tap a spot on the map or choose from the list below.",
    fil: "Pindutin ang lugar sa mapa o pumili mula sa listahan sa ibaba.",
    bis: "Pindota ang lugar sa mapa o pili gikan sa listahan sa ubos.",
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
