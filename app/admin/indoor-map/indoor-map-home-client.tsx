"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Info, Layers, Map as MapIcon, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { ConfirmDialog, type ConfirmRequest } from "@/components/admin/admin-dialogs";
import { createIndoorBuilding, createIndoorFloor, deleteIndoorBuilding } from "@/features/indoor-map/admin-actions";
import type { IndoorBuildingSummary, IndoorFloorSummary } from "@/features/indoor-map/types";

type Props = {
  buildings: IndoorBuildingSummary[];
  floors: IndoorFloorSummary[];
};

export function IndoorMapAdminHome({ buildings, floors }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [buildingName, setBuildingName] = useState("");
  const [chosenBuildingId, setChosenBuildingId] = useState("");
  const [floorLabel, setFloorLabel] = useState("Ground Floor");
  const [levelIndex, setLevelIndex] = useState("1");
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const floorBuildingId = buildings.some((b) => b.id === chosenBuildingId)
    ? chosenBuildingId
    : (buildings[0]?.id ?? "");

  const createBuilding = (event: React.FormEvent) => {
    event.preventDefault();
    const name = buildingName.trim();
    if (!name) {
      toast.error("Building name is required.");
      return;
    }
    startTransition(async () => {
      const result = await createIndoorBuilding({ nameEn: name });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Building created");
      setBuildingName("");
      if (result.id) setChosenBuildingId(result.id);
      router.refresh();
    });
  };

  const createFloor = (event: React.FormEvent) => {
    event.preventDefault();
    const level = Number(levelIndex);
    if (!floorBuildingId) {
      toast.error("Create a building first.");
      return;
    }
    if (!floorLabel.trim()) {
      toast.error("Floor name is required.");
      return;
    }
    if (!Number.isInteger(level)) {
      toast.error("Level must be a whole number, for example 1 for the ground floor.");
      return;
    }
    startTransition(async () => {
      const result = await createIndoorFloor({
        buildingId: floorBuildingId,
        levelIndex: level,
        labelEn: floorLabel.trim(),
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

  const askDeleteBuilding = (building: IndoorBuildingSummary) =>
    setConfirmRequest({
      title: `Delete ${building.nameEn}?`,
      description: "The building is removed from the indoor map editor. This cannot be undone.",
      confirmLabel: "Delete building",
      destructive: true,
      onConfirm: () =>
        startTransition(async () => {
          const result = await deleteIndoorBuilding(building.id);
          setConfirmRequest(null);
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success("Building deleted");
          router.refresh();
        }),
    });

  return (
    <AdminPage>
      <AdminPageHeader
        title="Indoor Map"
        description="Upload floor plans for the Building Directory, then trace rooms and walking paths so visitors can search rooms and get directions."
      />

      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="space-y-1">
          <p className="font-semibold">How this affects the kiosk</p>
          <p>
            As soon as a floor has a floor-plan image, the kiosk&apos;s 3D Building Directory shows the uploaded images
            in place of the built-in Capitol floor plans, whether or not the floor is published.
          </p>
          <p>
            The traced rooms and paths are used only when &ldquo;Interactive indoor map&rdquo; is turned on in Settings
            and no floor-plan images are uploaded.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
        <p className="font-semibold text-kiosk-navy">Steps</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Create the building and a floor, then open the floor editor.</li>
          <li>Upload the floor-plan image (PNG or JPG; save PDF pages as images first).</li>
          <li>Trace each room and fill in its name and office.</li>
          <li>Place path points along hallways, doors, stairs and elevators, and connect them.</li>
          <li>Publish the floor.</li>
        </ol>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={createBuilding} noValidate className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-kiosk-navy">
            <Building2 className="h-4 w-4" /> New building
          </h2>
          <div className="space-y-2">
            <Label htmlFor="indoor-building-name">Building name</Label>
            <Input
              id="indoor-building-name"
              value={buildingName}
              onChange={(e) => setBuildingName(e.target.value)}
              placeholder="Provincial Capitol Building"
            />
            <Button type="submit" disabled={pending}>
              <Plus className="h-4 w-4" /> Create building
            </Button>
          </div>
        </form>

        <form onSubmit={createFloor} noValidate className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-kiosk-navy">
            <Layers className="h-4 w-4" /> New floor
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="indoor-floor-building">Building</Label>
              <select
                id="indoor-floor-building"
                className="h-9 w-full rounded-lg border border-input bg-white px-3 text-sm disabled:opacity-60"
                value={floorBuildingId}
                disabled={buildings.length === 0}
                onChange={(e) => setChosenBuildingId(e.target.value)}
              >
                {buildings.length === 0 ? <option value="">Create a building first</option> : null}
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nameEn}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="indoor-floor-label">Floor name</Label>
              <Input id="indoor-floor-label" value={floorLabel} onChange={(e) => setFloorLabel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="indoor-floor-level">Level (1 = ground floor)</Label>
              <Input
                id="indoor-floor-level"
                type="number"
                step={1}
                value={levelIndex}
                onChange={(e) => setLevelIndex(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" className="mt-3" disabled={pending || buildings.length === 0}>
            <Plus className="h-4 w-4" /> Create floor and open editor
          </Button>
        </form>
      </div>

      {buildings.length > 0 ? (
        <section className="rounded-xl border bg-white shadow-sm">
          <h2 className="border-b px-4 py-3 text-sm font-semibold text-kiosk-navy">Buildings</h2>
          <ul className="divide-y">
            {buildings.map((b) => {
              const floorCount = floors.filter((f) => f.buildingId === b.id).length;
              return (
                <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{b.nameEn}</p>
                    <p className="text-xs text-gray-500">
                      {floorCount} floor{floorCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    disabled={pending || floorCount > 0}
                    title={floorCount > 0 ? "Delete this building's floors first" : "Delete building"}
                    onClick={() => askDeleteBuilding(b)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl border bg-white shadow-sm">
        <h2 className="border-b px-4 py-3 text-sm font-semibold text-kiosk-navy">Floors</h2>
        {floors.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">
            No floors yet. Create a building and a floor, then upload its floor-plan image.
          </p>
        ) : (
          <ul className="divide-y">
            {floors.map((f) => {
              const building = buildings.find((b) => b.id === f.buildingId);
              return (
                <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/indoor-map/${f.id}`}
                      className="block truncate font-medium text-slate-900 hover:text-teal-700 hover:underline"
                    >
                      {building?.nameEn ?? "Building"} · {f.labelEn}
                    </Link>
                    <p className="text-xs text-gray-500">
                      Level {f.levelIndex} · {f.roomCount} room{f.roomCount === 1 ? "" : "s"} · {f.nodeCount} path point
                      {f.nodeCount === 1 ? "" : "s"} · {f.isPublished ? "Published" : "Not published"} ·{" "}
                      {f.assetUrl ? "Floor plan uploaded" : "No floor plan yet"}
                    </p>
                  </div>
                  <Link
                    href={`/admin/indoor-map/${f.id}`}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-kiosk-navy px-3 text-sm font-medium text-white hover:bg-kiosk-navy/90"
                  >
                    <MapIcon className="h-3.5 w-3.5" /> Open editor
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ConfirmDialog request={confirmRequest} pending={pending} onCancel={() => setConfirmRequest(null)} />
    </AdminPage>
  );
}
