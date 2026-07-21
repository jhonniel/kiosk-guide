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
  Zap,
  LayoutGrid,
  Settings,
  Users,
  MessageSquare,
  LogOut,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/services", label: "Services", icon: Briefcase },
  { href: "/admin/citizens-charter", label: "Citizens' Charter", icon: ScrollText },
  { href: "/admin/directories", label: "Directories", icon: Building },
  { href: "/admin/building-locations", label: "Building Locations", icon: Building2 },
  { href: "/admin/downloads", label: "Downloads", icon: Download },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/admin/events", label: "Events", icon: Calendar },
  { href: "/admin/emergency", label: "Emergency", icon: Phone },
  { href: "/admin/tourism", label: "Tourism", icon: Palmtree },
  { href: "/admin/quick-links", label: "Quick Start", icon: Zap },
  { href: "/admin/homepage-cards", label: "Homepage Cards", icon: LayoutGrid },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/users", label: "Users", icon: Users },
];

interface Props {
  user: { name?: string | null; email?: string | null; role?: string };
}

export function AdminSidebar({ user }: Props) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-kiosk-navy text-white">
      <div className="border-b border-white/10 p-6">
        <h1 className="text-lg font-bold">Kiosk Admin</h1>
        <p className="text-xs text-white/60">Camiguin LGU</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  pathname === item.href ? "bg-white/20" : "hover:bg-white/10"
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
