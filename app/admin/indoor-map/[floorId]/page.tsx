import { notFound } from "next/navigation";
import { loadIndoorFloorDetail } from "@/features/indoor-map/admin-data";
import { QueryProvider } from "@/components/providers/query-provider";
import { FloorEditorClient } from "../floor-editor-client";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function IndoorFloorEditorPage({
  params,
}: {
  params: Promise<{ floorId: string }>;
}) {
  await requireAdminPage("manage_indoor_map");

  const { floorId } = await params;
  const detail = await loadIndoorFloorDetail(floorId);
  if (!detail) notFound();

  return (
    <QueryProvider>
      <FloorEditorClient initial={detail} />
    </QueryProvider>
  );
}
