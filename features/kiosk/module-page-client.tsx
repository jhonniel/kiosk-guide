"use client";

import { useKiosk } from "@/hooks/use-kiosk";
import { localized } from "@/lib/i18n/translations";
import { PageHeader } from "@/components/kiosk/page-header";

interface ModulePageClientProps {
  titleEn: string;
  titleFil: string;
  titleBis?: string;
  descriptionEn?: string;
  descriptionFil?: string;
  descriptionBis?: string;
  children: React.ReactNode;
}

export function ModulePageClient({
  titleEn,
  titleFil,
  titleBis,
  descriptionEn,
  descriptionFil,
  descriptionBis,
  children,
}: ModulePageClientProps) {
  const { language } = useKiosk();
  const title = localized({ titleEn, titleFil, titleBis }, language, "title");
  const description = localized(
    { descriptionEn, descriptionFil, descriptionBis },
    language,
    "description"
  );

  return (
    <div className="p-8">
      <PageHeader title={title} language={language} description={description} />
      {children}
    </div>
  );
}
