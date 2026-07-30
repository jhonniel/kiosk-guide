import type { GeoJsonGeometry } from "./types";

export function parseGeometry(json: string): GeoJsonGeometry | null {
  try {
    const g = JSON.parse(json) as GeoJsonGeometry;
    if (!g?.type || !("coordinates" in g)) return null;
    return g;
  } catch {
    return null;
  }
}

export function stringifyGeometry(g: GeoJsonGeometry): string {
  return JSON.stringify(g);
}

export function pointGeometry(x: number, y: number): GeoJsonGeometry {
  return { type: "Point", coordinates: [x, y] };
}

export function lineGeometry(points: Array<{ x: number; y: number }>): GeoJsonGeometry {
  return {
    type: "LineString",
    coordinates: points.map((p) => [p.x, p.y] as [number, number]),
  };
}

export function rectPolygon(
  x: number,
  y: number,
  w: number,
  h: number
): GeoJsonGeometry {
  return {
    type: "Polygon",
    coordinates: [
      [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
        [x, y],
      ],
    ],
  };
}

/** Leaflet CRS.Simple uses [y, x] latLng order for plan space. */
export function toLatLng(x: number, y: number): [number, number] {
  return [y, x];
}

export function fromLatLng(lat: number, lng: number): { x: number; y: number } {
  return { x: lng, y: lat };
}

export function geometryCentroid(g: GeoJsonGeometry): { x: number; y: number } | null {
  if (g.type === "Point") {
    return { x: g.coordinates[0], y: g.coordinates[1] };
  }
  if (g.type === "LineString") {
    const pts = g.coordinates;
    if (!pts.length) return null;
    const sx = pts.reduce((a, p) => a + p[0], 0);
    const sy = pts.reduce((a, p) => a + p[1], 0);
    return { x: sx / pts.length, y: sy / pts.length };
  }
  const ring =
    g.type === "Polygon"
      ? g.coordinates[0]
      : g.type === "MultiPolygon"
        ? g.coordinates[0]?.[0]
        : null;
  if (!ring?.length) return null;
  // exclude closing point
  const pts = ring.slice(0, -1);
  if (!pts.length) return null;
  const sx = pts.reduce((a, p) => a + p[0], 0);
  const sy = pts.reduce((a, p) => a + p[1], 0);
  return { x: sx / pts.length, y: sy / pts.length };
}

export function euclideanMeters(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  metersPerPixel: number
): number {
  return Math.hypot(bx - ax, by - ay) * metersPerPixel;
}

export function walkingMinutes(distanceMeters: number, mPerMin = 80): number {
  return Math.max(1, Math.round(distanceMeters / mPerMin));
}

/** Sync PostGIS geom from GeoJSON when extension is available. */
export function postgisSyncSql(table: "IndoorRoom" | "IndoorAmenity", id: string, geometryJson: string) {
  return {
    sql: `UPDATE "${table}" SET "geom" = ST_SetSRID(ST_GeomFromGeoJSON($1), 0) WHERE "id" = $2`,
    params: [geometryJson, id] as [string, string],
  };
}
