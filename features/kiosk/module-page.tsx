import { db } from "@/lib/db";
import { localized, type Language } from "@/lib/i18n/translations";
import { PageHeader } from "@/components/kiosk/page-header";
import { ModulePageClient } from "./module-page-client";

interface ModulePageProps {
  titleEn: string;
  titleFil: string;
  titleBis?: string;
  descriptionEn?: string;
  descriptionFil?: string;
  descriptionBis?: string;
  children: React.ReactNode;
}

export function ModulePageWrapper({
  titleEn,
  titleFil,
  titleBis,
  descriptionEn,
  descriptionFil,
  descriptionBis,
  children,
}: ModulePageProps) {
  return (
    <ModulePageClient
      titleEn={titleEn}
      titleFil={titleFil}
      titleBis={titleBis}
      descriptionEn={descriptionEn}
      descriptionFil={descriptionFil}
      descriptionBis={descriptionBis}
    >
      {children}
    </ModulePageClient>
  );
}

export async function getPageContent(slug: string) {
  return db.page.findUnique({ where: { slug } });
}

export function localizeItem<T extends Record<string, unknown>>(
  item: T,
  lang: Language,
  fields: { title?: string; description?: string; content?: string; name?: string; question?: string; answer?: string }
) {
  const result: Record<string, string> = {};
  if (fields.title) result.title = localized(item, lang, fields.title);
  if (fields.description) result.description = localized(item, lang, fields.description);
  if (fields.content) result.content = localized(item, lang, fields.content);
  if (fields.name) result.name = localized(item, lang, fields.name);
  if (fields.question) result.question = localized(item, lang, fields.question);
  if (fields.answer) result.answer = localized(item, lang, fields.answer);
  return result;
}
