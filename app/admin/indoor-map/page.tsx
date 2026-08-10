import { loadIndoorAdminHome } from "@/features/indoor-map/admin-data";
import { IndoorMapAdminHome } from "./indoor-map-home-client";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function IndoorMapAdminPage() {
  await requireAdminPage("manage_indoor_map");

  let data: Awaited<ReturnType<typeof loadIndoorAdminHome>>;
  try {
    data = await loadIndoorAdminHome();
  } catch (e) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        {e instanceof Error ? e.message : "Failed to load indoor map admin."}
      </div>
    );
  }

  return <IndoorMapAdminHome buildings={data.buildings} floors={data.floors} />;
}
