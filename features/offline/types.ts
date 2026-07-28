import type { BuildingUiConfig } from "@/features/settings/building-config";
import type { GuideContext } from "@/features/building-directory/types";
import type { NavigationGraph } from "@/features/building-directory/navigation/types";
import type { CharterEditionView } from "@/features/citizens-charter/types";
import type {
  Announcement,
  Directory,
  Download,
  EmergencyContact,
  Event,
  Faq,
  HomepageCard,
  Page,
  QuickLink,
  Service,
  Tourism,
} from "@prisma/client";

/** Bump when offline payload shape or required client cache invalidation changes. */
export const KIOSK_OFFLINE_DATA_VERSION = 8;

export interface KioskOfflineData {
  version: number;
  exportedAt: string;
  settings: Record<string, string>;
  /** Top 5 Quick Start destinations ranked by system-wide visits. */
  quickLinks: QuickLink[];
  /** Global page visit counts used to rank Quick Start across the whole kiosk. */
  pageVisitCounts: Record<string, number>;
  /** @deprecated Use pageVisitCounts */
  serviceVisitCounts?: Record<string, number>;
  homepageCards: HomepageCard[];
  services: Service[];
  directories: Directory[];
  downloads: Download[];
  faqs: Faq[];
  announcements: Announcement[];
  tourism: Tourism[];
  emergency: EmergencyContact[];
  events: Event[];
  pages: Page[];
  citizensCharter: CharterEditionView | null;
  guideContext: GuideContext;
  navigationGraph: NavigationGraph;
  uiConfigEn: BuildingUiConfig;
  uiConfigFil: BuildingUiConfig;
  uiConfigBis: BuildingUiConfig;
}

export interface CitizensCharterOfflineBundle {
  version: number;
  exportedAt: string;
  citizensCharter: CharterEditionView | null;
}

export interface QueuedFeedback {
  id: string;
  createdAt: string;
  name?: string;
  email?: string;
  rating?: number;
  message: string;
  category?: string;
}
