import type { Language } from "@/lib/i18n/translations";
import type { CharterEditionView } from "@/features/citizens-charter/types";
import type { SearchResult } from "@/features/search/search-service";

export function textMatches(text: string, q: string) {
  return text.toLowerCase().includes(q);
}

/** Always-available kiosk destinations (modules + utility pages). */
export function searchKioskModules(query: string, lang: Language): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const modules: Array<{
    id: string;
    title: Record<Language, string>;
    description: Record<Language, string>;
    href: string;
    keywords: string[];
  }> = [
    {
      id: "module-citizens-charter",
      title: {
        en: "Citizens' Charter",
        fil: "Citizens' Charter",
        bis: "Citizens' Charter",
      },
      description: {
        en: "Service standards, processing times, and requirements.",
        fil: "Mga pamantayan ng serbisyo, oras ng proseso, at mga kinakailangan.",
        bis: "Mga sumbanan sa serbisyo, oras sa proseso, ug mga kinahanglanon.",
      },
      href: "/citizens-charter",
      keywords: ["charter", "permit", "requirements", "processing", "frontline", "service"],
    },
    {
      id: "module-building-directory",
      title: {
        en: "Building Directory",
        fil: "Direktoryo ng Gusali",
        bis: "Direktoryo sa Bilding",
      },
      description: {
        en: "Find offices and rooms inside the capitol building.",
        fil: "Hanapin ang mga opisina at silid sa loob ng capitol.",
        bis: "Pangitaa ang mga opisina ug lawak sulod sa capitol.",
      },
      href: "/building-directory",
      keywords: ["building", "room", "office", "floor", "navigate", "capitol"],
    },
    {
      id: "module-map",
      title: {
        en: "Map of Camiguin",
        fil: "Mapa ng Camiguin",
        bis: "Mapa sa Camiguin",
      },
      description: {
        en: "Explore municipalities, landmarks, and key locations.",
        fil: "Tuklasin ang mga munisipalidad, landmark, at mahahalagang lugar.",
        bis: "Susiha ang mga lungsod, landmark, ug importante nga lugar.",
      },
      href: "/map",
      keywords: ["map", "municipality", "island", "landmark", "location", "camiguin"],
    },
    {
      id: "module-government-directory",
      title: {
        en: "Government Directory",
        fil: "Direktoryo ng Pamahalaan",
        bis: "Direktoryo sa Gobyerno",
      },
      description: {
        en: "Departments, officials, and contact information.",
        fil: "Mga departamento, opisyal, at impormasyon sa pakikipag-ugnayan.",
        bis: "Mga departamento, opisyal, ug impormasyon sa kontak.",
      },
      href: "/government-directory",
      keywords: ["government", "department", "official", "contact", "directory"],
    },
    {
      id: "module-news",
      title: {
        en: "News & Announcements",
        fil: "Balita at Anunsyo",
        bis: "Balita ug Anunsyo",
      },
      description: {
        en: "Latest advisories, programs, and public notices.",
        fil: "Pinakabagong advisories, programa, at pampublikong abiso.",
        bis: "Pinakabag-ong advisories, programa, ug pampublikong pahibalo.",
      },
      href: "/news",
      keywords: ["news", "announcement", "advisory", "notice", "program"],
    },
    {
      id: "module-downloads",
      title: {
        en: "Download Center",
        fil: "Download Center",
        bis: "Download Center",
      },
      description: {
        en: "Forms, guidelines, and official documents.",
        fil: "Mga form, gabay, at opisyal na dokumento.",
        bis: "Mga form, giya, ug opisyal nga dokumento.",
      },
      href: "/download-center",
      keywords: ["download", "form", "document", "pdf", "file"],
    },
    {
      id: "module-tourism",
      title: {
        en: "Tourism Information",
        fil: "Impormasyon sa Turismo",
        bis: "Impormasyon sa Turismo",
      },
      description: {
        en: "Attractions, activities, and travel tips.",
        fil: "Mga atraksyon, aktibidad, at tip sa paglalakbay.",
        bis: "Mga atraksyon, aktibidad, ug tip sa biyahe.",
      },
      href: "/tourism",
      keywords: ["tourism", "attraction", "travel", "beach", "falls", "island"],
    },
    {
      id: "module-emergency",
      title: {
        en: "Emergency Contacts",
        fil: "Mga Emergency Contact",
        bis: "Mga Emergency Contact",
      },
      description: {
        en: "Hotlines for police, fire, health, and rescue.",
        fil: "Mga hotline para sa pulis, bumbero, kalusugan, at rescue.",
        bis: "Mga hotline para sa pulis, bumbero, panglawas, ug rescue.",
      },
      href: "/emergency",
      keywords: ["emergency", "hotline", "police", "fire", "rescue", "hospital", "911"],
    },
    {
      id: "module-events",
      title: {
        en: "Events Calendar",
        fil: "Kalendaryo ng Mga Kaganapan",
        bis: "Kalendaryo sa Mga Hitabo",
      },
      description: {
        en: "Upcoming festivals, meetings, and activities.",
        fil: "Papalapit na pista, meeting, at mga aktibidad.",
        bis: "Umaabot nga pista, meeting, ug mga aktibidad.",
      },
      href: "/events",
      keywords: ["event", "festival", "calendar", "meeting", "activity"],
    },
    {
      id: "module-faq",
      title: {
        en: "Frequently Asked Questions",
        fil: "Mga Madalas Itanong",
        bis: "Mga Kanunayng Pangutana",
      },
      description: {
        en: "Camiguin FAQs and chat with Cami.",
        fil: "Mga FAQ ng Camiguin at chat kay Cami.",
        bis: "Mga FAQ sa Camiguin ug chat kang Cami.",
      },
      href: "/faq",
      keywords: ["faq", "question", "help", "cami", "assistant"],
    },
    {
      id: "module-office-hours",
      title: {
        en: "Office Hours",
        fil: "Oras ng Opisina",
        bis: "Oras sa Opisina",
      },
      description: {
        en: "When government offices are open.",
        fil: "Kailan bukas ang mga opisina ng gobyerno.",
        bis: "Kanus-a abli ang mga opisina sa gobyerno.",
      },
      href: "/office-hours",
      keywords: ["hours", "schedule", "open", "closed", "monday", "friday"],
    },
    {
      id: "module-contact",
      title: {
        en: "Contact Us",
        fil: "Makipag-ugnayan",
        bis: "Kontaka Kami",
      },
      description: {
        en: "Phone, email, and capitol address.",
        fil: "Telepono, email, at address ng capitol.",
        bis: "Telepono, email, ug address sa capitol.",
      },
      href: "/contact",
      keywords: ["contact", "phone", "email", "address", "call"],
    },
    {
      id: "module-feedback",
      title: {
        en: "Feedback",
        fil: "Feedback",
        bis: "Feedback",
      },
      description: {
        en: "Share your experience with this kiosk.",
        fil: "Ibahagi ang iyong karanasan sa kiosk na ito.",
        bis: "Ipakigbahin ang imong kasinatian niining kiosk.",
      },
      href: "/feedback",
      keywords: ["feedback", "rating", "comment", "suggestion", "review"],
    },
  ];

  return modules
    .filter((mod) => {
      const title = mod.title[lang] || mod.title.en;
      const description = mod.description[lang] || mod.description.en;
      return (
        textMatches(title, q) ||
        textMatches(description, q) ||
        mod.keywords.some((keyword) => textMatches(keyword, q))
      );
    })
    .map((mod) => ({
      id: mod.id,
      type: "module",
      title: mod.title[lang] || mod.title.en,
      description: mod.description[lang] || mod.description.en,
      href: mod.href,
    }));
}

export function searchCitizensCharterEdition(
  edition: CharterEditionView | null | undefined,
  query: string
): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q || !edition) return [];

  const results: SearchResult[] = [];

  if (
    textMatches(edition.title, q) ||
    textMatches(edition.description, q) ||
    textMatches(edition.editionLabel, q)
  ) {
    results.push({
      id: `charter-edition-${edition.id}`,
      type: "citizens-charter",
      title: edition.title,
      description: edition.description || edition.editionLabel,
      href: "/citizens-charter",
      meta: String(edition.year),
    });
  }

  for (const office of edition.offices) {
    if (!office.isActive) continue;
    if (textMatches(office.name, q)) {
      results.push({
        id: `charter-office-${office.id}`,
        type: "citizens-charter",
        title: office.name,
        description: "Citizens' Charter office",
        href: "/citizens-charter",
      });
    }

    for (const category of office.categories) {
      if (!category.isActive) continue;
      for (const service of category.services) {
        if (!service.isActive) continue;
        const haystack = [
          service.name,
          service.description,
          service.officeOrDivision,
          service.classification,
          service.whoMayAvail,
          ...service.details,
          ...service.requirements.map((r) => `${r.requirement} ${r.whereToSecure}`),
          ...service.steps.map((s) => `${s.step} ${s.action} ${s.person}`),
        ].join(" ");

        if (textMatches(haystack, q)) {
          results.push({
            id: `charter-service-${service.id}`,
            type: "citizens-charter",
            title: service.name,
            description: service.description || `${office.name} · ${category.name}`,
            href: `/citizens-charter?q=${encodeURIComponent(service.name)}`,
            meta: office.name,
          });
        }
      }
    }
  }

  return results;
}

export const SEARCH_RESULT_LIMIT = 30;

export function formatSearchType(type: string, lang: Language = "en"): string {
  const labels: Record<string, Record<Language, string>> = {
    module: { en: "Module", fil: "Module", bis: "Module" },
    service: { en: "Service", fil: "Serbisyo", bis: "Serbisyo" },
    directory: { en: "Directory", fil: "Direktoryo", bis: "Direktoryo" },
    building: { en: "Building", fil: "Gusali", bis: "Bilding" },
    "building-guide": { en: "Building", fil: "Gusali", bis: "Bilding" },
    download: { en: "Download", fil: "Download", bis: "Download" },
    faq: { en: "FAQ", fil: "FAQ", bis: "FAQ" },
    announcement: { en: "News", fil: "Balita", bis: "Balita" },
    tourism: { en: "Tourism", fil: "Turismo", bis: "Turismo" },
    emergency: { en: "Emergency", fil: "Emergency", bis: "Emergency" },
    event: { en: "Event", fil: "Event", bis: "Hitabo" },
    page: { en: "Page", fil: "Pahina", bis: "Panid" },
    "citizens-charter": { en: "Charter", fil: "Charter", bis: "Charter" },
    "quick-link": { en: "Quick Link", fil: "Quick Link", bis: "Quick Link" },
    "home-card": { en: "Home", fil: "Home", bis: "Home" },
  };
  return labels[type]?.[lang] ?? type;
}
