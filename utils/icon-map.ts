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

export function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? HelpCircle;
}
