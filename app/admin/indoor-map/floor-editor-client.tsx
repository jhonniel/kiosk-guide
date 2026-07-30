"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Link2,
  Lock,
  LockOpen,
  MousePointer2,
  Pentagon,
  Circle,
  Minus,
  Square,
  Trash2,
  Upload,
  Save,
  Eye,
  EyeOff,
  Route,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  attachFloorPlanAsset,
  connectIndoorNavNodes,
  deleteIndoorAmenity,
  deleteIndoorNavEdge,
  deleteIndoorNavNode,
  deleteIndoorRoom,
  publishIndoorFloor,
  setFloorAssetLocked,
  unpublishIndoorFloor,
  updateIndoorFloorSettings,
  upsertIndoorAmenity,
  upsertIndoorNavNode,
  upsertIndoorRoom,
} from "@/features/indoor-map/admin-actions";
import { useIndoorEditorStore } from "@/features/indoor-map/store";
import { stringifyGeometry } from "@/features/indoor-map/geo";
import type {
  EditorTool,
  GeoJsonGeometry,
  IndoorAmenityRow,
  IndoorFloorDetail,
  IndoorNavEdgeRow,
  IndoorNavNodeRow,
  IndoorRoomRow,
} from "@/features/indoor-map/types";

const LeafletPlanMap = dynamic(
  () => import("@/components/indoor-map/leaflet-plan-map").then((m) => m.LeafletPlanMap),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-white/70">Loading map…</div> }
);

type Props = { initial: IndoorFloorDetail };

const TOOLS: Array<{ id: EditorTool; label: string; icon: typeof MousePointer2 }> = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "polygon", label: "Room polygon", icon: Pentagon },
  { id: "rectangle", label: "Room rect", icon: Square },
  { id: "point", label: "Nav node", icon: Circle },
  { id: "line", label: "Hallway / amenity line", icon: Minus },
  { id: "connect", label: "Connect nodes", icon: Link2 },
];

export function FloorEditorClient({ initial }: Props) {
  const [pending, startTransition] = useTransition();
  const [floor, setFloor] = useState(initial.floor);
  const [assets, setAssets] = useState(initial.assets);
  const [rooms, setRooms] = useState<IndoorRoomRow[]>(initial.rooms);
  const [amenities, setAmenities] = useState<IndoorAmenityRow[]>(initial.amenities);
  const [nodes, setNodes] = useState<IndoorNavNodeRow[]>(initial.nodes);
  const [edges, setEdges] = useState<IndoorNavEdgeRow[]>(initial.edges);
  const [uploading, setUploading] = useState(false);

  const tool = useIndoorEditorStore((s) => s.tool);
  const setTool = useIndoorEditorStore((s) => s.setTool);
  const selectedId = useIndoorEditorStore((s) => s.selectedId);
  const selectedKind = useIndoorEditorStore((s) => s.selectedKind);
  const setSelected = useIndoorEditorStore((s) => s.setSelected);
  const connectFromId = useIndoorEditorStore((s) => s.connectFromId);
  const setConnectFrom = useIndoorEditorStore((s) => s.setConnectFrom);
  const layerVisibility = useIndoorEditorStore((s) => s.layerVisibility);
  const toggleLayer = useIndoorEditorStore((s) => s.toggleLayer);

  const asset = assets[0] ?? null;
  const selectedRoom = rooms.find((r) => r.id === selectedId) ?? null;
  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;

  const [roomForm, setRoomForm] = useState({
    nameEn: "",
    roomNumber: "",
    department: "",
    category: "office",
    accessibility: "standard",
    descriptionEn: "",
    capacity: "",
    hoursEn: "",
  });

  useEffect(() => {
    if (selectedRoom) {
      setRoomForm({
        nameEn: selectedRoom.nameEn,
        roomNumber: selectedRoom.roomNumber ?? "",
        department: selectedRoom.department ?? "",
        category: selectedRoom.category,
        accessibility: selectedRoom.accessibility,
        descriptionEn: selectedRoom.descriptionEn ?? "",
        capacity: selectedRoom.capacity != null ? String(selectedRoom.capacity) : "",
        hoursEn: selectedRoom.hoursEn ?? "",
      });
    }
  }, [selectedRoom]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "v" || e.key === "V") setTool("select");
      if (e.key === "p" || e.key === "P") setTool("polygon");
      if (e.key === "r" || e.key === "R") setTool("rectangle");
      if (e.key === "n" || e.key === "N") setTool("point");
      if (e.key === "c" || e.key === "C") setTool("connect");
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId && selectedKind === "room") void removeRoom(selectedId);
        if (selectedId && selectedKind === "node") void removeNode(selectedId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const uploadPlan = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/indoor-map/upload", { method: "POST", body: fd });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        fileUrl?: string;
        mimeType?: string;
        originalName?: string;
        widthPx?: number;
        heightPx?: number;
      };
      if (!res.ok || !json.success || !json.fileUrl) {
        toast.error(json.error ?? "Upload failed");
        return;
      }
      if (json.mimeType === "application/pdf") {
        toast.message("PDF stored. Export a PNG/JPG of the plan for digitizing overlays.");
      }
      const result = await attachFloorPlanAsset({
        floorId: floor.id,
        url: json.fileUrl,
        mimeType: json.mimeType!,
        originalName: json.originalName!,
        widthPx: json.widthPx!,
        heightPx: json.heightPx!,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Floor plan attached");
      setFloor((f) => ({
        ...f,
        widthPx: json.widthPx!,
        heightPx: json.heightPx!,
        assetUrl: json.fileUrl!,
      }));
      setAssets([
        {
          id: result.assetId!,
          floorId: floor.id,
          kind: "reference",
          mimeType: json.mimeType!,
          url: json.fileUrl!,
          originalName: json.originalName!,
          locked: false,
        },
      ]);
    } finally {
      setUploading(false);
    }
  };

  const toggleLock = () => {
    if (!asset) return;
    startTransition(async () => {
      const next = !asset.locked;
      const result = await setFloorAssetLocked(asset.id, next);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setAssets((a) => a.map((x) => (x.id === asset.id ? { ...x, locked: next } : x)));
      toast.success(next ? "Reference locked" : "Reference unlocked");
    });
  };

  const onOpacity = (opacity: number) => {
    setFloor((f) => ({ ...f, opacity }));
    startTransition(async () => {
      await updateIndoorFloorSettings(floor.id, { opacity });
    });
  };

  const saveRoomMeta = () => {
    if (!selectedRoom) return;
    startTransition(async () => {
      const result = await upsertIndoorRoom({
        id: selectedRoom.id,
        floorId: floor.id,
        geometryJson: selectedRoom.geometryJson,
        nameEn: roomForm.nameEn,
        roomNumber: roomForm.roomNumber,
        department: roomForm.department,
        category: roomForm.category,
        accessibility: roomForm.accessibility,
        descriptionEn: roomForm.descriptionEn,
        capacity: roomForm.capacity ? Number(roomForm.capacity) : null,
        hoursEn: roomForm.hoursEn,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setRooms((prev) =>
        prev.map((r) =>
          r.id === selectedRoom.id
            ? {
                ...r,
                nameEn: roomForm.nameEn,
                roomNumber: roomForm.roomNumber || null,
                department: roomForm.department || null,
                category: roomForm.category,
                accessibility: roomForm.accessibility,
                descriptionEn: roomForm.descriptionEn || null,
                capacity: roomForm.capacity ? Number(roomForm.capacity) : null,
                hoursEn: roomForm.hoursEn || null,
              }
            : r
        )
      );
      toast.success("Room saved");
    });
  };

  const removeRoom = (id: string) => {
    startTransition(async () => {
      const result = await deleteIndoorRoom(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setRooms((r) => r.filter((x) => x.id !== id));
      setSelected(null, null);
      toast.success("Room removed");
    });
  };

  const removeNode = (id: string) => {
    startTransition(async () => {
      const result = await deleteIndoorNavNode(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setNodes((n) => n.filter((x) => x.id !== id));
      setEdges((e) => e.filter((x) => x.fromNodeId !== id && x.toNodeId !== id));
      setSelected(null, null);
      toast.success("Node removed");
    });
  };

  const onPolygonComplete = useCallback(
    (geometry: GeoJsonGeometry) => {
      startTransition(async () => {
        const result = await upsertIndoorRoom({
          floorId: floor.id,
          nameEn: `Room ${rooms.length + 1}`,
          geometryJson: stringifyGeometry(geometry),
          category: "office",
        });
        if (!result.success || !result.id) {
          toast.error(!result.success ? result.error : "Failed");
          return;
        }
        const row: IndoorRoomRow = {
          id: result.id,
          floorId: floor.id,
          roomNumber: null,
          nameEn: `Room ${rooms.length + 1}`,
          nameFil: null,
          nameBis: null,
          department: null,
          descriptionEn: null,
          descriptionFil: null,
          descriptionBis: null,
          capacity: null,
          category: "office",
          accessibility: "standard",
          hoursEn: null,
          hoursFil: null,
          hoursBis: null,
          photoUrl: null,
          qrPayload: null,
          geometryJson: stringifyGeometry(geometry),
          isActive: true,
          sortOrder: rooms.length,
        };
        setRooms((r) => [...r, row]);
        setSelected(result.id, "room");
        setTool("select");
        toast.success("Room polygon added — fill properties");
      });
    },
    [floor.id, rooms.length, setSelected, setTool]
  );

  const onPointComplete = useCallback(
    (x: number, y: number) => {
      startTransition(async () => {
        const result = await upsertIndoorNavNode({
          floorId: floor.id,
          type: "intersection",
          x,
          y,
          label: `N${nodes.length + 1}`,
        });
        if (!result.success || !result.id) {
          toast.error(!result.success ? result.error : "Failed");
          return;
        }
        setNodes((n) => [
          ...n,
          {
            id: result.id!,
            floorId: floor.id,
            type: "intersection",
            x,
            y,
            label: `N${nodes.length + 1}`,
            roomId: null,
            wheelchairAccessible: true,
          },
        ]);
        toast.success("Nav node placed");
      });
    },
    [floor.id, nodes.length]
  );

  const onLineComplete = useCallback(
    (points: Array<{ x: number; y: number }>) => {
      startTransition(async () => {
        const geometry = stringifyGeometry({
          type: "LineString",
          coordinates: points.map((p) => [p.x, p.y] as [number, number]),
        });
        const result = await upsertIndoorAmenity({
          floorId: floor.id,
          kind: "hallway",
          label: "Hallway",
          geometryJson: geometry,
        });
        if (!result.success || !result.id) {
          toast.error(!result.success ? result.error : "Failed");
          return;
        }
        setAmenities((a) => [
          ...a,
          {
            id: result.id!,
            floorId: floor.id,
            kind: "hallway",
            label: "Hallway",
            geometryJson: geometry,
            propsJson: null,
            isActive: true,
            sortOrder: a.length,
          },
        ]);
        toast.success("Hallway line added");
        setTool("select");
      });
    },
    [floor.id, setTool]
  );

  const onNodeClick = (id: string) => {
    if (tool === "connect") {
      if (!connectFromId) {
        setConnectFrom(id);
        toast.message("Select the destination node");
        return;
      }
      startTransition(async () => {
        const result = await connectIndoorNavNodes({ fromNodeId: connectFromId, toNodeId: id });
        setConnectFrom(null);
        if (!result.success || !result.id) {
          toast.error(!result.success ? result.error : "Failed");
          return;
        }
        const from = nodes.find((n) => n.id === connectFromId);
        const to = nodes.find((n) => n.id === id);
        if (from && to) {
          setEdges((e) => [
            ...e.filter((x) => !(x.fromNodeId === connectFromId && x.toNodeId === id)),
            {
              id: result.id!,
              fromNodeId: connectFromId,
              toNodeId: id,
              distanceMeters: Math.hypot(to.x - from.x, to.y - from.y) * floor.metersPerPixel,
              wheelchairAccessible: true,
              vertical: false,
              verticalToFloorId: null,
              instruction: null,
            },
          ]);
        }
        toast.success("Nodes connected");
      });
      return;
    }
    setSelected(id, "node");
  };

  const edgeViews = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    return edges
      .map((e) => {
        const from = byId.get(e.fromNodeId);
        const to = byId.get(e.toNodeId);
        if (!from || !to) return null;
        return { id: e.id, from: { x: from.x, y: from.y }, to: { x: to.x, y: to.y } };
      })
      .filter(Boolean) as Array<{ id: string; from: { x: number; y: number }; to: { x: number; y: number } }>;
  }, [edges, nodes]);

  const drawMode =
    tool === "polygon" || tool === "rectangle" || tool === "line" || tool === "point" ? tool : null;

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/indoor-map"
            className="inline-flex h-8 items-center gap-1 rounded-md px-3 text-sm text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div>
            <h1 className="text-lg font-bold text-kiosk-navy">
              {initial.building.nameEn} · {floor.labelEn}
            </h1>
            <p className="text-xs text-gray-500">
              Digitize on the uploaded plan · {floor.widthPx.toFixed(0)}×{floor.heightPx.toFixed(0)}px ·{" "}
              {floor.isPublished ? "Published" : "Draft"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border bg-white px-3 py-2 text-sm">
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload plan"}
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.svg,.webp,.pdf,image/*,application/pdf"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadPlan(f);
              }}
            />
          </label>
          {asset && (
            <Button variant="outline" size="sm" onClick={toggleLock} disabled={pending}>
              {asset.locked ? <Lock className="mr-1 h-4 w-4" /> : <LockOpen className="mr-1 h-4 w-4" />}
              {asset.locked ? "Unlock" : "Lock"} reference
            </Button>
          )}
          {floor.isPublished ? (
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await unpublishIndoorFloor(floor.id);
                  if (!r.success) toast.error(r.error);
                  else {
                    setFloor((f) => ({ ...f, isPublished: false }));
                    toast.success("Unpublished");
                  }
                })
              }
            >
              Unpublish
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={pending || !asset}
              onClick={() =>
                startTransition(async () => {
                  const r = await publishIndoorFloor(floor.id);
                  if (!r.success) toast.error(r.error);
                  else {
                    setFloor((f) => ({ ...f, isPublished: true }));
                    toast.success("Published to kiosk");
                  }
                })
              }
            >
              <Route className="mr-1 h-4 w-4" /> Publish
            </Button>
          )}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[56px_1fr_300px]">
        <aside className="flex flex-col gap-1 rounded-xl border bg-white p-1.5 shadow-sm">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                title={t.label}
                onClick={() => setTool(t.id)}
                className={cn(
                  "flex h-10 w-full items-center justify-center rounded-lg transition",
                  tool === t.id ? "bg-kiosk-navy text-white" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
          <div className="my-1 border-t" />
          {(["reference", "rooms", "nav"] as const).map((layer) => (
            <button
              key={layer}
              type="button"
              title={`Toggle ${layer}`}
              onClick={() => toggleLayer(layer)}
              className="flex h-9 w-full items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {layerVisibility[layer] ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          ))}
        </aside>

        <div className="relative min-h-[420px] overflow-hidden rounded-xl border shadow-sm">
          {!asset ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-900 p-8 text-center text-white">
              <Upload className="h-10 w-10 text-teal-300" />
              <p className="max-w-md text-sm text-white/80">
                Upload the official floor plan (PNG, JPG, SVG, WebP, or PDF). Digitize rooms and paths on top of that image — do not invent geometry.
              </p>
            </div>
          ) : (
            <LeafletPlanMap
              widthPx={floor.widthPx}
              heightPx={floor.heightPx}
              imageUrl={layerVisibility.reference ? asset.url : null}
              imageOpacity={floor.opacity}
              imageLocked={asset.locked}
              rooms={layerVisibility.rooms ? rooms.map((r) => ({
                id: r.id,
                name: r.nameEn,
                geometryJson: r.geometryJson,
                selected: selectedId === r.id && selectedKind === "room",
              })) : []}
              nodes={layerVisibility.nav ? nodes.map((n) => ({
                id: n.id,
                x: n.x,
                y: n.y,
                type: n.type,
                label: n.label,
                selected: selectedId === n.id && selectedKind === "node",
              })) : []}
              edges={layerVisibility.nav ? edgeViews : []}
              drawMode={drawMode}
              onRoomClick={(id) => {
                setSelected(id, "room");
                setTool("select");
              }}
              onNodeClick={onNodeClick}
              onPolygonComplete={onPolygonComplete}
              onPointComplete={onPointComplete}
              onLineComplete={onLineComplete}
              className="h-full min-h-[420px]"
            />
          )}
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/55 px-2.5 py-1.5 text-[11px] text-white">
            {tool === "polygon" && "Click corners · double-click to finish room"}
            {tool === "rectangle" && "Click two opposite corners"}
            {tool === "point" && "Click to place navigation node"}
            {tool === "line" && "Click two points for hallway line"}
            {tool === "connect" && (connectFromId ? "Click destination node" : "Click start node")}
            {tool === "select" && "Select rooms or nodes · Del to remove"}
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-xl border bg-white p-3 shadow-sm">
          <div className="space-y-1.5">
            <Label>Reference opacity</Label>
            <input
              type="range"
              min={0.15}
              max={1}
              step={0.05}
              value={floor.opacity}
              onChange={(e) => onOpacity(Number(e.target.value))}
              className="w-full"
              disabled={!asset}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Meters per pixel</Label>
            <Input
              type="number"
              step="0.001"
              value={floor.metersPerPixel}
              onChange={(e) => {
                const v = Number(e.target.value) || 0.05;
                setFloor((f) => ({ ...f, metersPerPixel: v }));
              }}
              onBlur={() =>
                startTransition(async () => {
                  await updateIndoorFloorSettings(floor.id, { metersPerPixel: floor.metersPerPixel });
                })
              }
            />
          </div>

          {selectedKind === "room" && selectedRoom ? (
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Room properties</p>
              <div className="space-y-1"><Label>Name</Label><Input value={roomForm.nameEn} onChange={(e) => setRoomForm((f) => ({ ...f, nameEn: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Room number</Label><Input value={roomForm.roomNumber} onChange={(e) => setRoomForm((f) => ({ ...f, roomNumber: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Department</Label><Input value={roomForm.department} onChange={(e) => setRoomForm((f) => ({ ...f, department: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Category</Label><Input value={roomForm.category} onChange={(e) => setRoomForm((f) => ({ ...f, category: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Accessibility</Label><Input value={roomForm.accessibility} onChange={(e) => setRoomForm((f) => ({ ...f, accessibility: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Capacity</Label><Input value={roomForm.capacity} onChange={(e) => setRoomForm((f) => ({ ...f, capacity: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Hours</Label><Input value={roomForm.hoursEn} onChange={(e) => setRoomForm((f) => ({ ...f, hoursEn: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Description</Label><Textarea rows={3} value={roomForm.descriptionEn} onChange={(e) => setRoomForm((f) => ({ ...f, descriptionEn: e.target.value }))} /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveRoomMeta} disabled={pending}><Save className="mr-1 h-3.5 w-3.5" /> Save</Button>
                <Button size="sm" variant="destructive" onClick={() => removeRoom(selectedRoom.id)} disabled={pending}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ) : selectedKind === "node" && selectedNode ? (
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Nav node</p>
              <p className="text-sm font-medium">{selectedNode.label || selectedNode.id}</p>
              <p className="text-xs text-gray-500">
                {selectedNode.type} · ({selectedNode.x.toFixed(1)}, {selectedNode.y.toFixed(1)})
              </p>
              <Label>Type</Label>
              <select
                className="h-9 w-full rounded-md border px-2 text-sm"
                value={selectedNode.type}
                onChange={(e) => {
                  const type = e.target.value;
                  startTransition(async () => {
                    await upsertIndoorNavNode({
                      id: selectedNode.id,
                      floorId: selectedNode.floorId,
                      type,
                      x: selectedNode.x,
                      y: selectedNode.y,
                      label: selectedNode.label ?? undefined,
                      roomId: selectedNode.roomId,
                      wheelchairAccessible: selectedNode.wheelchairAccessible,
                    });
                    setNodes((n) => n.map((x) => (x.id === selectedNode.id ? { ...x, type } : x)));
                  });
                }}
              >
                {["intersection", "room", "elevator", "staircase", "entrance", "facility", "emergency_exit", "landmark"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <Label>Link room</Label>
              <select
                className="h-9 w-full rounded-md border px-2 text-sm"
                value={selectedNode.roomId ?? ""}
                onChange={(e) => {
                  const roomId = e.target.value || null;
                  startTransition(async () => {
                    await upsertIndoorNavNode({
                      id: selectedNode.id,
                      floorId: selectedNode.floorId,
                      type: selectedNode.type,
                      x: selectedNode.x,
                      y: selectedNode.y,
                      label: selectedNode.label ?? undefined,
                      roomId,
                      wheelchairAccessible: selectedNode.wheelchairAccessible,
                    });
                    setNodes((n) => n.map((x) => (x.id === selectedNode.id ? { ...x, roomId } : x)));
                  });
                }}
              >
                <option value="">None</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.nameEn}</option>
                ))}
              </select>
              <Button size="sm" variant="destructive" onClick={() => removeNode(selectedNode.id)} disabled={pending}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete node
              </Button>
            </div>
          ) : (
            <div className="border-t pt-3 text-sm text-gray-500">
              <p className="font-medium text-slate-700">Layers</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>{rooms.length} rooms</li>
                <li>{amenities.length} amenities / hallways</li>
                <li>{nodes.length} nav nodes · {edges.length} edges</li>
              </ul>
              <p className="mt-3 text-xs leading-relaxed">
                <strong>1.</strong> Trace rooms from the plan.{" "}
                <strong>2.</strong> Place corridor / door / stair / elevator nodes.{" "}
                <strong>3.</strong> Connect nodes with edges.{" "}
                <strong>4.</strong> Publish — Building Directory uses Leaflet + A* on this floor.
              </p>
            </div>
          )}

          {selectedKind === "edge" && selectedId && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                startTransition(async () => {
                  await deleteIndoorNavEdge(selectedId);
                  setEdges((e) => e.filter((x) => x.id !== selectedId));
                })
              }
            >
              Delete edge
            </Button>
          )}

          {amenities.length > 0 && (
            <div className="border-t pt-3">
              <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Amenities</p>
              <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
                {amenities.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{a.kind}{a.label ? ` · ${a.label}` : ""}</span>
                    <button
                      type="button"
                      className="text-red-600"
                      onClick={() =>
                        startTransition(async () => {
                          await deleteIndoorAmenity(a.id);
                          setAmenities((list) => list.filter((x) => x.id !== a.id));
                        })
                      }
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
