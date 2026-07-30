"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoJsonGeometry } from "@/features/indoor-map/types";
import { parseGeometry, toLatLng } from "@/features/indoor-map/geo";

export type PlanMapRoom = {
  id: string;
  name: string;
  geometryJson: string;
  selected?: boolean;
  highlighted?: boolean;
};

export type PlanMapNode = {
  id: string;
  x: number;
  y: number;
  type: string;
  label?: string | null;
  selected?: boolean;
};

export type PlanMapEdge = {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
};

export type PlanMapRoute = {
  points: Array<{ x: number; y: number }>;
};

type Props = {
  widthPx: number;
  heightPx: number;
  imageUrl: string | null;
  imageOpacity?: number;
  imageLocked?: boolean;
  rooms?: PlanMapRoom[];
  nodes?: PlanMapNode[];
  edges?: PlanMapEdge[];
  route?: PlanMapRoute | null;
  interactive?: boolean;
  drawMode?: "polygon" | "rectangle" | "line" | "point" | null;
  className?: string;
  onMapClick?: (x: number, y: number) => void;
  onRoomClick?: (id: string) => void;
  onNodeClick?: (id: string) => void;
  onPolygonComplete?: (geometry: GeoJsonGeometry) => void;
  onPointComplete?: (x: number, y: number) => void;
  onLineComplete?: (points: Array<{ x: number; y: number }>) => void;
};

function geometryToLatLngs(g: GeoJsonGeometry): L.LatLngExpression[] | L.LatLngExpression[][] {
  if (g.type === "Polygon") {
    return g.coordinates[0]!.map(([x, y]) => toLatLng(x, y));
  }
  if (g.type === "LineString") {
    return g.coordinates.map(([x, y]) => toLatLng(x, y));
  }
  if (g.type === "Point") {
    return [toLatLng(g.coordinates[0], g.coordinates[1])];
  }
  if (g.type === "MultiPolygon") {
    return g.coordinates[0]![0]!.map(([x, y]) => toLatLng(x, y));
  }
  return [];
}

export function LeafletPlanMap({
  widthPx,
  heightPx,
  imageUrl,
  imageOpacity = 1,
  rooms = [],
  nodes = [],
  edges = [],
  route = null,
  interactive = true,
  drawMode = null,
  className,
  onMapClick,
  onRoomClick,
  onNodeClick,
  onPolygonComplete,
  onPointComplete,
  onLineComplete,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlayRef = useRef<L.ImageOverlay | null>(null);
  const roomsLayerRef = useRef<L.LayerGroup | null>(null);
  const nodesLayerRef = useRef<L.LayerGroup | null>(null);
  const edgesLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const draftPts = useRef<Array<{ x: number; y: number }>>([]);

  const bounds = useMemo(
    () =>
      L.latLngBounds(
        L.latLng(0, 0),
        L.latLng(heightPx, widthPx)
      ),
    [widthPx, heightPx]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 4,
      zoomSnap: 0.25,
      attributionControl: false,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
    });
    map.fitBounds(bounds);
    map.setMaxBounds(bounds.pad(0.2));

    roomsLayerRef.current = L.layerGroup().addTo(map);
    nodesLayerRef.current = L.layerGroup().addTo(map);
    edgesLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const x = e.latlng.lng;
      const y = e.latlng.lat;
      if (drawMode === "point") {
        onPointComplete?.(x, y);
        return;
      }
      if (drawMode === "polygon" || drawMode === "line" || drawMode === "rectangle") {
        draftPts.current.push({ x, y });
        if (drawMode === "rectangle" && draftPts.current.length >= 2) {
          const a = draftPts.current[0]!;
          const b = draftPts.current[1]!;
          const minX = Math.min(a.x, b.x);
          const maxX = Math.max(a.x, b.x);
          const minY = Math.min(a.y, b.y);
          const maxY = Math.max(a.y, b.y);
          onPolygonComplete?.({
            type: "Polygon",
            coordinates: [
              [
                [minX, minY],
                [maxX, minY],
                [maxX, maxY],
                [minX, maxY],
                [minX, minY],
              ],
            ],
          });
          draftPts.current = [];
          return;
        }
        if (drawMode === "line" && draftPts.current.length >= 2) {
          onLineComplete?.([...draftPts.current]);
          draftPts.current = [];
          return;
        }
        if (drawMode === "polygon" && draftPts.current.length >= 3) {
          // double-click finish handled below
        }
        return;
      }
      onMapClick?.(x, y);
    });

    map.on("dblclick", () => {
      if (drawMode === "polygon" && draftPts.current.length >= 3) {
        const ring = draftPts.current.map((p) => [p.x, p.y] as [number, number]);
        const first = ring[0]!;
        ring.push([first[0], first[1]]);
        onPolygonComplete?.({ type: "Polygon", coordinates: [ring] });
        draftPts.current = [];
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    draftPts.current = [];
  }, [drawMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.fitBounds(bounds);
    map.setMaxBounds(bounds.pad(0.2));
  }, [bounds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
      overlayRef.current = null;
    }
    if (imageUrl && !imageUrl.toLowerCase().endsWith(".pdf")) {
      const overlay = L.imageOverlay(imageUrl, bounds, {
        opacity: imageOpacity,
        interactive: false,
      });
      overlay.addTo(map);
      overlayRef.current = overlay;
    }
  }, [imageUrl, imageOpacity, bounds]);

  useEffect(() => {
    const layer = roomsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    for (const room of rooms) {
      const g = parseGeometry(room.geometryJson);
      if (!g || (g.type !== "Polygon" && g.type !== "MultiPolygon")) continue;
      const latlngs = geometryToLatLngs(g) as L.LatLngExpression[];
      const poly = L.polygon(latlngs, {
        color: room.selected || room.highlighted ? "#0f766e" : "#334155",
        weight: room.selected ? 3 : 1.5,
        fillColor: room.highlighted ? "#14b8a6" : room.selected ? "#0d9488" : "#64748b",
        fillOpacity: room.highlighted || room.selected ? 0.45 : 0.22,
      });
      poly.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onRoomClick?.(room.id);
      });
      poly.bindTooltip(room.name, { sticky: true });
      poly.addTo(layer);
    }
  }, [rooms, onRoomClick]);

  useEffect(() => {
    const layer = edgesLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    for (const edge of edges) {
      L.polyline([toLatLng(edge.from.x, edge.from.y), toLatLng(edge.to.x, edge.to.y)], {
        color: "#f59e0b",
        weight: 2,
        dashArray: "4 4",
        opacity: 0.85,
      }).addTo(layer);
    }
  }, [edges]);

  useEffect(() => {
    const layer = nodesLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    for (const node of nodes) {
      const marker = L.circleMarker(toLatLng(node.x, node.y), {
        radius: node.selected ? 8 : 5,
        color: "#fff",
        weight: 2,
        fillColor: node.type === "elevator" || node.type === "staircase" ? "#22c55e" : "#0ea5e9",
        fillOpacity: 1,
      });
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onNodeClick?.(node.id);
      });
      if (node.label) marker.bindTooltip(node.label);
      marker.addTo(layer);
    }
  }, [nodes, onNodeClick]);

  useEffect(() => {
    const layer = routeLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!route?.points.length) return;
    const latlngs = route.points.map((p) => toLatLng(p.x, p.y));
    L.polyline(latlngs, {
      color: "#2563eb",
      weight: 5,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
      className: "indoor-route-line",
    }).addTo(layer);
    const end = route.points[route.points.length - 1]!;
    L.circleMarker(toLatLng(end.x, end.y), {
      radius: 9,
      color: "#fff",
      weight: 2,
      fillColor: "#dc2626",
      fillOpacity: 1,
    }).addTo(layer);
  }, [route]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", minHeight: 360, background: "#0f172a" }}
    />
  );
}
