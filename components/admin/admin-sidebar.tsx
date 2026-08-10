"use client";

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
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ADMIN_ROLE_NAME, type AdminPermissionName } from "@/features/admin/permissions";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: AdminPermissionName | null;
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: null },
  { href: "/admin/services", label: "Services", icon: Briefcase, permission: "manage_services" },
  {
    href: "/admin/citizens-charter",
    label: "Citizens' Charter",
    icon: ScrollText,
    permission: "manage_citizens_charter",
  },
  {
    href: "/admin/directories",
    label: "Directories",
    icon: Building,
    permission: "manage_directories",
  },
  {
    href: "/admin/building-locations",
    label: "Building Locations",
    icon: Building2,
    permission: "manage_building",
  },
  {
    href: "/admin/indoor-map",
    label: "Indoor Map",
    icon: MapPinned,
    permission: "manage_indoor_map",
  },
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
  { href: "/admin/map", label: "Camiguin Map", icon: Map, permission: "manage_map" },
  { href: "/admin/quick-links", label: "Quick Start", icon: Zap, permission: "manage_quick_links" },
  {
    href: "/admin/homepage-cards",
    label: "Homepage Cards",
    icon: LayoutGrid,
    permission: "manage_homepage_cards",
  },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare, permission: "manage_feedback" },
  { href: "/admin/settings", label: "Settings", icon: Settings, permission: "manage_settings" },
  { href: "/admin/users", label: "Users", icon: Users, permission: "manage_users" },
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
  const isFullAdmin = user.role === ADMIN_ROLE_NAME;
  const granted = new Set(user.permissions ?? []);

  const visibleItems = navItems.filter((item) => {
    if (!item.permission) return true;
    if (isFullAdmin) return true;
    return granted.has(item.permission);
  });

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-kiosk-navy text-white">
      <div className="border-b border-white/10 p-6">
        <h1 className="text-lg font-bold">Kiosk Admin</h1>
        <p className="text-xs text-white/60">Camiguin LGU</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href + "/"))
                    ? "bg-white/20"
                    : "hover:bg-white/10"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="mb-0.5 truncate text-xs font-medium text-white/90">{user.name}</p>
        <p className="mb-2 truncate text-xs text-white/60">{user.email}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full justify-start text-white hover:bg-white/10 hover:text-white"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
