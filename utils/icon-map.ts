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
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? HelpCircle;
}
