import { CAPITOL_BUILDING_NAME_EN, CAPITOL_BUILDING_NAME_FIL } from "@/features/building-directory/capitol-building";

export const DEFAULT_QUICK_QUESTIONS_EN = [
  "Where is the Provincial Treasury Office?",
  "Where is the Provincial Assessor's Office?",
  "Where is the Provincial Tourism Office?",
  "Where is the nearest comfort room?",
  "Where is Elevator 2?",
];

export const DEFAULT_QUICK_QUESTIONS_FIL = [
  "Nasaan ang Provincial Treasury Office?",
  "Nasaan ang Provincial Assessor's Office?",
  "Nasaan ang Provincial Tourism Office?",
  "Nasaan ang pinakamalapit na comfort room?",
  "Nasaan ang Elevator 2?",
];

export const DEFAULT_QUICK_QUESTIONS_BIS = [
  "Asa ang Provincial Treasury Office?",
  "Asa ang Provincial Assessor's Office?",
  "Asa ang Provincial Tourism Office?",
  "Asa ang labing duol nga comfort room?",
  "Asa ang Elevator 2?",
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
  building_floor_plan_uploaded: "true",
  indoor_map_v2: "false",
  building_name_en: CAPITOL_BUILDING_NAME_EN,
  building_name_fil: CAPITOL_BUILDING_NAME_FIL,
  building_name_bis: CAPITOL_BUILDING_NAME_FIL,
  building_demo_notice_en:
    "Ground floor map of the Provincial Capitol Building. Tap an office for step-by-step directions.",
  building_demo_notice_fil:
    "Ground floor map ng Provincial Capitol Building. Pindutin ang opisina para sa hakbang-hakbang na direksyon.",
  building_demo_notice_bis:
    "Ground floor map sa Provincial Capitol Building. Pindota ang opisina para sa step-by-step nga direksyon.",
  building_demo_banner_en:
    "Navigate the Provincial Capitol ground floor. Search for an office or tap a room on the 3D map.",
  building_demo_banner_fil:
    "Mag-navigate sa ground floor ng Provincial Capitol. Maghanap ng opisina o pindutin ang silid sa 3D map.",
  building_demo_banner_bis:
    "Navigate sa ground floor sa Provincial Capitol. Pangitaa ang opisina o pindota ang kwarto sa 3D map.",
  building_missing_location_en:
    "I could not find that location in the building directory. Please visit the Information Desk, or try a room number or office name.",
  building_missing_location_fil:
    "Hindi ko mahanap ang lokasyong iyon sa building directory. Mangyaring bisitahin ang Information Desk, o subukang maghanap ng room number o pangalan ng opisina.",
  building_missing_location_bis:
    "Dili nako makit-an kana nga lokasyon sa building directory. Palihog bisitaha ang Information Desk, o sulayi ang room number o ngalan sa opisina.",
  building_quick_questions_en: JSON.stringify(DEFAULT_QUICK_QUESTIONS_EN),
  building_quick_questions_fil: JSON.stringify(DEFAULT_QUICK_QUESTIONS_FIL),
  building_quick_questions_bis: JSON.stringify(DEFAULT_QUICK_QUESTIONS_BIS),
  building_kiosk_location_id: "gf-kiosk",
  building_kiosk_node_id: "gf_kiosk",
  building_kiosk_x: "468",
  building_kiosk_y: "455",
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
  building_guide_placeholder_en: 'e.g. "Where is the Provincial Treasury Office?"',
  building_guide_placeholder_fil: 'hal. "Nasaan ang Provincial Assessor\'s Office?"',
  building_guide_placeholder_bis: 'pananglitan, "Asa ang Provincial Tourism Office?"',
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
  smtp_host: process.env.SMTP_HOST ?? "",
  smtp_port: process.env.SMTP_PORT ?? "587",
  smtp_secure: process.env.SMTP_SECURE ?? "false",
  smtp_user: process.env.SMTP_USER ?? "",
  smtp_password: process.env.SMTP_PASSWORD ?? "",
  smtp_from_email: process.env.SMTP_FROM_EMAIL ?? "",
  smtp_from_name: process.env.SMTP_FROM_NAME ?? "LGU Camiguin Kiosk",
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
  promo_video_enabled: "false",
  promo_video_url: "/videos/promo/islebethere-lite.webm",
  promo_idle_seconds: "60",
  promo_countdown_seconds: "10",
  kiosk_auto_zoom_enabled: "true",
  kiosk_camera_tracking_enabled: "false",
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
