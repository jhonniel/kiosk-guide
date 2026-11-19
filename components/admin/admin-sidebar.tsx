"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Briefcase,
  Building,
  Building2,
  Download,
  Megaphone,
  HelpCircle,
  Calendar,
  Phone,
  Palmtree,
  Map,
  MapPinned,
  Zap,
  LayoutGrid,
  Settings,
  Users,
  MessageSquare,
  LogOut,
  ScrollText,
  Camera,
  Menu,
  X,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_ROLE_NAME, type AdminPermissionName } from "@/features/admin/permissions";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: AdminPermissionName | null;
};

const navGroups: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: null }],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/services", label: "Services", icon: Briefcase, permission: "manage_services" },
      {
        href: "/admin/citizens-charter",
        label: "Citizens' Charter",
        icon: ScrollText,
        permission: "manage_citizens_charter",
      },
      { href: "/admin/directories", label: "Directories", icon: Building, permission: "manage_directories" },
      { href: "/admin/downloads", label: "Downloads", icon: Download, permission: "manage_downloads" },
      {
        href: "/admin/announcements",
        label: "Announcements",
        icon: Megaphone,
        permission: "manage_announcements",
      },
      { href: "/admin/faqs", label: "FAQs", icon: HelpCircle, permission: "manage_faqs" },
      { href: "/admin/events", label: "Events", icon: Calendar, permission: "manage_events" },
      { href: "/admin/emergency", label: "Emergency", icon: Phone, permission: "manage_emergency" },
      { href: "/admin/tourism", label: "Tourism", icon: Palmtree, permission: "manage_tourism" },
    ],
  },
  {
    label: "Home screen",
    items: [
      {
        href: "/admin/homepage-cards",
        label: "Homepage Cards",
        icon: LayoutGrid,
        permission: "manage_homepage_cards",
      },
      { href: "/admin/quick-links", label: "Quick Start", icon: Zap, permission: "manage_quick_links" },
    ],
  },
  {
    label: "Maps",
    items: [
      {
        href: "/admin/building-locations",
        label: "Building Locations",
        icon: Building2,
        permission: "manage_building",
      },
      { href: "/admin/indoor-map", label: "Indoor Map", icon: MapPinned, permission: "manage_indoor_map" },
      { href: "/admin/map", label: "Camiguin Map", icon: Map, permission: "manage_map" },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/admin/feedback", label: "Feedback", icon: MessageSquare, permission: "manage_feedback" },
      {
        href: "/admin/kiosk-tracking",
        label: "Kiosk Tracking",
        icon: Camera,
        permission: "manage_kiosk_tracking",
      },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings, permission: "manage_settings" },
      { href: "/admin/users", label: "Users", icon: Users, permission: "manage_users" },
    ],
  },
];

interface Props {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
    permissions?: string[];
  };
}

export function AdminSidebar({ user }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isFullAdmin = user.role === ADMIN_ROLE_NAME;
  const granted = new Set(user.permissions ?? []);

  const groups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || isFullAdmin || granted.has(item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  // The drawer is only for small screens; leaving a page or pressing Escape closes it.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));

  const panel = (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-lg leading-tight font-bold">Kiosk Admin</p>
          <p className="text-xs text-white/60">Camiguin LGU</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="rounded-lg p-2 text-white/80 hover:bg-white/10 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav aria-label="Admin sections" className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {groups.map((group, index) => (
          <div key={group.label ?? index} className={index > 0 ? "mt-4" : undefined}>
            {group.label ? (
              <p className="mb-1 px-3 text-[11px] font-semibold tracking-wider text-white/40 uppercase">
                {group.label}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive(item.href)
                        ? "bg-white/15 font-medium text-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          Open kiosk
        </a>
        <div className="px-3">
          <p className="truncate text-xs font-medium text-white/90">{user.name}</p>
          <p className="truncate text-xs text-white/60">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-kiosk-navy px-4 py-3 text-white lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="rounded-lg p-2 hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </button>
        <p className="font-bold">Kiosk Admin</p>
      </header>

      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-kiosk-navy text-white lg:flex">
        {panel}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-dvh w-72 max-w-[85vw] flex-col bg-kiosk-navy text-white shadow-xl">
            {panel}
          </aside>
        </div>
      ) : null}
    </>
  );
}
