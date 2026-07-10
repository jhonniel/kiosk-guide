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
  /** Opens building directory with this search to start indoor navigation */
  navigationQuery?: string;
}
