"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { ConfirmDialog, type ConfirmRequest } from "@/components/admin/admin-dialogs";
import {
  attachFloorPlanAsset,
  connectIndoorNavNodes,
  deleteIndoorAmenity,
  deleteIndoorFloor,
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
  { id: "select", label: "Select (V)", icon: MousePointer2 },
  { id: "polygon", label: "Draw room outline (P)", icon: Pentagon },
  { id: "rectangle", label: "Draw rectangular room (R)", icon: Square },
  { id: "point", label: "Place path point (N)", icon: Circle },
  { id: "line", label: "Draw hallway line", icon: Minus },
  { id: "connect", label: "Connect path points (C)", icon: Link2 },
];

const LAYER_NAMES = { reference: "floor plan", rooms: "rooms", nav: "paths" } as const;

const NODE_TYPES: Array<{ value: string; label: string }> = [
  { value: "intersection", label: "Hallway point" },
  { value: "room", label: "Room door" },
  { value: "entrance", label: "Building entrance" },
  { value: "staircase", label: "Stairs" },
  { value: "elevator", label: "Elevator" },
  { value: "facility", label: "Facility" },
  { value: "emergency_exit", label: "Emergency exit" },
  { value: "landmark", label: "Landmark" },
];

export function FloorEditorClient({ initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const [floor, setFloor] = useState(initial.floor);
  const [assets, setAssets] = useState(initial.assets);
  const [rooms, setRooms] = useState<IndoorRoomRow[]>(initial.rooms);
  const [amenities, setAmenities] = useState<IndoorAmenityRow[]>(initial.amenities);
  const [nodes, setNodes] = useState<IndoorNavNodeRow[]>(initial.nodes);
  const [edges, setEdges] = useState<IndoorNavEdgeRow[]>(initial.edges);
  const [uploading, setUploading] = useState(false);
  const [scaleText, setScaleText] = useState(String(initial.floor.metersPerPixel));

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
    setSelected(null, null);
    setConnectFrom(null);
  }, [initial.floor.id, setSelected, setConnectFrom]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        confirmRequest ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        target?.closest("input, textarea, select, [contenteditable], [role='dialog'], [role='alertdialog']")
      ) {
        return;
      }
      if (e.key === "v" || e.key === "V") setTool("select");
      if (e.key === "p" || e.key === "P") setTool("polygon");
      if (e.key === "r" || e.key === "R") setTool("rectangle");
      if (e.key === "n" || e.key === "N") setTool("point");
      if (e.key === "c" || e.key === "C") setTool("connect");
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedRoom && selectedKind === "room") askRemoveRoom(selectedRoom);
        if (selectedNode && selectedKind === "node") askRemoveNode(selectedNode);
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
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        fileUrl?: string;
        mimeType?: string;
        originalName?: string;
        widthPx?: number;
        heightPx?: number;
      };
      if (!res.ok || !json.success || !json.fileUrl) {
        toast.error(json.error ?? "The floor plan could not be uploaded. Please try again.");
        return;
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
    } catch {
      toast.error("The floor plan could not be uploaded. Check the connection and try again.");
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

  const saveFloorSettings = (data: { opacity?: number; metersPerPixel?: number }) => {
    startTransition(async () => {
      const result = await updateIndoorFloorSettings(floor.id, data);
      if (!result.success) toast.error(result.error);
    });
  };

  const removeFloor = () => {
    startTransition(async () => {
      const result = await deleteIndoorFloor(floor.id);
      if (!result.success) {
        setConfirmRequest(null);
        toast.error(result.error);
        return;
      }
      toast.success("Floor deleted");
      router.push("/admin/indoor-map");
      router.refresh();
    });
  };

  const askRemoveFloor = () =>
    setConfirmRequest({
      title: `Delete ${floor.labelEn}?`,
      description:
        "This deletes the floor plan image link, every traced room and every path on this floor. The kiosk stops showing this floor. This cannot be undone.",
      confirmLabel: "Delete floor",
      destructive: true,
      onConfirm: removeFloor,
    });

  const saveRoomMeta = () => {
    if (!selectedRoom) return;
    if (!roomForm.nameEn.trim()) {
      toast.error("Room name is required.");
      return;
    }
    if (roomForm.capacity && !/^\d+$/.test(roomForm.capacity.trim())) {
      toast.error("Capacity must be a whole number.");
      return;
    }
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

  /** Runs the action behind a confirmation dialog and closes the dialog whatever the outcome. */
  const runConfirmed = (
    action: () => Promise<{ success: true } | { success: false; error: string }>,
    onDone: () => void,
    message: string
  ) => {
    startTransition(async () => {
      const result = await action();
      setConfirmRequest(null);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      onDone();
      toast.success(message);
    });
  };

  const askRemoveRoom = (room: IndoorRoomRow) =>
    setConfirmRequest({
      title: `Delete ${room.nameEn || "this room"}?`,
      description: "The room outline and its details are removed from this floor. Path points linked to it stay but lose the link.",
      confirmLabel: "Delete room",
      destructive: true,
      onConfirm: () =>
        runConfirmed(
          () => deleteIndoorRoom(room.id),
          () => {
            setRooms((r) => r.filter((x) => x.id !== room.id));
            setNodes((n) => n.map((x) => (x.roomId === room.id ? { ...x, roomId: null } : x)));
            setSelected(null, null);
          },
          "Room deleted"
        ),
    });

  const askRemoveNode = (node: IndoorNavNodeRow) =>
    setConfirmRequest({
      title: node.label ? `Delete path point ${node.label}?` : "Delete this path point?",
      description: "The point and every connection to it are removed, so routes through it will no longer work.",
      confirmLabel: "Delete point",
      destructive: true,
      onConfirm: () =>
        runConfirmed(
          () => deleteIndoorNavNode(node.id),
          () => {
            setNodes((n) => n.filter((x) => x.id !== node.id));
            setEdges((e) => e.filter((x) => x.fromNodeId !== node.id && x.toNodeId !== node.id));
            setSelected(null, null);
          },
          "Path point deleted"
        ),
    });

  const askRemoveEdge = (edge: IndoorNavEdgeRow, otherName: string) =>
    setConfirmRequest({
      title: "Remove this connection?",
      description: `Visitors will no longer be routed directly between this point and ${otherName}.`,
      confirmLabel: "Remove connection",
      destructive: true,
      onConfirm: () =>
        runConfirmed(
          () => deleteIndoorNavEdge(edge.id),
          () => setEdges((e) => e.filter((x) => x.id !== edge.id)),
          "Connection removed"
        ),
    });

  const askRemoveAmenity = (amenity: IndoorAmenityRow) =>
    setConfirmRequest({
      title: `Remove ${amenity.label || amenity.kind}?`,
      description: "The line is removed from this floor plan.",
      confirmLabel: "Remove",
      destructive: true,
      onConfirm: () =>
        runConfirmed(
          () => deleteIndoorAmenity(amenity.id),
          () => setAmenities((list) => list.filter((x) => x.id !== amenity.id)),
          "Hallway line removed"
        ),
    });

  const updateNode = (node: IndoorNavNodeRow, changes: Partial<Pick<IndoorNavNodeRow, "type" | "roomId">>) => {
    const next = { ...node, ...changes };
    startTransition(async () => {
      const result = await upsertIndoorNavNode({
        id: next.id,
        floorId: next.floorId,
        type: next.type,
        x: next.x,
        y: next.y,
        label: next.label ?? undefined,
        roomId: next.roomId,
        wheelchairAccessible: next.wheelchairAccessible,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setNodes((n) => n.map((x) => (x.id === node.id ? next : x)));
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
        toast.success("Room added. Fill in its details on the right.");
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
        toast.success("Path point placed");
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
        toast.message("Now click the point to connect to");
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
        toast.success("Points connected");
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

  const selectedEdges = useMemo(() => {
    if (!selectedNode) return [];
    const byId = new Map(nodes.map((n) => [n.id, n]));
    return edges
      .filter((e) => e.fromNodeId === selectedNode.id || e.toNodeId === selectedNode.id)
      .map((edge) => {
        const other = byId.get(edge.fromNodeId === selectedNode.id ? edge.toNodeId : edge.fromNodeId);
        return { edge, otherName: other?.label || "another point" };
      });
  }, [edges, nodes, selectedNode]);

  const drawMode =
    tool === "polygon" || tool === "rectangle" || tool === "line" || tool === "point" ? tool : null;

  return (
    <div className="flex flex-col gap-3 p-4 sm:p-6 lg:h-dvh">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/admin/indoor-map"
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-3 text-sm text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" /> Indoor Map
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-kiosk-navy">
              {initial.building.nameEn} · {floor.labelEn}
            </h1>
            <p className="text-xs text-gray-500">
              Level {floor.levelIndex} · {floor.isPublished ? "Published" : "Not published"}
              {asset ? ` · Plan ${floor.widthPx.toFixed(0)} × ${floor.heightPx.toFixed(0)} px` : " · No floor plan yet"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <label
            className={cn(
              "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border bg-white px-3 text-sm font-medium hover:bg-gray-50",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading…" : asset ? "Replace floor plan" : "Upload floor plan"}
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.svg,.webp,image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void uploadPlan(f);
              }}
            />
          </label>
          {asset && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLock}
              disabled={pending}
              title={asset.locked ? "Allow the plan image to be moved" : "Stop the plan image from moving while you trace"}
            >
              {asset.locked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
              {asset.locked ? "Unlock plan" : "Lock plan"}
            </Button>
          )}
          {floor.isPublished ? (
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() =>
                setConfirmRequest({
                  title: `Unpublish ${floor.labelEn}?`,
                  description: "Visitors will no longer be able to search rooms or get directions on this floor.",
                  confirmLabel: "Unpublish",
                  onConfirm: () =>
                    runConfirmed(
                      () => unpublishIndoorFloor(floor.id),
                      () => setFloor((f) => ({ ...f, isPublished: false })),
                      "Floor unpublished"
                    ),
                })
              }
            >
              Unpublish
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={pending || !asset}
              title={asset ? undefined : "Upload a floor plan first"}
              onClick={() =>
                setConfirmRequest({
                  title: `Publish ${floor.labelEn}?`,
                  description: `The ${rooms.length} traced room${rooms.length === 1 ? "" : "s"} and ${edges.length} path connection${edges.length === 1 ? "" : "s"} on this floor become available for room search and directions on the kiosk.`,
                  confirmLabel: "Publish",
                  onConfirm: () =>
                    runConfirmed(
                      () => publishIndoorFloor(floor.id),
                      () => setFloor((f) => ({ ...f, isPublished: true })),
                      "Floor published"
                    ),
                })
              }
            >
              <Route className="h-4 w-4" /> Publish
            </Button>
          )}
          <Button variant="outline" size="sm" disabled={pending} onClick={askRemoveFloor} className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4" /> Delete floor
          </Button>
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
                aria-label={t.label}
                aria-pressed={tool === t.id}
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
              title={`${layerVisibility[layer] ? "Hide" : "Show"} ${LAYER_NAMES[layer]}`}
              aria-label={`${layerVisibility[layer] ? "Hide" : "Show"} ${LAYER_NAMES[layer]}`}
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
                Upload the official floor plan as a PNG, JPG, SVG or WebP image (save PDF pages as images first), then
                trace rooms and paths on top of it.
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
            {tool === "polygon" && "Click each corner · double-click to finish the room"}
            {tool === "rectangle" && "Click two opposite corners"}
            {tool === "point" && "Click to place a path point"}
            {tool === "line" && "Click two points to draw a hallway line"}
            {tool === "connect" && (connectFromId ? "Click the point to connect to" : "Click the first path point")}
            {tool === "select" && "Click a room or path point to edit it · Delete key removes it"}
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-xl border bg-white p-3 shadow-sm">
          <div className="space-y-1.5">
            <Label htmlFor="floor-plan-opacity">Floor plan visibility</Label>
            <input
              id="floor-plan-opacity"
              type="range"
              min={0.15}
              max={1}
              step={0.05}
              value={floor.opacity}
              onChange={(e) => setFloor((f) => ({ ...f, opacity: Number(e.target.value) }))}
              onPointerUp={() => saveFloorSettings({ opacity: floor.opacity })}
              onKeyUp={() => saveFloorSettings({ opacity: floor.opacity })}
              className="w-full"
              disabled={!asset}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="floor-meters-per-pixel">Scale (meters per pixel)</Label>
            <Input
              id="floor-meters-per-pixel"
              type="number"
              step="0.001"
              min="0.001"
              value={scaleText}
              onChange={(e) => setScaleText(e.target.value)}
              onBlur={() => {
                const v = Number(scaleText);
                if (!(v > 0)) {
                  toast.error("Scale must be a number greater than 0.");
                  setScaleText(String(floor.metersPerPixel));
                  return;
                }
                if (v === floor.metersPerPixel) return;
                setFloor((f) => ({ ...f, metersPerPixel: v }));
                saveFloorSettings({ metersPerPixel: v });
              }}
            />
            <p className="text-xs text-gray-500">Used to estimate walking distance and time.</p>
          </div>

          {selectedKind === "room" && selectedRoom ? (
            <form
              className="space-y-2 border-t pt-3"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                saveRoomMeta();
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Room details</p>
              {(
                [
                  ["nameEn", "Name"],
                  ["roomNumber", "Room number"],
                  ["department", "Office or department"],
                  ["category", "Category"],
                  ["accessibility", "Accessibility"],
                  ["capacity", "Capacity (people)"],
                  ["hoursEn", "Office hours"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={`room-${key}`}>{label}</Label>
                  <Input
                    id={`room-${key}`}
                    inputMode={key === "capacity" ? "numeric" : undefined}
                    value={roomForm[key]}
                    onChange={(e) => setRoomForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="space-y-1">
                <Label htmlFor="room-descriptionEn">Description</Label>
                <Textarea
                  id="room-descriptionEn"
                  rows={3}
                  value={roomForm.descriptionEn}
                  onChange={(e) => setRoomForm((f) => ({ ...f, descriptionEn: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={pending}>
                  <Save className="h-3.5 w-3.5" /> Save room
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => askRemoveRoom(selectedRoom)}
                  disabled={pending}
                  aria-label="Delete room"
                  title="Delete room"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </form>
          ) : selectedKind === "node" && selectedNode ? (
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Path point</p>
              <p className="text-sm font-medium">{selectedNode.label || "Unnamed point"}</p>
              <div className="space-y-1">
                <Label htmlFor="node-type">Type</Label>
                <select
                  id="node-type"
                  className="h-9 w-full rounded-lg border border-input bg-white px-2 text-sm"
                  value={selectedNode.type}
                  disabled={pending}
                  onChange={(e) => updateNode(selectedNode, { type: e.target.value })}
                >
                  {NODE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="node-room">Leads to room</Label>
                <select
                  id="node-room"
                  className="h-9 w-full rounded-lg border border-input bg-white px-2 text-sm"
                  value={selectedNode.roomId ?? ""}
                  disabled={pending}
                  onChange={(e) => updateNode(selectedNode, { roomId: e.target.value || null })}
                >
                  <option value="">None</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-700">Connections</p>
                {selectedEdges.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    Not connected yet. Use the connect tool to link this point to the next one along the hallway.
                  </p>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {selectedEdges.map(({ edge, otherName }) => (
                      <li key={edge.id} className="flex items-center justify-between gap-2 rounded-md bg-gray-50 px-2 py-1.5">
                        <span className="truncate">
                          To {otherName} · {edge.distanceMeters.toFixed(1)} m
                        </span>
                        <button
                          type="button"
                          className="shrink-0 font-medium text-red-600 hover:underline disabled:opacity-50"
                          disabled={pending}
                          onClick={() => askRemoveEdge(edge, otherName)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Button size="sm" variant="destructive" onClick={() => askRemoveNode(selectedNode)} disabled={pending}>
                <Trash2 className="h-3.5 w-3.5" /> Delete point
              </Button>
            </div>
          ) : (
            <div className="border-t pt-3 text-sm text-gray-500">
              <p className="font-medium text-slate-700">On this floor</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>
                  {rooms.length} room{rooms.length === 1 ? "" : "s"}
                </li>
                <li>
                  {amenities.length} hallway line{amenities.length === 1 ? "" : "s"}
                </li>
                <li>
                  {nodes.length} path point{nodes.length === 1 ? "" : "s"} · {edges.length} connection
                  {edges.length === 1 ? "" : "s"}
                </li>
              </ul>
              <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs leading-relaxed">
                <li>Trace each room on the floor plan.</li>
                <li>Place path points at hallways, doors, stairs and elevators.</li>
                <li>Connect neighbouring points so routes can be found.</li>
                <li>Publish the floor.</li>
              </ol>
            </div>
          )}

          {amenities.length > 0 && (
            <div className="border-t pt-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Hallway lines</p>
              <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
                {amenities.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{a.label || a.kind}</span>
                    <button
                      type="button"
                      className="shrink-0 font-medium text-red-600 hover:underline disabled:opacity-50"
                      disabled={pending}
                      onClick={() => askRemoveAmenity(a)}
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

      <ConfirmDialog request={confirmRequest} pending={pending} onCancel={() => setConfirmRequest(null)} />
    </div>
  );
}
