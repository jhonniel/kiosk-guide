export type LocationType = "room" | "facility";

export interface BuildingLocationData {
  id: string;
  buildingNameEn: string;
  buildingNameFil?: string;
  buildingNameBis?: string;
  nameEn: string;
  nameFil?: string;
  nameBis?: string;
  floor: number;
  floorLabelEn: string;
  floorLabelFil?: string;
  floorLabelBis?: string;
  room?: string;
  locationType: LocationType;
  category?: string;
  nearbyLandmarks: string[];
  directionsEn: string[];
  directionsFil?: string[];
  directionsBis?: string[];
  aliases?: string[];
}

export type GuideResponseType =
  | "found"
  | "multiple"
  | "not_found"
  | "restroom"
  | "emergency"
  | "demo_notice";

export interface GuideResponse {
  type: GuideResponseType;
  isDemoMode: boolean;
  buildingName: string;
  query: string;
  message: string;
  location?: {
    id?: string;
    name: string;
    room?: string;
    floor: string;
    nearbyLandmarks: string[];
  };
  directions?: string[];
  matches?: Array<{ id: string; name: string; room?: string; floor: string }>;
  suggestions?: string[];
}

export interface GuideContext {
  isDemoMode: boolean;
  buildingName: string;
  locations: BuildingLocationData[];
  demoNotice?: string;
  missingLocationMessage?: string;
}
