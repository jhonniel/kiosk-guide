import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { t, type Language } from "@/lib/i18n/translations";

interface PageHeaderProps {
  title: string;
  language: Language;
  description?: string;
}

export function PageHeader({ title, language, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-kiosk-navy/70 transition-colors hover:text-kiosk-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        {t(language, "backToHome")}
      </Link>
      <h1 className="text-2xl font-bold text-kiosk-navy">{title}</h1>
      {description && <p className="mt-1 text-gray-600">{description}</p>}
    </div>
  );
}
