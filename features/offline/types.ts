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
export const KIOSK_OFFLINE_DATA_VERSION = 4;

export interface KioskOfflineData {
  version: number;
  exportedAt: string;
  settings: Record<string, string>;
  quickLinks: QuickLink[];
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

export interface QueuedFeedback {
  id: string;
  createdAt: string;
  name?: string;
  email?: string;
  rating?: number;
  message: string;
  category?: string;
}
