import type { AttractionCategory } from "./types";

export type CategoryMeta = {
  id: AttractionCategory;
  labelEn: string;
  labelFil: string;
  labelBis: string;
  /** Shown in filter chips even when empty */
  filterable: boolean;
  legend: boolean;
  color: string;
};

export const ATTRACTION_CATEGORIES: CategoryMeta[] = [
  { id: "beach", labelEn: "Beaches", labelFil: "Mga Beach", labelBis: "Mga Beach", filterable: true, legend: true, color: "#0ea5e9" },
  { id: "falls", labelEn: "Falls", labelFil: "Mga Talon", labelBis: "Mga Busay", filterable: true, legend: true, color: "#14b8a6" },
  { id: "volcano", labelEn: "Volcano", labelFil: "Bulkan", labelBis: "Bulkan", filterable: true, legend: true, color: "#ef4444" },
  { id: "hot_spring", labelEn: "Hot Springs", labelFil: "Mainit na Bukal", labelBis: "Init nga Tubod", filterable: true, legend: true, color: "#f97316" },
  { id: "cold_spring", labelEn: "Cold Springs", labelFil: "Malamig na Bukal", labelBis: "Bugnaw nga Tubod", filterable: true, legend: true, color: "#38bdf8" },
  { id: "marine", labelEn: "Marine Sanctuary", labelFil: "Marine Sanctuary", labelBis: "Marine Sanctuary", filterable: true, legend: true, color: "#06b6d4" },
  { id: "port", labelEn: "Ports", labelFil: "Mga Pantalan", labelBis: "Mga Pantalan", filterable: true, legend: true, color: "#6366f1" },
  { id: "church", labelEn: "Church / Ruins", labelFil: "Simbahan / Guho", labelBis: "Simbahan / Guba", filterable: true, legend: true, color: "#a855f7" },
  { id: "landmark", labelEn: "Tourist Attractions", labelFil: "Mga Attraksiyon", labelBis: "Mga Attraksyon", filterable: true, legend: true, color: "#0f766e" },
  { id: "village", labelEn: "Eco Village", labelFil: "Eco Village", labelBis: "Eco Village", filterable: true, legend: false, color: "#65a30d" },
  { id: "restaurant", labelEn: "Restaurants", labelFil: "Mga Restawran", labelBis: "Mga Restawran", filterable: true, legend: false, color: "#eab308" },
  { id: "hotel", labelEn: "Hotels", labelFil: "Mga Hotel", labelBis: "Mga Hotel", filterable: true, legend: false, color: "#64748b" },
  { id: "hospital", labelEn: "Hospitals", labelFil: "Mga Ospital", labelBis: "Mga Ospital", filterable: true, legend: true, color: "#dc2626" },
];

export function categoryMeta(id: AttractionCategory) {
  return ATTRACTION_CATEGORIES.find((c) => c.id === id);
}
