import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { loadIndoorFloorDetail } from "@/features/indoor-map/admin-data";
import { QueryProvider } from "@/components/providers/query-provider";
import { FloorEditorClient } from "../floor-editor-client";

export default async function IndoorFloorEditorPage({
  params,
}: {
  params: Promise<{ floorId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const { floorId } = await params;
  const detail = await loadIndoorFloorDetail(floorId);
  if (!detail) notFound();

  return (
    <QueryProvider>
      <FloorEditorClient initial={detail} />
    </QueryProvider>
  );
}
