import { KIOSK_COLORS } from "@/lib/constants";
import { ICON_NAMES } from "@/utils/icon-map";

/**
 * - `select`: one of a fixed list of values.
 * - `lines`: a list edited one item per line, stored as a JSON array string.
 * - `date`: date and time, entered and shown in Philippine time.
 * - `file`: a document upload (Downloads); `image`: a picture upload stored as a URL.
 */
export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "date"
  | "file"
  | "image"
  | "select"
  | "lines";

/** Where an uploaded picture is stored under `public/images`. */
export type ImageFolder = "homepage-cards" | "news" | "tourism";

export interface ResourceField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  description?: string;
  /** Choices for `select` fields. */
  options?: { value: string; label: string }[];
  /** Offer the values already used by other records as suggestions. */
  suggest?: boolean;
  /** Extra check on the text: page-address slug, kiosk link, or email address. */
  format?: "slug" | "link" | "email";
  /** For `image` fields: the folder the upload goes to. */
  imageFolder?: ImageFolder;
  /** Short fields sit two to a row in the form. */
  half?: boolean;
}

export interface ResourceConfig {
  name: string;
  /** One record, as in "Add service". */
  singular: string;
  description?: string;
  fields: ResourceField[];
  tableColumns: { key: string; label: string }[];
  defaultSort?: { key: string; direction: "asc" | "desc" };
}

export type ResourceKey =
  | "services"
  | "directories"
  | "downloads"
  | "announcements"
  | "faqs"
  | "events"
  | "emergency"
  | "tourism"
  | "quickLinks"
  | "homepageCards"
  | "buildingLocations";

const LANGUAGES = [
  ["En", "English"],
  ["Fil", "Filipino"],
  ["Bis", "Bisaya"],
] as const;

/** One field per kiosk language, e.g. titleEn / titleFil / titleBis. */
function translated(
  base: string,
  label: string,
  type: "text" | "textarea" | "lines",
  required: boolean | "english-only" = false,
  extra: Partial<ResourceField> = {}
): ResourceField[] {
  return LANGUAGES.map(([suffix, language]) => ({
    key: `${base}${suffix}`,
    label: `${label} (${language})`,
    type,
    required: required === "english-only" ? suffix === "En" : required,
    ...extra,
  }));
}

const ICON_OPTIONS = ICON_NAMES.map((name) => ({ value: name, label: name }));
const COLOR_OPTIONS = Object.keys(KIOSK_COLORS.card).map((name) => ({
  value: name,
  label: name.charAt(0).toUpperCase() + name.slice(1).replace("-", " "),
}));

const SLUG_FIELD: ResourceField = {
  key: "slug",
  label: "Page address name",
  type: "text",
  required: true,
  format: "slug",
  placeholder: "business-permit",
  description: "Short name used in the page address. Lowercase letters, numbers and dashes only.",
  half: true,
};
const SORT_FIELD: ResourceField = {
  key: "sortOrder",
  label: "Sort order",
  type: "number",
  description: "Lower numbers are listed first.",
  half: true,
};
const LINK_FIELD: ResourceField = {
  key: "href",
  label: "Opens page",
  type: "text",
  required: true,
  format: "link",
  placeholder: "/services/business-permit",
  description: "The kiosk page this opens, starting with a slash.",
  half: true,
};

export const RESOURCE_CONFIGS: Record<ResourceKey, ResourceConfig> = {
  services: {
    name: "Services",
    singular: "service",
    description: "Government services shown on the kiosk.",
    tableColumns: [
      { key: "titleEn", label: "Title" },
      { key: "slug", label: "Page address name" },
      { key: "category", label: "Category" },
      { key: "isActive", label: "Status" },
    ],
    fields: [
      ...translated("title", "Title", "text", true),
      SLUG_FIELD,
      { key: "category", label: "Category", type: "text", suggest: true, half: true },
      ...translated("description", "Description", "textarea", true),
      ...translated("requirements", "Requirements", "textarea"),
      ...translated("documents", "Documents", "textarea"),
      { key: "officeLocation", label: "Office location", type: "text", half: true },
      { key: "officeHours", label: "Office hours", type: "text", half: true },
      { key: "processingTime", label: "Processing time", type: "text", half: true },
      { key: "fee", label: "Fee", type: "text", half: true },
      { key: "contactInfo", label: "Contact info", type: "text" },
      { key: "icon", label: "Icon", type: "select", options: ICON_OPTIONS, half: true },
      { key: "color", label: "Color", type: "select", options: COLOR_OPTIONS, half: true },
      SORT_FIELD,
      { key: "isActive", label: "Show on the kiosk", type: "boolean" },
    ],
  },
  directories: {
    name: "Directories",
    singular: "office",
    description: "Offices listed in the Government Directory and the Building Directory.",
    tableColumns: [
      { key: "nameEn", label: "Name" },
      { key: "type", label: "Listed in" },
      { key: "floor", label: "Floor" },
      { key: "isActive", label: "Status" },
    ],
    fields: [
      {
        key: "type",
        label: "Listed in",
        type: "select",
        required: true,
        options: [
          { value: "government", label: "Government Directory" },
          { value: "building", label: "Building Directory" },
        ],
        half: true,
      },
      ...translated("name", "Name", "text", true),
      ...translated("description", "Description", "textarea"),
      { key: "building", label: "Building", type: "text", suggest: true, half: true },
      { key: "floor", label: "Floor", type: "text", suggest: true, half: true },
      { key: "room", label: "Room", type: "text", half: true },
      { key: "department", label: "Department", type: "text", half: true },
      { key: "headName", label: "Head of office", type: "text", half: true },
      { key: "contactNumber", label: "Contact number", type: "text", half: true },
      { key: "email", label: "Email", type: "text", format: "email", half: true },
      { key: "officeHours", label: "Office hours", type: "text", half: true },
      SORT_FIELD,
      { key: "isActive", label: "Show on the kiosk", type: "boolean" },
    ],
  },
  downloads: {
    name: "Documents",
    singular: "document",
    description: "Forms and files visitors can send to their phone or email from the Download Center.",
    tableColumns: [
      { key: "titleEn", label: "Title" },
      { key: "category", label: "Category" },
      { key: "downloadCount", label: "Downloads" },
      { key: "isActive", label: "Status" },
    ],
    fields: [
      ...translated("title", "Title", "text", true),
      ...translated("description", "Description", "textarea"),
      {
        key: "fileAsset",
        label: "Document file",
        type: "file",
        required: true,
        description: "PDF, Word, Excel, image or text file.",
      },
      { key: "category", label: "Category", type: "text", suggest: true, half: true },
      SORT_FIELD,
      { key: "isActive", label: "Show on the kiosk", type: "boolean" },
    ],
  },
  announcements: {
    name: "Announcements",
    singular: "announcement",
    description: "News and announcements shown on the kiosk.",
    tableColumns: [
      { key: "titleEn", label: "Title" },
      { key: "publishedAt", label: "Posted" },
      { key: "isPublished", label: "Status" },
    ],
    fields: [
      ...translated("title", "Title", "text", true),
      ...translated("content", "Content", "textarea", true),
      {
        key: "imageUrl",
        label: "Picture",
        type: "image",
        imageFolder: "news",
        description: "Optional. PNG, JPG, SVG or WebP, up to 5 MB.",
      },
      { key: "isPublished", label: "Show on the kiosk", type: "boolean" },
    ],
  },
  faqs: {
    name: "FAQs",
    singular: "question",
    description: "Frequently asked questions shown on the kiosk.",
    tableColumns: [
      { key: "questionEn", label: "Question" },
      { key: "category", label: "Category" },
      { key: "isActive", label: "Status" },
    ],
    fields: [
      ...translated("question", "Question", "text", true),
      ...translated("answer", "Answer", "textarea", true),
      { key: "category", label: "Category", type: "text", suggest: true, half: true },
      SORT_FIELD,
      { key: "isActive", label: "Show on the kiosk", type: "boolean" },
    ],
  },
  events: {
    name: "Events",
    singular: "event",
    description: "Events shown on the kiosk calendar.",
    tableColumns: [
      { key: "titleEn", label: "Title" },
      { key: "startDate", label: "Starts" },
      { key: "endDate", label: "Ends" },
      { key: "isActive", label: "Status" },
    ],
    fields: [
      ...translated("title", "Title", "text", true),
      ...translated("description", "Description", "textarea", true),
      { key: "location", label: "Location", type: "text" },
      {
        key: "startDate",
        label: "Starts",
        type: "date",
        required: true,
        description: "Philippine time.",
        half: true,
      },
      {
        key: "endDate",
        label: "Ends",
        type: "date",
        description: "Optional. Philippine time.",
        half: true,
      },
      { key: "isActive", label: "Show on the kiosk", type: "boolean" },
    ],
  },
  emergency: {
    name: "Emergency Contacts",
    singular: "emergency contact",
    description: "Hotlines shown on the kiosk Emergency page, grouped by area.",
    tableColumns: [
      { key: "nameEn", label: "Name" },
      { key: "phoneNumber", label: "Phone" },
      { key: "category", label: "Area" },
      { key: "isActive", label: "Status" },
    ],
    fields: [
      ...translated("name", "Name", "text", true),
      { key: "phoneNumber", label: "Phone number", type: "text", required: true, half: true },
      {
        key: "category",
        label: "Area",
        type: "text",
        suggest: true,
        placeholder: "Province",
        description: "“Province” for province-wide hotlines, or the municipality name.",
        half: true,
      },
      ...translated("description", "Description", "textarea"),
      SORT_FIELD,
      { key: "isActive", label: "Show on the kiosk", type: "boolean" },
    ],
  },
  tourism: {
    name: "Tourism",
    singular: "tourism spot",
    description: "Places to visit shown on the kiosk Tourism page.",
    tableColumns: [
      { key: "titleEn", label: "Title" },
      { key: "location", label: "Location" },
      { key: "category", label: "Category" },
      { key: "isActive", label: "Status" },
    ],
    fields: [
      ...translated("title", "Title", "text", true),
      ...translated("description", "Description", "textarea", true),
      { key: "location", label: "Location", type: "text", half: true },
      { key: "category", label: "Category", type: "text", suggest: true, half: true },
      {
        key: "imageUrl",
        label: "Picture",
        type: "image",
        imageFolder: "tourism",
        description: "Optional. PNG, JPG, SVG or WebP, up to 5 MB.",
      },
      SORT_FIELD,
      { key: "isActive", label: "Show on the kiosk", type: "boolean" },
    ],
  },
  quickLinks: {
    name: "Search Shortcuts",
    singular: "shortcut",
    description: "Extra shortcuts that appear in the kiosk search results.",
    tableColumns: [
      { key: "titleEn", label: "Title" },
      { key: "href", label: "Opens page" },
      { key: "isActive", label: "Status" },
    ],
    fields: [
      ...translated("title", "Title", "text", true),
      SLUG_FIELD,
      LINK_FIELD,
      { key: "icon", label: "Icon", type: "select", required: true, options: ICON_OPTIONS, half: true },
      SORT_FIELD,
      { key: "isActive", label: "Show in search", type: "boolean" },
    ],
  },
  homepageCards: {
    name: "Homepage Cards",
    singular: "homepage card",
    description: "Main grid cards on the kiosk home screen.",
    tableColumns: [
      { key: "titleEn", label: "Title" },
      { key: "href", label: "Opens page" },
      { key: "sortOrder", label: "Order" },
      { key: "isActive", label: "Status" },
    ],
    fields: [
      ...translated("title", "Title", "text", true),
      SLUG_FIELD,
      LINK_FIELD,
      ...translated("description", "Description", "textarea", true),
      {
        key: "iconUrl",
        label: "Card icon image",
        type: "image",
        imageFolder: "homepage-cards",
        description: "Optional. PNG, JPG, SVG or WebP, up to 2 MB. Shown on the home grid when set.",
      },
      {
        key: "icon",
        label: "Fallback icon",
        type: "select",
        required: true,
        options: ICON_OPTIONS,
        description: "Used when no image is uploaded.",
        half: true,
      },
      { key: "color", label: "Color", type: "select", required: true, options: COLOR_OPTIONS, half: true },
      SORT_FIELD,
      { key: "isActive", label: "Show on the kiosk", type: "boolean" },
    ],
  },
  buildingLocations: {
    name: "Building Locations",
    singular: "location",
    description: "Rooms and facilities visitors can look up in the Building Directory.",
    tableColumns: [
      { key: "nameEn", label: "Name" },
      { key: "floorLabelEn", label: "Floor" },
      { key: "room", label: "Room" },
      { key: "locationType", label: "Type" },
      { key: "isActive", label: "Status" },
    ],
    fields: [
      ...translated("buildingName", "Building name", "text", "english-only"),
      ...translated("name", "Location name", "text", "english-only"),
      {
        key: "floor",
        label: "Floor number",
        type: "number",
        required: true,
        description: "1 for the ground floor, 2 for the next floor up.",
        half: true,
      },
      { key: "room", label: "Room number", type: "text", half: true },
      ...translated("floorLabel", "Floor label", "text", "english-only", { placeholder: "Ground Floor" }),
      {
        key: "locationType",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { value: "room", label: "Room or office" },
          { value: "facility", label: "Facility (restroom, stairs, exit…)" },
        ],
        half: true,
      },
      { key: "category", label: "Category", type: "text", suggest: true, half: true },
      {
        key: "nearbyLandmarks",
        label: "Nearby landmarks",
        type: "lines",
        placeholder: "Main hallway\nElevator",
        description: "One landmark per line.",
      },
      ...translated("directions", "Directions", "lines", "english-only", {
        placeholder: "Turn left at the lobby\nThe room is on the right",
        description: "One step per line.",
      }),
      {
        key: "aliases",
        label: "Other names people search for",
        type: "lines",
        placeholder: "registrar\nrecords",
        description: "One name per line.",
      },
      SORT_FIELD,
      { key: "isActive", label: "Show on the kiosk", type: "boolean" },
    ],
  },
};
