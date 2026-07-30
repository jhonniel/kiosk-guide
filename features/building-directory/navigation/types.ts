import type { Language } from "@/lib/i18n/translations";

export type NavNodeType =
  | "entrance"
  | "intersection"
  | "landmark"
  | "elevator"
  | "staircase"
  | "room"
  | "facility"
  | "emergency_exit";

export interface NavNode {
  id: string;
  floor: number;
  x: number;
  y: number;
  type: NavNodeType;
  label: string;
  locationId?: string;
  landmark?: boolean;
  wheelchairAccessible?: boolean;
}

export interface NavEdge {
  from: string;
  to: string;
  distanceMeters: number;
  wheelchairAccessible: boolean;
  restricted?: boolean;
  vertical?: boolean;
  instruction?: string;
}

export interface FloorPlanConfig {
  floor: number;
  label: string;
  width: number;
  height: number;
  hallways: Array<{ x: number; y: number; width: number; height: number }>;
  /** Uploaded floor-plan image (PNG/JPG) shown as a textured slab in the 3D viewer. */
  imageUrl?: string;
}

export interface NavigationSegment {
  floor: number;
  nodeIds: string[];
  points: Array<{ x: number; y: number }>;
  distanceMeters: number;
  instructions: string[];
}

export interface NavigationRoute {
  fromNodeId: string;
  toNodeId: string;
  toLocationId: string;
  destinationName: string;
  segments: NavigationSegment[];
  totalDistanceMeters: number;
  estimatedMinutes: number;
  voiceInstructions: string[];
  floorChanges: number[];
  isDemoMode: boolean;
  usesGraph: boolean;
}

export type NavigationStatus =
  | "idle"
  | "navigating"
  | "paused"
  | "arrived"
  | "error";

export interface NavigationState {
  status: NavigationStatus;
  route: NavigationRoute | null;
  progress: number;
  currentFloor: number;
  currentInstructionIndex: number;
  error?: string;
}

export interface NavigationRequest {
  fromLocationId?: string;
  toLocationId: string;
  accessible?: boolean;
  lang?: Language;
}

export interface NavigationResponse {
  success: boolean;
  route?: NavigationRoute;
  textOnly?: boolean;
  textDirections?: string[];
  error?: string;
  errorReason?: string;
  isDemoMode: boolean;
}

export interface NavigationGraph {
  nodes: NavNode[];
  edges: NavEdge[];
  floorPlans: FloorPlanConfig[];
  defaultStartLocationId: string;
}
