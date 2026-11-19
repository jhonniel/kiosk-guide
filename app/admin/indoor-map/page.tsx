import { loadIndoorAdminHome } from "@/features/indoor-map/admin-data";
import { IndoorMapAdminHome } from "./indoor-map-home-client";
import { requireAdminPage } from "@/lib/admin-page-auth";
import { AdminNotice, AdminPage, AdminPageHeader } from "@/components/admin/admin-page";

export default async function IndoorMapAdminPage() {
  await requireAdminPage("manage_indoor_map");

  let data: Awaited<ReturnType<typeof loadIndoorAdminHome>>;
  try {
    data = await loadIndoorAdminHome();
  } catch (e) {
    console.error("[admin/indoor-map] Failed to load indoor map admin data:", e);
    return (
      <AdminPage>
        <AdminPageHeader title="Indoor Map" />
        <AdminNotice tone="error" title="The indoor map editor could not be loaded.">
          Refresh the page to try again. If this keeps happening, check that the database is running.
        </AdminNotice>
      </AdminPage>
    );
  }

  return <IndoorMapAdminHome buildings={data.buildings} floors={data.floors} />;
}
