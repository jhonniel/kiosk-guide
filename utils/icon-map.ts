import {
  Briefcase,
  FileText,
  Shield,
  Building2,
  Car,
  FileCheck,
  Building,
  Map,
  Users,
  Megaphone,
  Download,
  HelpCircle,
  Palmtree,
  Phone,
  Calendar,
  Sparkles,
  Clock,
  Star,
  Mail,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Briefcase,
  FileText,
  Shield,
  Building2,
  Car,
  FileCheck,
  Building,
  Map,
  Users,
  Megaphone,
  Download,
  HelpCircle,
  Palmtree,
  Phone,
  Calendar,
  Sparkles,
  Clock,
  Star,
  Mail,
};

/** Icon names the kiosk can draw; anything else falls back to the help icon. */
export const ICON_NAMES = Object.keys(iconMap);

export function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? HelpCircle;
}
