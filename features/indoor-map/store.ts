import { create } from "zustand";
import type { EditorTool, IndoorLayerId } from "./types";

type HistorySnap = string;

type EditorState = {
  tool: EditorTool;
  snapToGrid: boolean;
  gridSize: number;
  selectedId: string | null;
  selectedKind: "room" | "amenity" | "node" | "edge" | null;
  connectFromId: string | null;
  layerVisibility: Record<IndoorLayerId, boolean>;
  layerLocked: Record<IndoorLayerId, boolean>;
  history: HistorySnap[];
  future: HistorySnap[];
  setTool: (t: EditorTool) => void;
  setSnapToGrid: (v: boolean) => void;
  setSelected: (id: string | null, kind: EditorState["selectedKind"]) => void;
  setConnectFrom: (id: string | null) => void;
  toggleLayer: (id: IndoorLayerId) => void;
  toggleLayerLock: (id: IndoorLayerId) => void;
  pushHistory: (snap: HistorySnap) => void;
  undo: () => HistorySnap | null;
  redo: () => HistorySnap | null;
};

const defaultVisibility: Record<IndoorLayerId, boolean> = {
  reference: true,
  outline: true,
  rooms: true,
  hallways: true,
  amenities: true,
  nav: true,
  labels: true,
};

const defaultLocked: Record<IndoorLayerId, boolean> = {
  reference: false,
  outline: false,
  rooms: false,
  hallways: false,
  amenities: false,
  nav: false,
  labels: false,
};

export const useIndoorEditorStore = create<EditorState>((set, get) => ({
  tool: "select",
  snapToGrid: true,
  gridSize: 10,
  selectedId: null,
  selectedKind: null,
  connectFromId: null,
  layerVisibility: { ...defaultVisibility },
  layerLocked: { ...defaultLocked },
  history: [],
  future: [],
  setTool: (tool) => set({ tool, connectFromId: tool === "connect" ? get().connectFromId : null }),
  setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
  setSelected: (selectedId, selectedKind) => set({ selectedId, selectedKind }),
  setConnectFrom: (connectFromId) => set({ connectFromId }),
  toggleLayer: (id) =>
    set((s) => ({
      layerVisibility: { ...s.layerVisibility, [id]: !s.layerVisibility[id] },
    })),
  toggleLayerLock: (id) =>
    set((s) => ({
      layerLocked: { ...s.layerLocked, [id]: !s.layerLocked[id] },
    })),
  pushHistory: (snap) =>
    set((s) => ({
      history: [...s.history.slice(-49), snap],
      future: [],
    })),
  undo: () => {
    const { history, future } = get();
    if (!history.length) return null;
    const prev = history[history.length - 1]!;
    const rest = history.slice(0, -1);
    set({ history: rest, future: [prev, ...future] });
    return rest[rest.length - 1] ?? null;
  },
  redo: () => {
    const { history, future } = get();
    if (!future.length) return null;
    const next = future[0]!;
    set({ history: [...history, next], future: future.slice(1) });
    return next;
  },
}));
