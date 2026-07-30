/** Shared types for indoor map (plan-space CRS). */

export type GeoJsonGeometry =
  | { type: "Point"; coordinates: [number, number] }
  | { type: "LineString"; coordinates: [number, number][] }
  | { type: "Polygon"; coordinates: [number, number][][] }
  | { type: "MultiPolygon"; coordinates: [number, number][][][] };

export type AmenityKind =
  | "door"
  | "window"
  | "stair"
  | "elevator"
  | "restroom"
  | "exit"
  | "extinguisher"
  | "ramp"
  | "parking"
  | "poi"
  | "hallway"
  | "outline";

export type NavNodeType =
  | "entrance"
  | "intersection"
  | "landmark"
  | "elevator"
  | "staircase"
  | "room"
  | "facility"
  | "emergency_exit";

export type EditorTool =
  | "select"
  | "pan"
  | "polygon"
  | "rectangle"
  | "line"
  | "point"
  | "text"
  | "measure"
  | "connect";

export type IndoorLayerId =
  | "reference"
  | "outline"
  | "rooms"
  | "hallways"
  | "amenities"
  | "nav"
  | "labels";

export type IndoorBuildingSummary = {
  id: string;
  slug: string;
  nameEn: string;
  nameFil: string | null;
  nameBis: string | null;
  address: string | null;
  isActive: boolean;
  floorCount: number;
};

export type IndoorFloorSummary = {
  id: string;
  buildingId: string;
  levelIndex: number;
  labelEn: string;
  labelFil: string | null;
  labelBis: string | null;
  widthPx: number;
  heightPx: number;
  metersPerPixel: number;
  opacity: number;
  sortOrder: number;
  isPublished: boolean;
  publishedAt: string | null;
  assetUrl: string | null;
  assetLocked: boolean;
  roomCount: number;
  nodeCount: number;
};

export type IndoorFloorAssetRow = {
  id: string;
  floorId: string;
  kind: string;
  mimeType: string;
  url: string;
  originalName: string;
  locked: boolean;
};

export type IndoorRoomRow = {
  id: string;
  floorId: string;
  roomNumber: string | null;
  nameEn: string;
  nameFil: string | null;
  nameBis: string | null;
  department: string | null;
  descriptionEn: string | null;
  descriptionFil: string | null;
  descriptionBis: string | null;
  capacity: number | null;
  category: string;
  accessibility: string;
  hoursEn: string | null;
  hoursFil: string | null;
  hoursBis: string | null;
  photoUrl: string | null;
  qrPayload: string | null;
  geometryJson: string;
  isActive: boolean;
  sortOrder: number;
};

export type IndoorAmenityRow = {
  id: string;
  floorId: string;
  kind: string;
  label: string | null;
  geometryJson: string;
  propsJson: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type IndoorNavNodeRow = {
  id: string;
  floorId: string;
  type: string;
  x: number;
  y: number;
  label: string | null;
  roomId: string | null;
  wheelchairAccessible: boolean;
};

export type IndoorNavEdgeRow = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  distanceMeters: number;
  wheelchairAccessible: boolean;
  vertical: boolean;
  verticalToFloorId: string | null;
  instruction: string | null;
};

export type IndoorFloorDetail = {
  floor: IndoorFloorSummary;
  building: IndoorBuildingSummary;
  assets: IndoorFloorAssetRow[];
  rooms: IndoorRoomRow[];
  amenities: IndoorAmenityRow[];
  nodes: IndoorNavNodeRow[];
  edges: IndoorNavEdgeRow[];
};

export type IndoorRouteSegment = {
  floorId: string;
  levelIndex: number;
  floorLabel: string;
  nodeIds: string[];
  points: Array<{ x: number; y: number }>;
  distanceMeters: number;
  instructions: string[];
};

export type IndoorRouteResult = {
  fromNodeId: string;
  toNodeId: string;
  destinationRoomId: string | null;
  destinationName: string;
  segments: IndoorRouteSegment[];
  totalDistanceMeters: number;
  estimatedMinutes: number;
  floorChanges: string[];
};

export type PublishedIndoorPayload = {
  buildings: Array<{
    id: string;
    slug: string;
    nameEn: string;
    nameFil: string | null;
    nameBis: string | null;
    floors: Array<{
      id: string;
      levelIndex: number;
      labelEn: string;
      labelFil: string | null;
      labelBis: string | null;
      widthPx: number;
      heightPx: number;
      metersPerPixel: number;
      opacity: number;
      assetUrl: string | null;
      rooms: IndoorRoomRow[];
      amenities: IndoorAmenityRow[];
      nodes: IndoorNavNodeRow[];
      edges: IndoorNavEdgeRow[];
    }>;
  }>;
};
