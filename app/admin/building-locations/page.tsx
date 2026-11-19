import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { ImportBuildingLocations } from "@/components/admin/import-building-locations";
import { CAPITOL_BUILDING_LOCATIONS } from "@/features/building-directory/capitol-building";

export default function Page() {
  return (
    <AdminResourcePage
      resource="buildingLocations"
      emptyExtra={<ImportBuildingLocations count={CAPITOL_BUILDING_LOCATIONS.length} />}
    />
  );
}
