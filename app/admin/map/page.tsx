import { loadMapAdminData } from "@/features/map/admin-data";
import { MapAdminClient } from "./map-admin-client";
import { requireAdminPage } from "@/lib/admin-page-auth";
import { AdminNotice, AdminPage, AdminPageHeader } from "@/components/admin/admin-page";

export default async function AdminMapPage() {
  await requireAdminPage("manage_map");

  let data: Awaited<ReturnType<typeof loadMapAdminData>>;
  try {
    data = await loadMapAdminData();
  } catch (error) {
    console.error("[admin/map] Failed to load map admin data:", error);
    return (
      <AdminPage>
        <AdminPageHeader title="Camiguin Map" />
        <AdminNotice tone="warning" title="The map editor could not be loaded.">
          Refresh the page to try again. If this keeps happening, check that the database is running.
        </AdminNotice>
      </AdminPage>
    );
  }

  if (!data.categories.length) {
    return (
      <AdminPage>
        <AdminPageHeader title="Camiguin Map" />
        <AdminNotice title="The map has no data yet.">
          The Camiguin map content has not been loaded into this database. Ask your system administrator to
          run the database seed, then come back to this page.
        </AdminNotice>
      </AdminPage>
    );
  }

  return (
    <AdminPage className="space-y-4">
      <AdminPageHeader
        title="Camiguin Map"
        description="Pick a layer, select an item, then edit its details or drag it on the map."
      />
      <MapAdminClient
        initialAttractions={data.attractions}
        categories={data.categories}
        annotations={data.annotations}
        routes={data.routes}
        hotels={data.hotels}
        restaurants={data.restaurants}
        municipalities={data.municipalities}
      />
    </AdminPage>
  );
}
