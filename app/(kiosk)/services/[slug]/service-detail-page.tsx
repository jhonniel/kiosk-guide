"use client";

import { notFound } from "next/navigation";
import { useParams } from "next/navigation";
import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { getServiceBySlug } from "@/features/offline/selectors";
import { ServiceDetailClient } from "./service-detail-client";

export function ServiceDetailPage() {
  const params = useParams<{ slug: string }>();
  const data = useKioskOfflineData();
  const service = getServiceBySlug(data, params.slug);

  if (!service) {
    notFound();
  }

  return (
    <ModulePageClient titleEn={service.titleEn} titleFil={service.titleFil}>
      <ServiceDetailClient service={service} />
    </ModulePageClient>
  );
}
