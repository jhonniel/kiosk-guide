export type FieldType = "text" | "textarea" | "number" | "boolean" | "json" | "date" | "file" | "image";

export interface ResourceField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  description?: string;
}

export interface ResourceConfig {
  name: string;
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

export const RESOURCE_CONFIGS: Record<ResourceKey, ResourceConfig> = {
  services: {
    name: "Services",
    description: "Government services shown on the kiosk.",
    tableColumns: [
      { key: "titleEn", label: "Title" },
      { key: "slug", label: "Slug" },
      { key: "category", label: "Category" },
      { key: "isActive", label: "Active" },
    ],
    fields: [
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "titleEn", label: "Title (EN)", type: "text", required: true },
      { key: "titleFil", label: "Title (FIL)", type: "text", required: true },
      { key: "titleBis", label: "Title (BIS)", type: "text", required: true },
      { key: "descriptionEn", label: "Description (EN)", type: "textarea", required: true },
      { key: "descriptionFil", label: "Description (FIL)", type: "textarea", required: true },
      { key: "descriptionBis", label: "Description (BIS)", type: "textarea", required: true },
      { key: "requirementsEn", label: "Requirements (EN)", type: "textarea" },
      { key: "requirementsFil", label: "Requirements (FIL)", type: "textarea" },
      { key: "requirementsBis", label: "Requirements (BIS)", type: "textarea" },
      { key: "documentsEn", label: "Documents (EN)", type: "textarea" },
      { key: "documentsFil", label: "Documents (FIL)", type: "textarea" },
      { key: "documentsBis", label: "Documents (BIS)", type: "textarea" },
      { key: "officeLocation", label: "Office location", type: "text" },
      { key: "officeHours", label: "Office hours", type: "text" },
      { key: "processingTime", label: "Processing time", type: "text" },
      { key: "fee", label: "Fee", type: "text" },
      { key: "contactInfo", label: "Contact info", type: "text" },
      { key: "category", label: "Category", type: "text" },
      { key: "icon", label: "Icon name", type: "text", placeholder: "Briefcase" },
      { key: "color", label: "Color", type: "text" },
      { key: "sortOrder", label: "Sort order", type: "number" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },
  directories: {
    name: "Directories",
    description: "Government and building office listings.",
    tableColumns: [
      { key: "nameEn", label: "Name" },
      { key: "type", label: "Type" },
      { key: "floor", label: "Floor" },
      { key: "isActive", label: "Active" },
    ],
    fields: [
      { key: "type", label: "Type", type: "text", required: true, placeholder: "government | building" },
      { key: "nameEn", label: "Name (EN)", type: "text", required: true },
      { key: "nameFil", label: "Name (FIL)", type: "text", required: true },
      { key: "nameBis", label: "Name (BIS)", type: "text", required: true },
      { key: "descriptionEn", label: "Description (EN)", type: "textarea" },
      { key: "descriptionFil", label: "Description (FIL)", type: "textarea" },
      { key: "descriptionBis", label: "Description (BIS)", type: "textarea" },
      { key: "floor", label: "Floor", type: "text" },
      { key: "room", label: "Room", type: "text" },
      { key: "building", label: "Building", type: "text" },
      { key: "department", label: "Department", type: "text" },
      { key: "headName", label: "Head name", type: "text" },
      { key: "contactNumber", label: "Contact number", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "officeHours", label: "Office hours", type: "text" },
      { key: "sortOrder", label: "Sort order", type: "number" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },
  downloads: {
    name: "Downloads",
    tableColumns: [
      { key: "titleEn", label: "Title" },
      { key: "category", label: "Category" },
      { key: "downloadCount", label: "Downloads" },
      { key: "isActive", label: "Active" },
    ],
    fields: [
      { key: "titleEn", label: "Title (EN)", type: "text", required: true },
      { key: "titleFil", label: "Title (FIL)", type: "text", required: true },
      { key: "titleBis", label: "Title (BIS)", type: "text", required: true },
      { key: "descriptionEn", label: "Description (EN)", type: "textarea" },
      { key: "descriptionFil", label: "Description (FIL)", type: "textarea" },
      { key: "descriptionBis", label: "Description (BIS)", type: "textarea" },
      { key: "fileAsset", label: "Document file", type: "file", required: true, description: "Uploaded to DigitalOcean Spaces when enabled in Settings → File Storage." },
      { key: "category", label: "Category", type: "text" },
      { key: "sortOrder", label: "Sort order", type: "number" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },
  announcements: {
    name: "Announcements",
    tableColumns: [
      { key: "titleEn", label: "Title" },
      { key: "isPublished", label: "Published" },
    ],
    fields: [
      { key: "titleEn", label: "Title (EN)", type: "text", required: true },
      { key: "titleFil", label: "Title (FIL)", type: "text", required: true },
      { key: "titleBis", label: "Title (BIS)", type: "text", required: true },
      { key: "contentEn", label: "Content (EN)", type: "textarea", required: true },
      { key: "contentFil", label: "Content (FIL)", type: "textarea", required: true },
      { key: "contentBis", label: "Content (BIS)", type: "textarea", required: true },
      { key: "imageUrl", label: "Image URL", type: "text" },
      { key: "isPublished", label: "Published", type: "boolean" },
    ],
  },
  faqs: {
    name: "FAQs",
    tableColumns: [
      { key: "questionEn", label: "Question" },
      { key: "category", label: "Category" },
      { key: "isActive", label: "Active" },
    ],
    fields: [
      { key: "questionEn", label: "Question (EN)", type: "text", required: true },
      { key: "questionFil", label: "Question (FIL)", type: "text", required: true },
      { key: "questionBis", label: "Question (BIS)", type: "text", required: true },
      { key: "answerEn", label: "Answer (EN)", type: "textarea", required: true },
      { key: "answerFil", label: "Answer (FIL)", type: "textarea", required: true },
      { key: "answerBis", label: "Answer (BIS)", type: "textarea", required: true },
      { key: "category", label: "Category", type: "text" },
      { key: "sortOrder", label: "Sort order", type: "number" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },
  events: {
    name: "Events",
    tableColumns: [
      { key: "titleEn", label: "Title" },
      { key: "startDate", label: "Start" },
      { key: "isActive", label: "Active" },
    ],
    fields: [
      { key: "titleEn", label: "Title (EN)", type: "text", required: true },
      { key: "titleFil", label: "Title (FIL)", type: "text", required: true },
      { key: "titleBis", label: "Title (BIS)", type: "text", required: true },
      { key: "descriptionEn", label: "Description (EN)", type: "textarea", required: true },
      { key: "descriptionFil", label: "Description (FIL)", type: "textarea", required: true },
      { key: "descriptionBis", label: "Description (BIS)", type: "textarea", required: true },
      { key: "location", label: "Location", type: "text" },
      { key: "startDate", label: "Start date", type: "date", required: true },
      { key: "endDate", label: "End date", type: "date" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },
  emergency: {
    name: "Emergency Contacts",
    tableColumns: [
      { key: "nameEn", label: "Name" },
      { key: "phoneNumber", label: "Phone" },
      { key: "isActive", label: "Active" },
    ],
    fields: [
      { key: "nameEn", label: "Name (EN)", type: "text", required: true },
      { key: "nameFil", label: "Name (FIL)", type: "text", required: true },
      { key: "nameBis", label: "Name (BIS)", type: "text", required: true },
      { key: "phoneNumber", label: "Phone number", type: "text", required: true },
      { key: "descriptionEn", label: "Description (EN)", type: "textarea" },
      { key: "descriptionFil", label: "Description (FIL)", type: "textarea" },
      { key: "descriptionBis", label: "Description (BIS)", type: "textarea" },
      { key: "category", label: "Category", type: "text" },
      { key: "sortOrder", label: "Sort order", type: "number" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },
  tourism: {
    name: "Tourism",
    tableColumns: [
      { key: "titleEn", label: "Title" },
      { key: "location", label: "Location" },
      { key: "isActive", label: "Active" },
    ],
    fields: [
      { key: "titleEn", label: "Title (EN)", type: "text", required: true },
      { key: "titleFil", label: "Title (FIL)", type: "text", required: true },
      { key: "titleBis", label: "Title (BIS)", type: "text", required: true },
      { key: "descriptionEn", label: "Description (EN)", type: "textarea", required: true },
      { key: "descriptionFil", label: "Description (FIL)", type: "textarea", required: true },
      { key: "descriptionBis", label: "Description (BIS)", type: "textarea", required: true },
      { key: "location", label: "Location", type: "text" },
      { key: "imageUrl", label: "Image URL", type: "text" },
      { key: "category", label: "Category", type: "text" },
      { key: "sortOrder", label: "Sort order", type: "number" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },
  quickLinks: {
    name: "Quick Start Links",
    description:
      "Legacy admin shortcuts (no longer shown on the kiosk). Quick Start is built automatically from real visit history across homepage modules and services.",
    tableColumns: [
      { key: "titleEn", label: "Title" },
      { key: "href", label: "Link" },
      { key: "isActive", label: "Active" },
    ],
    fields: [
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "titleEn", label: "Title (EN)", type: "text", required: true },
      { key: "titleFil", label: "Title (FIL)", type: "text", required: true },
      { key: "titleBis", label: "Title (BIS)", type: "text", required: true },
      { key: "icon", label: "Icon name", type: "text", required: true, placeholder: "Briefcase" },
      { key: "href", label: "URL path", type: "text", required: true },
      { key: "sortOrder", label: "Sort order", type: "number" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },
  homepageCards: {
    name: "Homepage Cards",
    description: "Main grid cards on the kiosk home screen.",
    tableColumns: [
      { key: "titleEn", label: "Title" },
      { key: "href", label: "Link" },
      { key: "isActive", label: "Active" },
    ],
    fields: [
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "titleEn", label: "Title (EN)", type: "text", required: true },
      { key: "titleFil", label: "Title (FIL)", type: "text", required: true },
      { key: "titleBis", label: "Title (BIS)", type: "text", required: true },
      { key: "descriptionEn", label: "Description (EN)", type: "textarea", required: true },
      { key: "descriptionFil", label: "Description (FIL)", type: "textarea", required: true },
      { key: "descriptionBis", label: "Description (BIS)", type: "textarea", required: true },
      {
        key: "iconUrl",
        label: "Card icon image",
        type: "image",
        description: "Upload a PNG, JPG, SVG, or WebP icon. Shown on the kiosk home grid when set.",
      },
      {
        key: "icon",
        label: "Fallback icon name",
        type: "text",
        required: true,
        placeholder: "FileCheck",
        description: "Lucide icon name used when no image is uploaded.",
      },
      { key: "color", label: "Color", type: "text", required: true },
      { key: "href", label: "URL path", type: "text", required: true },
      { key: "sortOrder", label: "Sort order", type: "number" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },
  buildingLocations: {
    name: "Building Locations",
    description: "Rooms and facilities for indoor navigation when official floor plan is enabled.",
    tableColumns: [
      { key: "nameEn", label: "Name" },
      { key: "floor", label: "Floor" },
      { key: "room", label: "Room" },
      { key: "isActive", label: "Active" },
    ],
    fields: [
      { key: "buildingNameEn", label: "Building name (EN)", type: "text", required: true },
      { key: "buildingNameFil", label: "Building name (FIL)", type: "text" },
      { key: "buildingNameBis", label: "Building name (BIS)", type: "text" },
      { key: "nameEn", label: "Location name (EN)", type: "text", required: true },
      { key: "nameFil", label: "Location name (FIL)", type: "text" },
      { key: "nameBis", label: "Location name (BIS)", type: "text" },
      { key: "floor", label: "Floor number", type: "number", required: true },
      { key: "floorLabelEn", label: "Floor label (EN)", type: "text", required: true },
      { key: "floorLabelFil", label: "Floor label (FIL)", type: "text" },
      { key: "floorLabelBis", label: "Floor label (BIS)", type: "text" },
      { key: "room", label: "Room number", type: "text" },
      { key: "locationType", label: "Type", type: "text", required: true, placeholder: "room | facility" },
      { key: "category", label: "Category", type: "text" },
      {
        key: "nearbyLandmarks",
        label: "Nearby landmarks (JSON array)",
        type: "json",
        placeholder: '["Main hallway", "Elevator"]',
      },
      {
        key: "directionsEn",
        label: "Directions (EN, JSON array)",
        type: "json",
        required: true,
        placeholder: '["Turn left", "Room on the right"]',
      },
      {
        key: "directionsFil",
        label: "Directions (FIL, JSON array)",
        type: "json",
        placeholder: '["Kumaliwa", "Silid sa kanan"]',
      },
      {
        key: "directionsBis",
        label: "Directions (BIS, JSON array)",
        type: "json",
        placeholder: '["Kumaliwa", "Kwarto sa tuo"]',
      },
      {
        key: "aliases",
        label: "Search aliases (JSON array)",
        type: "json",
        placeholder: '["registrar", "records"]',
      },
      { key: "sortOrder", label: "Sort order", type: "number" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },
};
