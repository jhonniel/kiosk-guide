"use client";

import dynamic from "next/dynamic";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { Navigation, Search, Accessibility } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { IndoorRouteResult, PublishedIndoorPayload } from "@/features/indoor-map/types";
import { geometryCentroid, parseGeometry } from "@/features/indoor-map/geo";

const LeafletPlanMap = dynamic(
  () => import("@/components/indoor-map/leaflet-plan-map").then((m) => m.LeafletPlanMap),
  { ssr: false }
);

type Props = {
  payload: PublishedIndoorPayload;
  buildingName: string;
};

type SearchHit = {
  id: string;
  nameEn: string;
  roomNumber: string | null;
  department: string | null;
  category: string;
  floorId: string;
  floorLabel: string;
  nodeId: string | null;
  geometryJson: string;
};

export function IndoorKioskMap({ payload, buildingName }: Props) {
  const building = payload.buildings[0];
  const floors = building?.floors ?? [];
  const [floorId, setFloorId] = useState(floors[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [fromNodeId, setFromNodeId] = useState<string | null>(null);
  const [toNodeId, setToNodeId] = useState<string | null>(null);
  const [route, setRoute] = useState<IndoorRouteResult | null>(null);
  const [wheelchairOnly, setWheelchairOnly] = useState(false);
  const [pending, startTransition] = useTransition();

  const floor = floors.find((f) => f.id === floorId) ?? floors[0] ?? null;
  const selectedRoom = floor?.rooms.find((r) => r.id === selectedRoomId) ?? null;

  const routePoints = useMemo(() => {
    if (!route || !floor) return null;
    const seg = route.segments.find((s) => s.floorId === floor.id);
    if (!seg) return null;
    return { points: seg.points };
  }, [route, floor]);

  const runSearch = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setHits([]);
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/indoor-map/published?q=${encodeURIComponent(value.trim())}`);
      const json = (await res.json()) as { success?: boolean; results?: SearchHit[] };
      setHits(json.results ?? []);
    });
  };

  const focusRoom = (hit: SearchHit) => {
    setFloorId(hit.floorId);
    setSelectedRoomId(hit.id);
    if (hit.nodeId) setToNodeId(hit.nodeId);
    setHits([]);
    setQuery(hit.nameEn);
  };

  const pickStartNearRoom = () => {
    if (!floor?.nodes.length) {
      toast.error("No navigation nodes on this floor yet.");
      return;
    }
    // Prefer entrance, else first node
    const entrance = floor.nodes.find((n) => n.type === "entrance") ?? floor.nodes[0]!;
    setFromNodeId(entrance.id);
    toast.success(`Start set: ${entrance.label || entrance.type}`);
  };

  const setDestinationFromSelection = () => {
    if (!selectedRoom) return;
    const node =
      floor?.nodes.find((n) => n.roomId === selectedRoom.id) ??
      (() => {
        const c = parseGeometry(selectedRoom.geometryJson);
        const center = c ? geometryCentroid(c) : null;
        if (!center || !floor) return null;
        let best = floor.nodes[0] ?? null;
        let bestD = Infinity;
        for (const n of floor.nodes) {
          const d = Math.hypot(n.x - center.x, n.y - center.y);
          if (d < bestD) {
            bestD = d;
            best = n;
          }
        }
        return best;
      })();
    if (!node) {
      toast.error("No nav node near this room. Connect a node in admin.");
      return;
    }
    setToNodeId(node.id);
    toast.success("Destination set");
  };

  const go = () => {
    if (!fromNodeId || !toNodeId) {
      toast.error("Choose start and destination first.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/indoor-map/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromNodeId, toNodeId, wheelchairOnly }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string; route?: IndoorRouteResult };
      if (!json.success || !json.route) {
        toast.error(json.error ?? "No route found");
        return;
      }
      setRoute(json.route);
      const firstFloor = json.route.segments[0]?.floorId;
      if (firstFloor) setFloorId(firstFloor);
      toast.success(
        `${json.route.totalDistanceMeters.toFixed(0)} m · ~${json.route.estimatedMinutes} min`
      );
    });
  };

  if (!building || !floor) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center text-sm text-slate-600">
        No published indoor floor plans yet. Upload and publish a floor in Admin → Indoor Map.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/40 bg-slate-900/90 shadow-xl backdrop-blur">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-teal-200/80">Indoor map</p>
          <h2 className="text-lg font-semibold text-white">{buildingName || building.nameEn}</h2>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {floors.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFloorId(f.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                f.id === floor.id ? "bg-teal-400 text-slate-900" : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {f.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative min-h-[280px] h-full">
          <LeafletPlanMap
            widthPx={floor.widthPx}
            heightPx={floor.heightPx}
            imageUrl={floor.assetUrl}
            imageOpacity={floor.opacity}
            rooms={floor.rooms.map((r) => ({
              id: r.id,
              name: r.nameEn,
              geometryJson: r.geometryJson,
              selected: r.id === selectedRoomId,
              highlighted: r.id === selectedRoomId,
            }))}
            nodes={floor.nodes.map((n) => ({
              id: n.id,
              x: n.x,
              y: n.y,
              type: n.type,
              label: n.label,
              selected: n.id === fromNodeId || n.id === toNodeId,
            }))}
            edges={[]}
            route={routePoints}
            onRoomClick={(id) => setSelectedRoomId(id)}
            className="h-full min-h-[280px]"
          />
        </div>

        <aside className="flex flex-col gap-3 border-t border-white/10 bg-slate-950/80 p-4 lg:border-l lg:border-t-0">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => runSearch(e.target.value)}
              placeholder="Search rooms, offices, restrooms…"
              className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-slate-400"
            />
            {deferredQuery && hits.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-white/10 bg-slate-900 shadow-xl">
                {hits.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      className="flex w-full flex-col px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                      onClick={() => focusRoom(h)}
                    >
                      <span className="font-medium">{h.nameEn}</span>
                      <span className="text-[11px] text-slate-400">
                        {h.floorLabel}
                        {h.roomNumber ? ` · ${h.roomNumber}` : ""}
                        {h.department ? ` · ${h.department}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedRoom ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white">
              <p className="font-semibold">{selectedRoom.nameEn}</p>
              {selectedRoom.roomNumber && (
                <p className="text-xs text-slate-300">Room {selectedRoom.roomNumber}</p>
              )}
              {selectedRoom.department && (
                <p className="mt-1 text-xs text-slate-300">{selectedRoom.department}</p>
              )}
              {selectedRoom.descriptionEn && (
                <p className="mt-2 text-xs leading-relaxed text-slate-300">{selectedRoom.descriptionEn}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={setDestinationFromSelection}>
                  Set destination
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Tap a room on the map for details.</p>
          )}

          <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-200/80">Navigate</p>
            <Button size="sm" variant="outline" className="w-full border-white/20 text-white" onClick={pickStartNearRoom}>
              Use entrance / start
            </Button>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={wheelchairOnly}
                onChange={(e) => setWheelchairOnly(e.target.checked)}
              />
              <Accessibility className="h-3.5 w-3.5" /> Wheelchair-friendly route
            </label>
            <Button className="w-full bg-teal-500 text-slate-950 hover:bg-teal-400" disabled={pending} onClick={go}>
              <Navigation className="mr-1 h-4 w-4" /> Show shortest route
            </Button>
            {route && (
              <div className="text-xs text-slate-300">
                <p>
                  {route.destinationName}: {route.totalDistanceMeters.toFixed(0)} m · ~
                  {route.estimatedMinutes} min
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {route.segments.flatMap((s) => s.instructions).map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
