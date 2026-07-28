/** Shared map admin types (safe for client + server imports). */

export type MapPhotoAdminRow = {
  id: string;
  url: string;
  caption: string | null;
  sortOrder: number;
};

export type MapAttractionAdminRow = {
  id: string;
  slug: string;
  nameEn: string;
  nameFil: string;
  nameBis: string | null;
  descriptionEn: string;
  descriptionFil: string;
  descriptionBis: string | null;
  historyEn: string | null;
  historyFil: string | null;
  historyBis: string | null;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  municipalityId: string | null;
  mapX: number;
  mapY: number;
  latitude: number;
  longitude: number;
  coverImage: string | null;
  entranceFeeEn: string | null;
  entranceFeeFil: string | null;
  entranceFeeBis: string | null;
  openingHoursEn: string | null;
  openingHoursFil: string | null;
  openingHoursBis: string | null;
  travelTipsEn: string | null;
  travelTipsFil: string | null;
  travelTipsBis: string | null;
  travelTimeEn: string | null;
  travelTimeFil: string | null;
  travelTimeBis: string | null;
  distanceFromCapitolEn: string | null;
  distanceFromCapitolFil: string | null;
  distanceFromCapitolBis: string | null;
  phone: string | null;
  website: string | null;
  rating: number;
  labelText: string | null;
  labelDx: number | null;
  labelDy: number | null;
  labelSide: string | null;
  featured: boolean;
  isActive: boolean;
  sortOrder: number;
  photos: MapPhotoAdminRow[];
};

export type MapCategoryAdminOption = {
  id: string;
  slug: string;
  nameEn: string;
  nameFil: string;
  nameBis: string | null;
  color: string;
  icon: string | null;
  sortOrder: number;
  showInFilter: boolean;
  showInLegend: boolean;
  attractionCount: number;
};

export type MapAnnotationAdminRow = {
  id: string;
  slug: string;
  text: string;
  kind: string;
  mapX: number;
  mapY: number;
  fontSize: number | null;
  anchor: string | null;
  infoEn: string | null;
  infoFil: string | null;
  infoBis: string | null;
  skipIfAttractionSlug: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type MapRouteAdminRow = {
  id: string;
  slug: string;
  nameEn: string;
  nameFil: string;
  nameBis: string | null;
  kind: string;
  fromId: string;
  toId: string;
  fromSlug: string;
  toSlug: string;
  fromName: string;
  toName: string;
  points: Array<{ x: number; y: number }>;
  travelTimeEn: string | null;
  travelTimeFil: string | null;
  travelTimeBis: string | null;
  distanceKm: number | null;
  isActive: boolean;
};

export type MapPlaceAdminRow = {
  id: string;
  slug: string;
  nameEn: string;
  nameFil: string;
  nameBis: string | null;
  descriptionEn: string | null;
  descriptionFil: string | null;
  descriptionBis: string | null;
  coverImage: string | null;
  phone: string | null;
  website: string | null;
  openingHoursEn: string | null;
  openingHoursFil: string | null;
  openingHoursBis: string | null;
  addressEn: string | null;
  mapX: number;
  mapY: number;
  rating: number;
  isActive: boolean;
  sortOrder: number;
};

export type MapMunicipalityAdminRow = {
  id: string;
  slug: string;
  nameEn: string;
  nameFil: string;
  nameBis: string | null;
  description: string | null;
  labelX: number;
  labelY: number;
  fillColor: string;
  sortOrder: number;
};

export type MapAttractionWriteInput = {
  slug?: string;
  nameEn: string;
  nameFil: string;
  nameBis?: string | null;
  descriptionEn: string;
  descriptionFil: string;
  descriptionBis?: string | null;
  historyEn?: string | null;
  historyFil?: string | null;
  historyBis?: string | null;
  categoryId: string;
  municipalityId?: string | null;
  coverImage?: string | null;
  entranceFeeEn?: string | null;
  entranceFeeFil?: string | null;
  entranceFeeBis?: string | null;
  openingHoursEn?: string | null;
  openingHoursFil?: string | null;
  openingHoursBis?: string | null;
  travelTipsEn?: string | null;
  travelTipsFil?: string | null;
  travelTipsBis?: string | null;
  travelTimeEn?: string | null;
  travelTimeFil?: string | null;
  travelTimeBis?: string | null;
  distanceFromCapitolEn?: string | null;
  distanceFromCapitolFil?: string | null;
  distanceFromCapitolBis?: string | null;
  phone?: string | null;
  website?: string | null;
  rating?: number;
  labelText?: string | null;
  labelDx?: number | null;
  labelDy?: number | null;
  labelSide?: string | null;
  featured?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  mapX?: number;
  mapY?: number;
};

export type MapAnnotationWriteInput = {
  slug?: string;
  text: string;
  kind: string;
  mapX?: number;
  mapY?: number;
  fontSize?: number | null;
  anchor?: string | null;
  infoEn?: string | null;
  infoFil?: string | null;
  infoBis?: string | null;
  skipIfAttractionSlug?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type MapRouteWriteInput = {
  slug?: string;
  nameEn: string;
  nameFil?: string;
  nameBis?: string | null;
  kind: "road" | "boat";
  fromId: string;
  toId: string;
  points: Array<{ x: number; y: number }>;
  travelTimeEn?: string | null;
  travelTimeFil?: string | null;
  travelTimeBis?: string | null;
  distanceKm?: number | null;
  isActive?: boolean;
};

export type MapPlaceWriteInput = {
  slug?: string;
  nameEn: string;
  nameFil?: string;
  nameBis?: string | null;
  descriptionEn?: string | null;
  descriptionFil?: string | null;
  descriptionBis?: string | null;
  coverImage?: string | null;
  phone?: string | null;
  website?: string | null;
  openingHoursEn?: string | null;
  openingHoursFil?: string | null;
  openingHoursBis?: string | null;
  addressEn?: string | null;
  mapX?: number;
  mapY?: number;
  rating?: number;
  isActive?: boolean;
  sortOrder?: number;
};

export type MapCategoryWriteInput = {
  slug?: string;
  nameEn: string;
  nameFil?: string;
  nameBis?: string | null;
  color: string;
  icon?: string | null;
  sortOrder?: number;
  showInFilter?: boolean;
  showInLegend?: boolean;
};

export type MapMunicipalityWriteInput = {
  nameEn: string;
  nameFil?: string;
  nameBis?: string | null;
  description?: string | null;
  labelX?: number;
  labelY?: number;
};
