export type AttractionCategory =
  | "beach"
  | "falls"
  | "volcano"
  | "hot_spring"
  | "cold_spring"
  | "marine"
  | "port"
  | "church"
  | "landmark"
  | "village"
  | "restaurant"
  | "hotel"
  | "hospital";

export type LocalizedString = {
  en: string;
  fil: string;
  bis: string;
};

export type Attraction = {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  category: AttractionCategory;
  /** Percent position on illustrated map (0–100) */
  x: number;
  y: number;
  /** Optional SVG path in viewBox 0 0 100 100 for hit region */
  region?: string;
  photos: string[];
  openingHours: LocalizedString;
  entranceFee: LocalizedString;
  rating: number;
  travelTips: LocalizedString;
  travelTime: LocalizedString;
  distanceFromCapitol: LocalizedString;
};

export type MapRouteKind = "road" | "boat";

export type MapRoute = {
  id: string;
  fromId: string;
  toId: string;
  kind: MapRouteKind;
  /** Polyline points as percent coords */
  points: Array<{ x: number; y: number }>;
  travelTime: LocalizedString;
};

/** Legacy marker type kept for offline helpers that may still reference it */
export type MapMarkerKind = "office" | "landmark" | "municipality";

export interface MapMarker {
  id: string;
  kind: MapMarkerKind;
  nameEn: string;
  nameFil?: string;
  nameBis?: string;
  descriptionEn?: string;
  descriptionFil?: string;
  descriptionBis?: string;
  locationEn: string;
  locationFil?: string;
  locationBis?: string;
  x: number;
  y: number;
  department?: string;
  headName?: string;
  contactNumber?: string;
  email?: string;
  building?: string;
  floor?: string;
  room?: string;
  navigationQuery?: string;
}
