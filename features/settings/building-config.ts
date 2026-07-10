import type { Language } from "@/lib/i18n/translations";
import { pickLang } from "@/lib/i18n/translations";
import {
  DEFAULT_QUICK_QUESTIONS_BIS,
  DEFAULT_QUICK_QUESTIONS_EN,
  DEFAULT_QUICK_QUESTIONS_FIL,
  parseJsonArraySetting,
} from "@/features/settings/defaults";
import {
  getLocalizedSetting,
  getResolvedSettings,
  getSetting,
} from "@/features/settings/resolve-settings";

export interface BuildingUiConfig {
  buildingName: string;
  pageTitle: string;
  pageDescription: string;
  demoBanner: string;
  guideTitle: string;
  guideSubtitle: string;
  guidePlaceholder: string;
  quickQuestions: string[];
  kioskLocation: {
    floor: number;
    x: number;
    y: number;
    locationId: string;
    nodeId: string;
    labelEn: string;
    labelFil: string;
    labelBis: string;
  };
}

export function buildBuildingUiConfig(
  settings: Record<string, string>,
  lang: Language = "en"
): BuildingUiConfig {
  const quickQuestionDefaults = pickLang(
    lang,
    DEFAULT_QUICK_QUESTIONS_EN,
    DEFAULT_QUICK_QUESTIONS_FIL,
    DEFAULT_QUICK_QUESTIONS_BIS
  );

  return {
    buildingName: getLocalizedSetting(settings, "building_name", lang),
    pageTitle: getLocalizedSetting(settings, "building_page_title", lang),
    pageDescription: getLocalizedSetting(settings, "building_page_description", lang),
    demoBanner: getLocalizedSetting(settings, "building_demo_banner", lang),
    guideTitle: getLocalizedSetting(settings, "building_guide_title", lang),
    guideSubtitle: getLocalizedSetting(settings, "building_guide_subtitle", lang),
    guidePlaceholder: getLocalizedSetting(settings, "building_guide_placeholder", lang),
    quickQuestions: parseJsonArraySetting(
      getLocalizedSetting(settings, "building_quick_questions", lang),
      quickQuestionDefaults
    ),
    kioskLocation: {
      floor: Number(getSetting(settings, "building_kiosk_floor", "1")) || 1,
      x: Number(getSetting(settings, "building_kiosk_x", "105")) || 105,
      y: Number(getSetting(settings, "building_kiosk_y", "200")) || 200,
      locationId: getSetting(settings, "building_kiosk_location_id", "f1-kiosk"),
      nodeId: getSetting(settings, "building_kiosk_node_id", "f1_kiosk"),
      labelEn: "You are here",
      labelFil: "Nandito ka",
      labelBis: "Ania ka",
    },
  };
}

export async function getBuildingUiConfig(lang: Language = "en"): Promise<BuildingUiConfig> {
  const settings = await getResolvedSettings();
  return buildBuildingUiConfig(settings, lang);
}

export async function getBuildingMessages(lang: Language = "en") {
  const settings = await getResolvedSettings();
  return {
    demoNotice: getLocalizedSetting(settings, "building_demo_notice", lang),
    missingLocation: getLocalizedSetting(settings, "building_missing_location", lang),
  };
}
