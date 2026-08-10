import { loadMapAdminData } from "@/features/map/admin-data";
import { MapAdminClient } from "./map-admin-client";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminMapPage() {
  await requireAdminPage("manage_map");

  let data: Awaited<ReturnType<typeof loadMapAdminData>>;
  try {
    data = await loadMapAdminData();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[admin/map] Failed to load map admin data:", error);
    return (
      <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-10 text-center text-sm text-amber-950">
        <p className="font-semibold">Could not load Camiguin Map admin.</p>
        <p className="mt-2 text-amber-900/80">{message}</p>
      </div>
    );
  }

  if (!data.categories.length) {
    return (
      <div className="rounded-xl border border-dashed bg-white p-10 text-center text-sm text-gray-600">
        No map categories found. Run the database seed to import Camiguin map data first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-kiosk-navy">Camiguin Map</h1>
        <p className="mt-1 text-sm text-gray-600">
          Pick a layer, select an item, edit details or drag on the map.
        </p>
      </div>
      <MapAdminClient
        initialAttractions={data.attractions}
        categories={data.categories}
        annotations={data.annotations}
        routes={data.routes}
        hotels={data.hotels}
        restaurants={data.restaurants}
        municipalities={data.municipalities}
      />
    </div>
  );
}
