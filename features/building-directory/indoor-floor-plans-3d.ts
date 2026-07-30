import { db } from "@/lib/db";
import type { FloorPlanConfig, NavigationGraph } from "@/features/building-directory/navigation/types";

/**
 * Load indoor floor-plan images for the Three.js Building Directory fallback.
 * Only used when Leaflet indoor map v2 is off / has no published floors.
 */
export async function loadIndoorFloorPlansFor3D(): Promise<FloorPlanConfig[]> {
  const floors = await db.indoorFloor.findMany({
    where: {
      building: { isActive: true },
      assets: { some: {} },
    },
    include: {
      assets: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: [{ sortOrder: "asc" }, { levelIndex: "asc" }],
  });

  return floors
    .filter((f) => Boolean(f.assets[0]?.url) && f.widthPx > 0 && f.heightPx > 0)
    .map((f) => ({
      floor: f.levelIndex,
      label: f.labelEn,
      width: f.widthPx,
      height: f.heightPx,
      imageUrl: f.assets[0]!.url,
      hallways: [] as FloorPlanConfig["hallways"],
    }));
}

/**
 * Apply uploaded indoor floor plans as textured 3D slabs (Three.js fallback only).
 * When `leafletActive` is true, leave the navigation graph unchanged so Leaflet owns BD.
 */
export function applyIndoorFloorPlansToGraph(
  graph: NavigationGraph,
  indoorFloorPlans: FloorPlanConfig[],
  options?: { leafletActive?: boolean }
): NavigationGraph {
  if (options?.leafletActive) return graph;
  if (!indoorFloorPlans.length) return graph;

  return {
    ...graph,
    floorPlans: indoorFloorPlans,
    nodes: [],
    edges: [],
  };
}
