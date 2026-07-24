export type SettingFieldType =
  | "text"
  | "textarea"
  | "boolean"
  | "json"
  | "lines"
  | "number"
  | "password"
  | "image"
  | "video";

export interface SettingFieldDef {
  key: string;
  label: string;
  type: SettingFieldType;
  description?: string;
  placeholder?: string;
}

export interface SettingGroupDef {
  id: string;
  label: string;
  description?: string;
  fields: SettingFieldDef[];
}

export const SETTING_GROUPS: SettingGroupDef[] = [
  {
    id: "branding",
    label: "Branding & Sidebar",
    description: "Government name, taglines, welcome text, and kiosk images shown on the sidebar.",
    fields: [
      {
        key: "branding_logo_url",
        label: "System logo",
        type: "image",
        description: "Circular seal/logo at the top of the kiosk sidebar. Stored locally on the server.",
      },
      {
        key: "branding_footer_image_url",
        label: "Sidebar footer image",
        type: "image",
        description: "Landscape or banner image at the bottom of the kiosk sidebar. Stored locally on the server.",
      },
      { key: "gov_prefix_en", label: "Gov prefix (EN)", type: "text" },
      { key: "gov_short_en", label: "Gov short name (EN)", type: "text" },
      { key: "gov_name_en", label: "Full government name (EN)", type: "text" },
      { key: "gov_prefix_fil", label: "Gov prefix (FIL)", type: "text" },
      { key: "gov_short_fil", label: "Gov short name (FIL)", type: "text" },
      { key: "gov_name_fil", label: "Full government name (FIL)", type: "text" },
      { key: "gov_prefix_bis", label: "Gov prefix (BIS)", type: "text" },
      { key: "gov_short_bis", label: "Gov short name (BIS)", type: "text" },
      { key: "gov_name_bis", label: "Full government name (BIS)", type: "text" },
      { key: "tagline_en", label: "Tagline (EN)", type: "text" },
      { key: "tagline_fil", label: "Tagline (FIL)", type: "text" },
      { key: "tagline_bis", label: "Tagline (BIS)", type: "text" },
      { key: "welcome_en", label: "Welcome message (EN)", type: "textarea" },
      { key: "welcome_fil", label: "Welcome message (FIL)", type: "textarea" },
      { key: "welcome_bis", label: "Welcome message (BIS)", type: "textarea" },
      { key: "footer_tagline_en", label: "Footer tagline (EN)", type: "textarea" },
      { key: "footer_tagline_fil", label: "Footer tagline (FIL)", type: "textarea" },
      { key: "footer_tagline_bis", label: "Footer tagline (BIS)", type: "textarea" },
    ],
  },
  {
    id: "contact",
    label: "Contact & Office Hours",
    fields: [
      { key: "office_hours_en", label: "Office hours (EN)", type: "text" },
      { key: "office_hours_fil", label: "Office hours (FIL)", type: "text" },
      { key: "office_hours_bis", label: "Office hours (BIS)", type: "text" },
      { key: "contact_phone", label: "Phone", type: "text" },
      { key: "contact_email", label: "Email", type: "text" },
      { key: "contact_address", label: "Address", type: "text" },
    ],
  },
  {
    id: "building",
    label: "Building Directory",
    description: "Indoor navigation, demo mode, and AI guide configuration.",
    fields: [
      {
        key: "building_floor_plan_uploaded",
        label: "Official floor plan uploaded",
        type: "boolean",
        description: "When enabled, uses Building Locations from admin instead of demo data.",
      },
      { key: "building_name_en", label: "Building name (EN)", type: "text" },
      { key: "building_name_fil", label: "Building name (FIL)", type: "text" },
      { key: "building_name_bis", label: "Building name (BIS)", type: "text" },
      { key: "building_page_title_en", label: "Page title (EN)", type: "text" },
      { key: "building_page_title_fil", label: "Page title (FIL)", type: "text" },
      { key: "building_page_title_bis", label: "Page title (BIS)", type: "text" },
      { key: "building_page_description_en", label: "Page description (EN)", type: "textarea" },
      { key: "building_page_description_fil", label: "Page description (FIL)", type: "textarea" },
      { key: "building_page_description_bis", label: "Page description (BIS)", type: "textarea" },
      { key: "building_demo_banner_en", label: "Demo mode banner (EN)", type: "textarea" },
      { key: "building_demo_banner_fil", label: "Demo mode banner (FIL)", type: "textarea" },
      { key: "building_demo_banner_bis", label: "Demo mode banner (BIS)", type: "textarea" },
      { key: "building_demo_notice_en", label: "Demo notice in AI responses (EN)", type: "textarea" },
      { key: "building_demo_notice_fil", label: "Demo notice in AI responses (FIL)", type: "textarea" },
      { key: "building_demo_notice_bis", label: "Demo notice in AI responses (BIS)", type: "textarea" },
      { key: "building_missing_location_en", label: "Location not found message (EN)", type: "textarea" },
      { key: "building_missing_location_fil", label: "Location not found message (FIL)", type: "textarea" },
      { key: "building_missing_location_bis", label: "Location not found message (BIS)", type: "textarea" },
      { key: "building_guide_title_en", label: "AI guide title (EN)", type: "text" },
      { key: "building_guide_title_fil", label: "AI guide title (FIL)", type: "text" },
      { key: "building_guide_title_bis", label: "AI guide title (BIS)", type: "text" },
      { key: "building_guide_subtitle_en", label: "AI guide subtitle (EN)", type: "text" },
      { key: "building_guide_subtitle_fil", label: "AI guide subtitle (FIL)", type: "text" },
      { key: "building_guide_subtitle_bis", label: "AI guide subtitle (BIS)", type: "text" },
      { key: "building_guide_placeholder_en", label: "Search placeholder (EN)", type: "text" },
      { key: "building_guide_placeholder_fil", label: "Search placeholder (FIL)", type: "text" },
      { key: "building_guide_placeholder_bis", label: "Search placeholder (BIS)", type: "text" },
      {
        key: "building_quick_questions_en",
        label: "Quick questions (EN)",
        type: "lines",
        description: "One question per line, or JSON array.",
      },
      {
        key: "building_quick_questions_fil",
        label: "Quick questions (FIL)",
        type: "lines",
        description: "One question per line, or JSON array.",
      },
      {
        key: "building_quick_questions_bis",
        label: "Quick questions (BIS)",
        type: "lines",
        description: "One question per line, or JSON array.",
      },
      { key: "building_kiosk_location_id", label: "Kiosk location ID", type: "text" },
      { key: "building_kiosk_node_id", label: "Kiosk navigation node ID", type: "text" },
      { key: "building_kiosk_floor", label: "Kiosk floor number", type: "text" },
      { key: "building_kiosk_x", label: "Kiosk X coordinate", type: "text" },
      { key: "building_kiosk_y", label: "Kiosk Y coordinate", type: "text" },
      {
        key: "building_navigation_graph",
        label: "Navigation graph (JSON)",
        type: "json",
        description: "Optional. Full navigation graph JSON. Leave empty to use demo graph.",
        placeholder: '{"nodes":[],"edges":[],"floorPlans":[],"defaultStartLocationId":"f1-kiosk"}',
      },
    ],
  },
  {
    id: "downloads",
    label: "Download Center",
    description: "QR code delivery, email sharing, and SMTP configuration for kiosk downloads.",
    fields: [
      {
        key: "download_qr_enabled",
        label: "Enable QR download",
        type: "boolean",
        description: "Allow visitors to scan a unique QR code to download files on their phone.",
      },
      {
        key: "download_email_enabled",
        label: "Enable email delivery",
        type: "boolean",
        description: "Allow visitors to receive files by email from the kiosk.",
      },
      {
        key: "download_qr_expiry_minutes",
        label: "QR link expiry (minutes)",
        type: "number",
        description: "How long each QR download link stays valid. Default is 60 minutes.",
        placeholder: "60",
      },
      {
        key: "download_public_base_url",
        label: "Public kiosk base URL",
        type: "text",
        description: "Base URL embedded in QR codes (e.g. https://kiosk.camiguin.gov.ph). Leave empty to auto-detect.",
        placeholder: "https://kiosk.example.gov.ph",
      },
      { key: "download_modal_title_en", label: "Download prompt title (EN)", type: "text" },
      { key: "download_modal_title_fil", label: "Download prompt title (FIL)", type: "text" },
      { key: "download_modal_title_bis", label: "Download prompt title (BIS)", type: "text" },
      {
        key: "download_modal_hint_en",
        label: "Download prompt hint (EN)",
        type: "textarea",
      },
      {
        key: "download_modal_hint_fil",
        label: "Download prompt hint (FIL)",
        type: "textarea",
      },
      {
        key: "download_modal_hint_bis",
        label: "Download prompt hint (BIS)",
        type: "textarea",
      },
      { key: "smtp_host", label: "SMTP host", type: "text", placeholder: "smtp.gmail.com" },
      { key: "smtp_port", label: "SMTP port", type: "number", placeholder: "587" },
      {
        key: "smtp_secure",
        label: "SMTP use TLS/SSL",
        type: "boolean",
        description: "Enable for port 465 (SSL). For port 587 leave off (STARTTLS).",
      },
      { key: "smtp_user", label: "SMTP username", type: "text" },
      { key: "smtp_password", label: "SMTP password", type: "password" },
      { key: "smtp_from_email", label: "From email address", type: "text" },
      { key: "smtp_from_name", label: "From display name", type: "text", placeholder: "LGU Camiguin Kiosk" },
      {
        key: "download_email_subject_en",
        label: "Email subject (EN)",
        type: "text",
      },
      {
        key: "download_email_subject_fil",
        label: "Email subject (FIL)",
        type: "text",
      },
      {
        key: "download_email_subject_bis",
        label: "Email subject (BIS)",
        type: "text",
      },
      {
        key: "download_email_body_en",
        label: "Email body (EN)",
        type: "textarea",
        description: "Use {{fileName}} and {{title}} as placeholders.",
      },
      {
        key: "download_email_body_fil",
        label: "Email body (FIL)",
        type: "textarea",
        description: "Use {{fileName}} and {{title}} as placeholders.",
      },
      {
        key: "download_email_body_bis",
        label: "Email body (BIS)",
        type: "textarea",
        description: "Use {{fileName}} and {{title}} as placeholders.",
      },
    ],
  },
  {
    id: "storage",
    label: "File Storage (Spaces)",
    description:
      "Upload kiosk download files (PDF, forms) to DigitalOcean Spaces. Credentials can be set in Admin or via DIGITALOCEAN_SPACES_* environment variables.",
    fields: [
      {
        key: "spaces_enabled",
        label: "Enable DigitalOcean Spaces",
        type: "boolean",
        description: "Store uploaded download files in your Spaces bucket. Auto-enabled when DIGITALOCEAN_SPACES_* env vars are set.",
      },
      {
        key: "spaces_endpoint",
        label: "Spaces endpoint",
        type: "text",
        placeholder: "https://sgp1.digitaloceanspaces.com",
      },
      { key: "spaces_region", label: "Spaces region", type: "text", placeholder: "sgp1" },
      { key: "spaces_bucket", label: "Bucket name", type: "text" },
      { key: "spaces_access_key_id", label: "Access key", type: "text" },
      { key: "spaces_secret_key", label: "Secret key", type: "password" },
      {
        key: "spaces_folder",
        label: "Folder prefix",
        type: "text",
        placeholder: "kiosk-downloads",
        description: "Files are stored under this folder inside the bucket.",
      },
      {
        key: "spaces_public_cdn_url",
        label: "Public CDN URL (optional)",
        type: "text",
        placeholder: "https://mybucket.sgp1.cdn.digitaloceanspaces.com",
        description: "Leave empty to use the default Spaces URL.",
      },
      {
        key: "spaces_public_acl",
        label: "Public read access",
        type: "boolean",
        description: "Recommended for kiosk downloads. Disable only if files must stay private.",
      },
    ],
  },
  {
    id: "attract",
    label: "Idle Promo Video",
    description:
      "When the kiosk is unused, ask “Are you still there?” then play an admin-uploaded promotional video with Tap to Start.",
    fields: [
      {
        key: "promo_video_enabled",
        label: "Enable idle promotional video",
        type: "boolean",
        description: "Turn on attract-mode idle detection on the public kiosk.",
      },
      {
        key: "promo_video_url",
        label: "Promotional video",
        type: "video",
        description: "Upload an MP4/WebM video shown after idle confirmation. Max 80 MB.",
      },
      {
        key: "promo_idle_seconds",
        label: "Idle timeout (seconds)",
        type: "number",
        description: "How long without interaction before asking “Are you still there?” Default 20.",
        placeholder: "20",
      },
      {
        key: "promo_countdown_seconds",
        label: "Countdown before video (seconds)",
        type: "number",
        description: "Seconds shown on the idle prompt before the promotional video starts. Default 10.",
        placeholder: "10",
      },
    ],
  },
];

export const ALL_SETTING_KEYS = SETTING_GROUPS.flatMap((g) => g.fields.map((f) => f.key));
