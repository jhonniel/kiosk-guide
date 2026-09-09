/** Admin feature permissions — names are stored in Permission.name */

export const ADMIN_PERMISSIONS = [
  {
    name: "manage_services",
    module: "services",
    label: "Services",
    description: "Create and edit government services",
    href: "/admin/services",
  },
  {
    name: "manage_citizens_charter",
    module: "citizens-charter",
    label: "Citizens' Charter",
    description: "Manage Citizens' Charter editions and services",
    href: "/admin/citizens-charter",
  },
  {
    name: "manage_directories",
    module: "directories",
    label: "Directories",
    description: "Manage office / department directories",
    href: "/admin/directories",
  },
  {
    name: "manage_building",
    module: "building",
    label: "Building Locations",
    description: "Manage building directory locations",
    href: "/admin/building-locations",
  },
  {
    name: "manage_indoor_map",
    module: "indoor-map",
    label: "Indoor Map",
    description: "Edit indoor floor plans and navigation",
    href: "/admin/indoor-map",
  },
  {
    name: "manage_downloads",
    module: "downloads",
    label: "Downloads",
    description: "Manage downloadable forms and files",
    href: "/admin/downloads",
  },
  {
    name: "manage_announcements",
    module: "announcements",
    label: "Announcements",
    description: "Manage news and announcements",
    href: "/admin/announcements",
  },
  {
    name: "manage_faqs",
    module: "faqs",
    label: "FAQs",
    description: "Manage frequently asked questions",
    href: "/admin/faqs",
  },
  {
    name: "manage_events",
    module: "events",
    label: "Events",
    description: "Manage events calendar",
    href: "/admin/events",
  },
  {
    name: "manage_emergency",
    module: "emergency",
    label: "Emergency",
    description: "Manage emergency contacts",
    href: "/admin/emergency",
  },
  {
    name: "manage_tourism",
    module: "tourism",
    label: "Tourism",
    description: "Manage tourism information",
    href: "/admin/tourism",
  },
  {
    name: "manage_map",
    module: "map",
    label: "Camiguin Map",
    description: "Edit the Camiguin tourism map",
    href: "/admin/map",
  },
  {
    name: "manage_quick_links",
    module: "quick-links",
    label: "Quick Start",
    description: "Manage Quick Start sidebar links",
    href: "/admin/quick-links",
  },
  {
    name: "manage_homepage_cards",
    module: "homepage-cards",
    label: "Homepage Cards",
    description: "Manage home screen service cards",
    href: "/admin/homepage-cards",
  },
  {
    name: "manage_feedback",
    module: "feedback",
    label: "Feedback",
    description: "View visitor feedback",
    href: "/admin/feedback",
  },
  {
    name: "manage_kiosk_tracking",
    module: "kiosk-tracking",
    label: "Kiosk User Tracking",
    description: "View camera captures of recent kiosk visitors",
    href: "/admin/kiosk-tracking",
  },
  {
    name: "manage_settings",
    module: "settings",
    label: "Settings",
    description: "Manage kiosk branding and settings",
    href: "/admin/settings",
  },
  {
    name: "manage_users",
    module: "users",
    label: "Users",
    description: "Create admin users and assign feature access",
    href: "/admin/users",
  },
] as const;

export type AdminPermissionName = (typeof ADMIN_PERMISSIONS)[number]["name"];

export const ADMIN_ROLE_NAME = "admin";

/** Map CRUD resource keys → permission names */
export const RESOURCE_PERMISSION: Record<string, AdminPermissionName> = {
  services: "manage_services",
  directories: "manage_directories",
  downloads: "manage_downloads",
  announcements: "manage_announcements",
  faqs: "manage_faqs",
  events: "manage_events",
  emergency: "manage_emergency",
  tourism: "manage_tourism",
  quickLinks: "manage_quick_links",
  homepageCards: "manage_homepage_cards",
  buildingLocations: "manage_building",
};

export function permissionForPath(pathname: string): AdminPermissionName | null {
  const match = ADMIN_PERMISSIONS.find(
    (p) => pathname === p.href || pathname.startsWith(`${p.href}/`)
  );
  return match?.name ?? null;
}
