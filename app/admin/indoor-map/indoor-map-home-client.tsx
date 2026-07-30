"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Layers, Plus, Map as MapIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createIndoorBuilding, createIndoorFloor } from "@/features/indoor-map/admin-actions";
import type { IndoorBuildingSummary, IndoorFloorSummary } from "@/features/indoor-map/types";

type Props = {
  buildings: IndoorBuildingSummary[];
  floors: IndoorFloorSummary[];
};

export function IndoorMapAdminHome({ buildings: initialBuildings, floors: initialFloors }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [buildings, setBuildings] = useState(initialBuildings);
  const [floors, setFloors] = useState(initialFloors);
  const [buildingName, setBuildingName] = useState("");
  const [floorBuildingId, setFloorBuildingId] = useState(initialBuildings[0]?.id ?? "");
  const [floorLabel, setFloorLabel] = useState("Ground Floor");
  const [levelIndex, setLevelIndex] = useState(1);

  const createBuilding = () => {
    startTransition(async () => {
      const result = await createIndoorBuilding({ nameEn: buildingName });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Building created");
      setBuildingName("");
      router.refresh();
      if (result.id) {
        setBuildings((b) => [
          ...b,
          {
            id: result.id!,
            slug: buildingName.toLowerCase().replace(/\s+/g, "-"),
            nameEn: buildingName,
            nameFil: null,
            nameBis: null,
            address: null,
            isActive: true,
            floorCount: 0,
          },
        ]);
        setFloorBuildingId(result.id);
      }
    });
  };

  const createFloor = () => {
    if (!floorBuildingId) {
      toast.error("Create a building first");
      return;
    }
    startTransition(async () => {
      const result = await createIndoorFloor({
        buildingId: floorBuildingId,
        levelIndex,
        labelEn: floorLabel,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Floor created");
      if (result.id) router.push(`/admin/indoor-map/${result.id}`);
      else router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-kiosk-navy">Indoor Map</h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload official floor plans, digitize rooms and hallways, then publish for kiosk navigation
          (Leaflet + A* — Building Directory primary map).
        </p>
      </div>

      <div className="rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-sm text-teal-950">
        <p className="font-semibold text-teal-900">Digitize → Publish workflow</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-teal-900/90">
          <li>Open a floor editor and confirm the floor-plan image is uploaded (PNG/JPG; convert PDF pages first).</li>
          <li>Trace <strong>rooms</strong> (polygons) and fill name / department properties.</li>
          <li>Place <strong>nav nodes</strong> along hallways, doors, stairs, and elevators.</li>
          <li>Connect nodes with <strong>edges</strong> so A* can route between rooms.</li>
          <li>Click <strong>Publish</strong> — the kiosk Building Directory shows this plan in Leaflet.</li>
        </ol>
        <p className="mt-2 text-xs text-teal-800/80">
          Without rooms and a connected graph, citizens can view the plan but cannot search rooms or get turn-by-turn paths.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-kiosk-navy">
            <Building2 className="h-4 w-4" /> New building
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={buildingName}
              onChange={(e) => setBuildingName(e.target.value)}
              placeholder="Provincial Capitol Building"
            />
            <Button onClick={createBuilding} disabled={pending || !buildingName.trim()}>
              <Plus className="mr-1 h-4 w-4" /> Create building
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-kiosk-navy">
            <Layers className="h-4 w-4" /> New floor
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>Building</Label>
              <select
                className="h-10 w-full rounded-md border px-3 text-sm"
                value={floorBuildingId}
                onChange={(e) => setFloorBuildingId(e.target.value)}
              >
                <option value="">Select…</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nameEn}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Label</Label>
              <Input value={floorLabel} onChange={(e) => setFloorLabel(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Level index</Label>
              <Input
                type="number"
                value={levelIndex}
                onChange={(e) => setLevelIndex(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <Button className="mt-3" onClick={createFloor} disabled={pending || !floorBuildingId}>
            <Plus className="mr-1 h-4 w-4" /> Create floor & open editor
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-4 py-3 text-sm font-semibold text-kiosk-navy">Floors</div>
        {floors.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No floors yet. Create a building and floor, then upload your floor plan image.</p>
        ) : (
          <ul className="divide-y">
            {floors.map((f) => {
              const building = buildings.find((b) => b.id === f.buildingId);
              return (
                <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/indoor-map/${f.id}`}
                      className="block truncate font-medium text-slate-900 hover:text-teal-700 hover:underline"
                    >
                      {building?.nameEn ?? "Building"} · {f.labelEn}
                    </Link>
                    <p className="text-xs text-gray-500">
                      Level {f.levelIndex} · {f.roomCount} rooms · {f.nodeCount} nodes ·{" "}
                      {f.isPublished ? "Published" : "Draft"} ·{" "}
                      {f.assetUrl ? "Plan uploaded" : "No plan yet"}
                    </p>
                  </div>
                  <Link
                    href={`/admin/indoor-map/${f.id}`}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-kiosk-navy px-3 text-sm font-medium text-white hover:bg-kiosk-navy/90"
                  >
                    <MapIcon className="h-3.5 w-3.5" /> Open editor
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
