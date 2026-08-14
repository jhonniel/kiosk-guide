import {
  DEMO_BUILDING_NAME_EN,
  DEMO_BUILDING_NAME_FIL,
} from "@/features/building-directory/demo-building";
import {
  DEMO_MODE_NOTICE,
  MISSING_LOCATION_MESSAGE,
} from "@/features/building-directory/guide-prompt";

export const DEFAULT_QUICK_QUESTIONS_EN = [
  "Where is the Registrar's Office?",
  "How do I get to the Library?",
  "Where is the nearest restroom?",
  "Where is the Dean's Office?",
  "Emergency exit",
];

export const DEFAULT_QUICK_QUESTIONS_FIL = [
  "Nasaan ang Registrar's Office?",
  "Paano pumunta sa Library?",
  "Nasaan ang pinakamalapit na restroom?",
  "Nasaan ang Dean's Office?",
  "Emergency exit",
];

export const DEFAULT_QUICK_QUESTIONS_BIS = [
  "Asa ang Registrar's Office?",
  "Unsaon pag-adto sa Library?",
  "Asa ang labing duol nga restroom?",
  "Asa ang Dean's Office?",
  "Emergency exit",
];

export const SETTING_DEFAULTS: Record<string, string> = {
  branding_logo_url: "/images/branding/logo.png",
  branding_caring_logo_url: "/images/branding/caring-camiguin.png?v=2",
  branding_footer_image_url: "/images/branding/camiguin-sidebar-landscape.png",
  gov_name_en: "Provincial Government of Camiguin",
  gov_name_fil: "Pamahalaang Panlalawigan ng Camiguin",
  gov_name_bis: "Provincial Government sa Camiguin",
  gov_short_en: "CAMIGUIN",
  gov_short_fil: "CAMIGUIN",
  gov_short_bis: "CAMIGUIN",
  gov_prefix_en: "Provincial Government of",
  gov_prefix_fil: "Pamahalaang Panlalawigan ng",
  gov_prefix_bis: "Provincial Government sa",
  tagline_en: "The Island Born of Fire",
  tagline_fil: "Ang Pulo na Pinanganakan ng Apoy",
  tagline_bis: "Ang Pulo nga Gipanganak sa Kalayo",
  welcome_en:
    "This kiosk provides information to help you easily access government services and explore the Province of Camiguin.",
  welcome_fil:
    "Ang kiosk na ito ay nagbibigay ng impormasyon upang madali mong ma-access ang mga serbisyo ng gobyerno at makilala ang Lalawigan ng Camiguin.",
  welcome_bis:
    "Kini nga kiosk naghatag og impormasyon aron dali nimo ma-access ang mga serbisyo sa gobyerno ug makaila sa Probinsya sa Camiguin.",
  footer_tagline_en: "Connecting People. Building Communities. Developing Camiguin.",
  footer_tagline_fil:
    "Pag-uugnay ng mga Tao. Pagbuo ng mga Komunidad. Pag-unlad ng Camiguin.",
  footer_tagline_bis:
    "Pagdugtong sa mga Tawo. Pagtukod sa mga Komunidad. Pag-uswag sa Camiguin.",
  office_hours_en: "Monday to Friday, 8:00 AM – 5:00 PM",
  office_hours_fil: "Lunes hanggang Biyernes, 8:00 AM – 5:00 PM",
  office_hours_bis: "Lunes hangtod Biyernes, 8:00 AM – 5:00 PM",
  contact_phone: "(088) 387-1001",
  contact_email: "info@camiguin.gov.ph",
  contact_address: "Mambajao, Camiguin",
  building_floor_plan_uploaded: "false",
  indoor_map_v2: "true",
  building_name_en: DEMO_BUILDING_NAME_EN,
  building_name_fil: DEMO_BUILDING_NAME_FIL,
  building_name_bis: DEMO_BUILDING_NAME_FIL,
  building_demo_notice_en: DEMO_MODE_NOTICE,
  building_demo_notice_fil:
    "Gumagamit ng demonstration data ang gusaling ito. Ang navigation ay batay sa Demo Academic Building para sa testing.",
  building_demo_notice_bis:
    "Kini nga building naggamit ug demonstration data. Ang navigation gibase sa Demo Academic Building para sa testing.",
  building_demo_banner_en:
    "The official building floor plan has not been uploaded yet. Navigation uses the Demo Academic Building for testing.",
  building_demo_banner_fil:
    "Hindi pa na-upload ang opisyal na floor plan. Gumagamit ng Demo Academic Building ang navigation para sa testing.",
  building_demo_banner_bis:
    "Wala pa na-upload ang opisyal nga floor plan. Ang navigation naggamit sa Demo Academic Building para sa testing.",
  building_missing_location_en: MISSING_LOCATION_MESSAGE,
  building_missing_location_fil:
    "Hindi ko mahanap ang lokasyong iyon sa kasalukuyang building directory. Kung hindi pa na-upload ang opisyal na floor plan, gumagamit ang system ng demonstration data para sa testing.",
  building_missing_location_bis:
    "Dili nako makit-an kana nga lokasyon sa kasamtangang building directory. Kung wala pa na-upload ang opisyal nga floor plan, naggamit ang system ug demonstration data para sa testing.",
  building_quick_questions_en: JSON.stringify(DEFAULT_QUICK_QUESTIONS_EN),
  building_quick_questions_fil: JSON.stringify(DEFAULT_QUICK_QUESTIONS_FIL),
  building_quick_questions_bis: JSON.stringify(DEFAULT_QUICK_QUESTIONS_BIS),
  building_kiosk_location_id: "f1-kiosk",
  building_kiosk_node_id: "f1_kiosk",
  building_kiosk_x: "105",
  building_kiosk_y: "200",
  building_kiosk_floor: "1",
  building_page_title_en: "Building Directory",
  building_page_title_fil: "Direktoryo ng Gusali",
  building_page_title_bis: "Direktoryo sa Building",
  building_page_description_en:
    "Find rooms, offices, and facilities with step-by-step indoor navigation.",
  building_page_description_fil:
    "Hanapin ang mga silid, opisina, at pasilidad na may hakbang-hakbang na indoor navigation.",
  building_page_description_bis:
    "Pangitaa ang mga kwarto, opisina, ug pasilidad uban sa step-by-step nga indoor navigation.",
  building_guide_title_en: "AI BUILDING GUIDE",
  building_guide_title_fil: "AI BUILDING GUIDE",
  building_guide_title_bis: "AI BUILDING GUIDE",
  building_guide_subtitle_en:
    "Ask where a room or facility is — I'll guide you step by step.",
  building_guide_subtitle_fil:
    "Tanungin kung nasaan ang silid o pasilidad — gagabayan kita nang hakbang-hakbang.",
  building_guide_subtitle_bis:
    "Pangutana asa ang kwarto o pasilidad — giyahan tika step by step.",
  building_guide_placeholder_en: 'e.g. "Where is the Registrar\'s Office?"',
  building_guide_placeholder_fil: 'hal. "Nasaan ang Registrar\'s Office?"',
  building_guide_placeholder_bis: 'pananglitan, "Asa ang Registrar\'s Office?"',
  building_navigation_graph: "",
  download_qr_enabled: "true",
  download_email_enabled: "true",
  download_qr_expiry_minutes: "60",
  download_public_base_url: "",
  download_modal_title_en: "How would you like to receive this file?",
  download_modal_title_fil: "Paano mo gustong matanggap ang file na ito?",
  download_modal_title_bis: "Unsaon nimo pagdawat niini nga file?",
  download_modal_hint_en: "",
  download_modal_hint_fil: "",
  download_modal_hint_bis: "",
  smtp_host: "",
  smtp_port: "587",
  smtp_secure: "false",
  smtp_user: "",
  smtp_password: "",
  smtp_from_email: "",
  smtp_from_name: "LGU Camiguin Kiosk",
  download_email_subject_en: "Your requested document: {{title}}",
  download_email_subject_fil: "Ang iyong hiniling na dokumento: {{title}}",
  download_email_subject_bis: "Imong gipangayo nga dokumento: {{title}}",
  download_email_body_en:
    "Hello,\n\nPlease find attached the document you requested from the LGU Kiosk: {{title}} ({{fileName}}).\n\nThank you.",
  download_email_body_fil:
    "Kumusta,\n\nNarito ang dokumentong hiniling mo mula sa LGU Kiosk: {{title}} ({{fileName}}).\n\nSalamat.",
  download_email_body_bis:
    "Kumusta,\n\nAnia ang dokumentong imong gipangayo gikan sa LGU Kiosk: {{title}} ({{fileName}}).\n\nSalamat.",
  spaces_enabled: process.env.DIGITALOCEAN_SPACES_KEY ? "true" : "false",
  spaces_endpoint: (process.env.DIGITALOCEAN_SPACES_ENDPOINT ?? "").replace(/\/$/, ""),
  spaces_region: process.env.DIGITALOCEAN_SPACES_REGION ?? "sgp1",
  spaces_bucket: process.env.DIGITALOCEAN_SPACES_BUCKET ?? "",
  spaces_access_key_id: process.env.DIGITALOCEAN_SPACES_KEY ?? "",
  spaces_secret_key: process.env.DIGITALOCEAN_SPACES_SECRET ?? "",
  spaces_folder: process.env.DIGITALOCEAN_SPACES_ROOT_PATH ?? "kiosk-downloads",
  spaces_public_cdn_url: (process.env.DIGITALOCEAN_SPACES_PATH ?? "").replace(/\/$/, ""),
  spaces_public_acl: "true",
  promo_video_enabled: "true",
  promo_video_url: "/videos/promo/islebethere.webm",
  promo_idle_seconds: "60",
  promo_countdown_seconds: "10",
  kiosk_auto_zoom_enabled: "true",
};

export function parseJsonArraySetting(value: string | undefined, fallback: string[]): string[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : fallback;
  } catch {
    return value
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }
}
