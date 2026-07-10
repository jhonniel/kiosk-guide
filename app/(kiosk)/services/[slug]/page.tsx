import { exportKioskOfflineData } from "@/features/offline/export-kiosk-data";
import { ServiceDetailPage } from "./service-detail-page";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const data = await exportKioskOfflineData();
  return data.services.filter((s) => s.isActive).map((s) => ({ slug: s.slug }));
}

export default function ServicePage() {
  return <ServiceDetailPage />;
}
