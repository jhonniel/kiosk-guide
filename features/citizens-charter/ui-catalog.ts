import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  Eye,
  HandHeart,
  HeartPulse,
  Landmark,
  LayoutGrid,
  Leaf,
  PawPrint,
  Shield,
  Target,
  Trees,
  Wallet,
  Wrench,
} from "lucide-react";
import type { CharterOfficeView, CharterServiceView } from "./types";

export type CharterBrowseCategoryId =
  | "health"
  | "social"
  | "agriculture"
  | "engineering"
  | "business"
  | "tourism"
  | "veterinary"
  | "treasury";

export type CharterBrowseCategory = {
  id: CharterBrowseCategoryId;
  title: string;
  description: string;
  match: RegExp;
  icon: LucideIcon;
  accent: string;
  soft: string;
  titleColor: string;
};

export const CHARTER_BROWSE_CATEGORIES: CharterBrowseCategory[] = [
  {
    id: "health",
    title: "Health Services",
    description: "Hospital services, laboratory, medicine, certificates, and consultation.",
    match: /hospital|health|medical|clinic|pharmacy/i,
    icon: HeartPulse,
    accent: "bg-[#e11d48]",
    soft: "bg-[#ffe4e6]",
    titleColor: "text-[#e11d48]",
  },
  {
    id: "social",
    title: "Social Welfare Services",
    description: "Assistance programs and services for individuals and families in need.",
    match: /social|welfare|youth|women|senior|employment|human|peso/i,
    icon: HandHeart,
    accent: "bg-[#7c3aed]",
    soft: "bg-[#ede9fe]",
    titleColor: "text-[#7c3aed]",
  },
  {
    id: "agriculture",
    title: "Agriculture Services",
    description: "Support services for farmers, nursery, and agriculture facilities.",
    match: /agriculture|fisher|farm|environment|natural resources/i,
    icon: Leaf,
    accent: "bg-[#16a34a]",
    soft: "bg-[#dcfce7]",
    titleColor: "text-[#16a34a]",
  },
  {
    id: "engineering",
    title: "Engineering Services",
    description: "Infrastructure projects, road works, clearances, and structure repair.",
    match: /engineer|works|infrastructure|building|disaster|risk/i,
    icon: Wrench,
    accent: "bg-[#2563eb]",
    soft: "bg-[#dbeafe]",
    titleColor: "text-[#2563eb]",
  },
  {
    id: "business",
    title: "Business & Procurement",
    description: "Procurement, bidding, contracts, and supplier services.",
    match: /bids|awards|bac|general services|procurement|business/i,
    icon: Briefcase,
    accent: "bg-[#ea580c]",
    soft: "bg-[#ffedd5]",
    titleColor: "text-[#ea580c]",
  },
  {
    id: "tourism",
    title: "Tourism Services",
    description: "Tourism accreditation, facilities management, and visitor services.",
    match: /tourism|facilities management/i,
    icon: Trees,
    accent: "bg-[#0d9488]",
    soft: "bg-[#ccfbf1]",
    titleColor: "text-[#0d9488]",
  },
  {
    id: "veterinary",
    title: "Veterinary Services",
    description: "Animal health, vaccination, breeding, surgery, and certificates.",
    match: /veterinary|animal/i,
    icon: PawPrint,
    accent: "bg-[#92400e]",
    soft: "bg-[#fef3c7]",
    titleColor: "text-[#92400e]",
  },
  {
    id: "treasury",
    title: "Treasury / Payments",
    description: "Taxes, permits, fees, and other government payments.",
    match: /treasury|accounting|budget|finance|cashier|revenue|assessment/i,
    icon: Wallet,
    accent: "bg-[#166534]",
    soft: "bg-[#dcfce7]",
    titleColor: "text-[#166534]",
  },
];

export function categoryForOffice(officeName: string): CharterBrowseCategory | null {
  return CHARTER_BROWSE_CATEGORIES.find((category) => category.match.test(officeName)) ?? null;
}

export function officesInCategory(
  offices: CharterOfficeView[],
  categoryId: CharterBrowseCategoryId
): CharterOfficeView[] {
  const category = CHARTER_BROWSE_CATEGORIES.find((item) => item.id === categoryId);
  if (!category) return [];
  return offices.filter((office) => category.match.test(office.name));
}

export function countServices(office: CharterOfficeView) {
  return office.categories.reduce((total, category) => total + category.services.length, 0);
}

export function flattenServices(offices: CharterOfficeView[]): Array<{
  office: CharterOfficeView;
  service: CharterServiceView;
}> {
  const items: Array<{ office: CharterOfficeView; service: CharterServiceView }> = [];
  for (const office of offices) {
    for (const category of office.categories) {
      for (const service of category.services) {
        items.push({ office, service });
      }
    }
  }
  return items;
}

const MOST_REQUESTED_HINTS = [
  /business\s+permit/i,
  /barangay\s+clearance/i,
  /medical\s+assistance/i,
  /right[-\s]?of[-\s]?way/i,
  /cedula|community tax/i,
  /building\s+permit/i,
  /procurement of goods/i,
  /marriage/i,
];

export function mostRequestedServices(
  offices: CharterOfficeView[],
  limit = 4
): Array<{ office: CharterOfficeView; service: CharterServiceView }> {
  const all = flattenServices(offices);
  const picked: Array<{ office: CharterOfficeView; service: CharterServiceView }> = [];
  const seenLabels = new Set<string>();

  const pushUnique = (item: { office: CharterOfficeView; service: CharterServiceView }) => {
    const label = item.service.name.trim().toLowerCase();
    if (seenLabels.has(label)) return false;
    if (picked.some((existing) => existing.service.id === item.service.id)) return false;
    seenLabels.add(label);
    picked.push(item);
    return true;
  };

  for (const hint of MOST_REQUESTED_HINTS) {
    const match = all.find((item) => hint.test(item.service.name));
    if (match) pushUnique(match);
    if (picked.length >= limit) return picked;
  }

  for (const item of all) {
    pushUnique(item);
    if (picked.length >= limit) break;
  }

  return picked;
}

export type CharterCoreTopicId = "mandate" | "vision" | "mission" | "pledge";

export type CharterCoreTopic = {
  id: CharterCoreTopicId;
  title: string;
  icon: LucideIcon;
  accent: string;
  soft: string;
  ring: string;
  body: string;
};

export const CHARTER_CORE_TOPICS: CharterCoreTopic[] = [
  {
    id: "mandate",
    title: "Mandate",
    icon: Shield,
    accent: "text-[#2563eb]",
    soft: "bg-[#dbeafe]",
    ring: "ring-[#fbbf24]",
    body: "The Provincial Government of Camiguin is mandated to deliver responsive local governance, promote public welfare, and provide efficient frontline services to residents, investors, and visitors across the island province.",
  },
  {
    id: "vision",
    title: "Vision",
    icon: Eye,
    accent: "text-[#16a34a]",
    soft: "bg-[#dcfce7]",
    ring: "ring-[#fbbf24]",
    body: "A progressive, resilient, and people-centered Camiguin where transparent public service, sustainable development, and community well-being guide every program and transaction.",
  },
  {
    id: "mission",
    title: "Mission",
    icon: Target,
    accent: "text-[#7c3aed]",
    soft: "bg-[#ede9fe]",
    ring: "ring-[#fbbf24]",
    body: "To provide accessible, accountable, and quality provincial services through clear processes, competent personnel, and citizen-focused systems that uphold integrity and excellence.",
  },
  {
    id: "pledge",
    title: "Service Pledge",
    icon: HandHeart,
    accent: "text-[#ea580c]",
    soft: "bg-[#ffedd5]",
    ring: "ring-[#fbbf24]",
    body: "We pledge to serve with courtesy, fairness, and urgency; to explain requirements clearly; to process transactions within published timelines; and to treat every client with respect and professionalism.",
  },
];

export const CHARTER_SCENIC_IMAGE = "/images/tourism/tourism-mt-hibok-hibok.png";
export const CHARTER_COVER_IMAGE = "/images/citizens-charter/charter-cover-2026.jpg";

export function officeThemeIcon(name: string): LucideIcon {
  const category = categoryForOffice(name);
  if (category) return category.icon;
  if (/governor|administrator|planning|sanggunian|records|legal|attorney/i.test(name)) {
    return Landmark;
  }
  if (/information|communication/i.test(name)) return LayoutGrid;
  return Building2;
}
