"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  Bed,
  Building2,
  Home,
  ImageIcon,
  Info,
  Landmark,
  Loader2,
  MapPin,
  Mountain,
  Plus,
  RotateCcw,
  Route,
  Save,
  Settings2,
  Tag,
  Trash2,
  Upload,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { VectorTerrain } from "@/components/kiosk/map/VectorTerrain";
import { WatercolorMapDecor } from "@/components/kiosk/map/WatercolorMapDecor";
import {
  MapTerrainLabels,
  type MapTerrainLabelAnnotation,
  type MapTerrainMunicipalityLabel,
} from "@/components/kiosk/map/MapTerrainLabels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MAP_SPOT_LABELS } from "@/data/map/map-spot-labels";
import { categoryMeta } from "@/features/map/categories";
import type { AttractionCategory } from "@/features/map/types";
import {
  addMapAttractionPhoto,
  createMapAnnotation,
  createMapAttraction,
  createMapCategory,
  createMapHotel,
  createMapRestaurant,
  createMapRoute,
  deleteMapAnnotation,
  deleteMapAttraction,
  deleteMapAttractionPhoto,
  deleteMapCategory,
  deleteMapHotel,
  deleteMapMunicipality,
  deleteMapRestaurant,
  deleteMapRoute,
  resetMapAttractionPosition,
  updateMapAnnotation,
  updateMapAnnotationPosition,
  updateMapAttraction,
  updateMapAttractionPosition,
  updateMapCategory,
  updateMapHotel,
  updateMapHotelPosition,
  updateMapMunicipality,
  updateMapMunicipalityLabelPosition,
  updateMapRestaurant,
  updateMapRestaurantPosition,
  updateMapRoute,
} from "@/features/map/admin-actions";
import type {
  MapAnnotationAdminRow,
  MapAnnotationWriteInput,
  MapAttractionAdminRow,
  MapAttractionWriteInput,
  MapCategoryAdminOption,
  MapCategoryWriteInput,
  MapMunicipalityAdminRow,
  MapMunicipalityWriteInput,
  MapPlaceAdminRow,
  MapPlaceWriteInput,
  MapRouteAdminRow,
  MapRouteWriteInput,
} from "@/features/map/admin-types";

type AdminMode =
  | "attractions"
  | "volcanoes"
  | "barangays"
  | "labels"
  | "routes"
  | "hotels"
  | "restaurants"
  | "categories"
  | "municipalities";

function isAnnotationMode(mode: AdminMode): boolean {
  return mode === "labels" || mode === "volcanoes" || mode === "barangays";
}

function lockedAnnotationKind(mode: AdminMode): string | null {
  if (mode === "volcanoes") return "peak";
  if (mode === "barangays") return "barangay";
  return null;
}

type Props = {
  initialAttractions: MapAttractionAdminRow[];
  categories: MapCategoryAdminOption[];
  annotations: MapAnnotationAdminRow[];
  routes: MapRouteAdminRow[];
  hotels: MapPlaceAdminRow[];
  restaurants: MapPlaceAdminRow[];
  municipalities: MapMunicipalityAdminRow[];
};

type FormTab = "basics" | "details" | "media";
type Lang = "en" | "fil" | "bis";

type ModeConfig = {
  id: AdminMode;
  label: string;
  icon: LucideIcon;
  helper: string;
};

const MODE_GROUPS: { label: string; modes: ModeConfig[] }[] = [
  {
    label: "Places",
    modes: [
      { id: "attractions", label: "Attractions", icon: Landmark, helper: "Tourist pins — drag on map to reposition." },
      { id: "volcanoes", label: "Volcanoes", icon: Mountain, helper: "Peak labels & painted volcanoes — drag to move names and mountain art together." },
      { id: "hotels", label: "Hotels", icon: Bed, helper: "Hotel pins — click map when adding a new one." },
      { id: "restaurants", label: "Restaurants", icon: UtensilsCrossed, helper: "Restaurant pins — click map when adding a new one." },
    ],
  },
  {
    label: "Layers",
    modes: [
      {
        id: "barangays",
        label: "Barangays",
        icon: Home,
        helper: "Add, move, or remove barangay name labels on the map.",
      },
      {
        id: "labels",
        label: "Labels",
        icon: Tag,
        helper: "Ports, reefs, areas & other terrain labels — drag markers to reposition.",
      },
      { id: "routes", label: "Routes", icon: Route, helper: "Travel routes — click map to add waypoints." },
      { id: "municipalities", label: "Municipalities", icon: Building2, helper: "Drag municipality name labels on the map." },
    ],
  },
  {
    label: "Settings",
    modes: [
      { id: "categories", label: "Categories", icon: Settings2, helper: "Pin colors and filter/legend options — no map needed." },
    ],
  },
];

const MODE_HELPERS: Record<AdminMode, string> = Object.fromEntries(
  MODE_GROUPS.flatMap((g) => g.modes.map((m) => [m.id, m.helper]))
) as Record<AdminMode, string>;

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (next: Lang) => void }) {
  return (
    <div className="inline-flex rounded-lg border bg-slate-50 p-0.5">
      {(["en", "fil", "bis"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition",
            lang === l ? "bg-white text-kiosk-navy shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function StatusBadge({ active, inverted }: { active: boolean; inverted?: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        active
          ? inverted
            ? "bg-emerald-400/25 text-emerald-100"
            : "bg-emerald-50 text-emerald-700"
          : inverted
            ? "bg-white/15 text-white/70"
            : "bg-slate-100 text-slate-500"
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function FormTabBar({
  tab,
  onChange,
  tabs,
}: {
  tab: FormTab;
  onChange: (t: FormTab) => void;
  tabs: { id: FormTab; label: string; icon: LucideIcon }[];
}) {
  return (
    <div className="flex gap-1 rounded-lg border bg-slate-50 p-0.5">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition",
            tab === id ? "bg-white text-kiosk-navy shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

const ANNOTATION_KINDS = [
  "barangay",
  "peak",
  "poi",
  "port",
  "reef",
  "terminal",
  "area",
  "infra",
] as const;

const LABEL_SIDES = ["bottom", "top", "left", "right"] as const;
const TEXT_ANCHORS = ["start", "middle", "end"] as const;

type AttractionForm = {
  slug: string;
  nameEn: string;
  nameFil: string;
  nameBis: string;
  descriptionEn: string;
  descriptionFil: string;
  descriptionBis: string;
  historyEn: string;
  historyFil: string;
  historyBis: string;
  categoryId: string;
  municipalityId: string;
  coverImage: string;
  entranceFeeEn: string;
  entranceFeeFil: string;
  entranceFeeBis: string;
  openingHoursEn: string;
  openingHoursFil: string;
  openingHoursBis: string;
  travelTipsEn: string;
  travelTipsFil: string;
  travelTipsBis: string;
  travelTimeEn: string;
  travelTimeFil: string;
  travelTimeBis: string;
  distanceFromCapitolEn: string;
  distanceFromCapitolFil: string;
  distanceFromCapitolBis: string;
  phone: string;
  website: string;
  rating: number;
  labelText: string;
  labelSide: string;
  featured: boolean;
  isActive: boolean;
  sortOrder: number;
};

type LabelForm = {
  slug: string;
  text: string;
  kind: string;
  infoEn: string;
  fontSize: string;
  anchor: string;
  isActive: boolean;
  sortOrder: number;
};

type RouteForm = {
  slug: string;
  nameEn: string;
  nameFil: string;
  nameBis: string;
  kind: "road" | "boat";
  fromId: string;
  toId: string;
  points: Array<{ x: number; y: number }>;
  travelTimeEn: string;
  travelTimeFil: string;
  travelTimeBis: string;
  distanceKm: string;
  isActive: boolean;
};

type PlaceForm = {
  slug: string;
  nameEn: string;
  nameFil: string;
  nameBis: string;
  descriptionEn: string;
  phone: string;
  website: string;
  openingHoursEn: string;
  addressEn: string;
  coverImage: string;
  rating: number;
  isActive: boolean;
  sortOrder: number;
};

type CategoryForm = {
  slug: string;
  nameEn: string;
  nameFil: string;
  nameBis: string;
  color: string;
  sortOrder: number;
  showInFilter: boolean;
  showInLegend: boolean;
};

type MunicipalityForm = {
  nameEn: string;
  nameFil: string;
  nameBis: string;
  description: string;
};

function emptyAttractionForm(categoryId: string): AttractionForm {
  return {
    slug: "",
    nameEn: "",
    nameFil: "",
    nameBis: "",
    descriptionEn: "",
    descriptionFil: "",
    descriptionBis: "",
    historyEn: "",
    historyFil: "",
    historyBis: "",
    categoryId,
    municipalityId: "",
    coverImage: "",
    entranceFeeEn: "",
    entranceFeeFil: "",
    entranceFeeBis: "",
    openingHoursEn: "",
    openingHoursFil: "",
    openingHoursBis: "",
    travelTipsEn: "",
    travelTipsFil: "",
    travelTipsBis: "",
    travelTimeEn: "",
    travelTimeFil: "",
    travelTimeBis: "",
    distanceFromCapitolEn: "",
    distanceFromCapitolFil: "",
    distanceFromCapitolBis: "",
    phone: "",
    website: "",
    rating: 4.5,
    labelText: "",
    labelSide: "",
    featured: false,
    isActive: true,
    sortOrder: 0,
  };
}

function attractionToForm(a: MapAttractionAdminRow | null, categoryId: string): AttractionForm {
  if (!a) return emptyAttractionForm(categoryId);
  return {
    slug: a.slug,
    nameEn: a.nameEn,
    nameFil: a.nameFil,
    nameBis: a.nameBis ?? "",
    descriptionEn: a.descriptionEn,
    descriptionFil: a.descriptionFil,
    descriptionBis: a.descriptionBis ?? "",
    historyEn: a.historyEn ?? "",
    historyFil: a.historyFil ?? "",
    historyBis: a.historyBis ?? "",
    categoryId: a.categoryId,
    municipalityId: a.municipalityId ?? "",
    coverImage: a.coverImage ?? "",
    entranceFeeEn: a.entranceFeeEn ?? "",
    entranceFeeFil: a.entranceFeeFil ?? "",
    entranceFeeBis: a.entranceFeeBis ?? "",
    openingHoursEn: a.openingHoursEn ?? "",
    openingHoursFil: a.openingHoursFil ?? "",
    openingHoursBis: a.openingHoursBis ?? "",
    travelTipsEn: a.travelTipsEn ?? "",
    travelTipsFil: a.travelTipsFil ?? "",
    travelTipsBis: a.travelTipsBis ?? "",
    travelTimeEn: a.travelTimeEn ?? "",
    travelTimeFil: a.travelTimeFil ?? "",
    travelTimeBis: a.travelTimeBis ?? "",
    distanceFromCapitolEn: a.distanceFromCapitolEn ?? "",
    distanceFromCapitolFil: a.distanceFromCapitolFil ?? "",
    distanceFromCapitolBis: a.distanceFromCapitolBis ?? "",
    phone: a.phone ?? "",
    website: a.website ?? "",
    rating: a.rating,
    labelText: a.labelText ?? "",
    labelSide: a.labelSide ?? "",
    featured: a.featured,
    isActive: a.isActive,
    sortOrder: a.sortOrder,
  };
}

function attractionFormToWrite(form: AttractionForm): MapAttractionWriteInput {
  return {
    slug: form.slug,
    nameEn: form.nameEn,
    nameFil: form.nameFil || form.nameEn,
    nameBis: form.nameBis || null,
    descriptionEn: form.descriptionEn || form.nameEn,
    descriptionFil: form.descriptionFil || form.descriptionEn || form.nameEn,
    descriptionBis: form.descriptionBis || null,
    historyEn: form.historyEn || null,
    historyFil: form.historyFil || null,
    historyBis: form.historyBis || null,
    categoryId: form.categoryId,
    municipalityId: form.municipalityId || null,
    coverImage: form.coverImage || null,
    entranceFeeEn: form.entranceFeeEn || null,
    entranceFeeFil: form.entranceFeeFil || null,
    entranceFeeBis: form.entranceFeeBis || null,
    openingHoursEn: form.openingHoursEn || null,
    openingHoursFil: form.openingHoursFil || null,
    openingHoursBis: form.openingHoursBis || null,
    travelTipsEn: form.travelTipsEn || null,
    travelTipsFil: form.travelTipsFil || null,
    travelTipsBis: form.travelTipsBis || null,
    travelTimeEn: form.travelTimeEn || null,
    travelTimeFil: form.travelTimeFil || null,
    travelTimeBis: form.travelTimeBis || null,
    distanceFromCapitolEn: form.distanceFromCapitolEn || null,
    distanceFromCapitolFil: form.distanceFromCapitolFil || null,
    distanceFromCapitolBis: form.distanceFromCapitolBis || null,
    phone: form.phone || null,
    website: form.website || null,
    rating: form.rating,
    labelText: form.labelText || null,
    labelSide: form.labelSide || null,
    featured: form.featured,
    isActive: form.isActive,
    sortOrder: form.sortOrder,
  };
}

function emptyLabelForm(kind: string = "poi"): LabelForm {
  return {
    slug: "",
    text: "",
    kind,
    infoEn: "",
    fontSize: "",
    anchor: "middle",
    isActive: true,
    sortOrder: 0,
  };
}

function labelToForm(a: MapAnnotationAdminRow | null): LabelForm {
  if (!a) return emptyLabelForm();
  return {
    slug: a.slug,
    text: a.text,
    kind: a.kind,
    infoEn: a.infoEn ?? "",
    fontSize: a.fontSize != null ? String(a.fontSize) : "",
    anchor: a.anchor ?? "middle",
    isActive: a.isActive,
    sortOrder: a.sortOrder,
  };
}

function labelFormToWrite(form: LabelForm, mapX?: number, mapY?: number): MapAnnotationWriteInput {
  return {
    slug: form.slug || undefined,
    text: form.text,
    kind: form.kind,
    mapX,
    mapY,
    fontSize: form.fontSize ? Number(form.fontSize) : null,
    anchor: form.anchor || null,
    infoEn: form.infoEn || null,
    isActive: form.isActive,
    sortOrder: form.sortOrder,
  };
}

function emptyRouteForm(fromId = "", toId = ""): RouteForm {
  return {
    slug: "",
    nameEn: "",
    nameFil: "",
    nameBis: "",
    kind: "road",
    fromId,
    toId,
    points: [],
    travelTimeEn: "",
    travelTimeFil: "",
    travelTimeBis: "",
    distanceKm: "",
    isActive: true,
  };
}

function routeToForm(r: MapRouteAdminRow | null): RouteForm {
  if (!r) return emptyRouteForm();
  return {
    slug: r.slug,
    nameEn: r.nameEn,
    nameFil: r.nameFil,
    nameBis: r.nameBis ?? "",
    kind: r.kind === "boat" ? "boat" : "road",
    fromId: r.fromId,
    toId: r.toId,
    points: r.points.map((p) => ({ ...p })),
    travelTimeEn: r.travelTimeEn ?? "",
    travelTimeFil: r.travelTimeFil ?? "",
    travelTimeBis: r.travelTimeBis ?? "",
    distanceKm: r.distanceKm != null ? String(r.distanceKm) : "",
    isActive: r.isActive,
  };
}

function routeFormToWrite(form: RouteForm): MapRouteWriteInput {
  return {
    slug: form.slug || undefined,
    nameEn: form.nameEn,
    nameFil: form.nameFil || form.nameEn,
    nameBis: form.nameBis || null,
    kind: form.kind,
    fromId: form.fromId,
    toId: form.toId,
    points: form.points,
    travelTimeEn: form.travelTimeEn || null,
    travelTimeFil: form.travelTimeFil || null,
    travelTimeBis: form.travelTimeBis || null,
    distanceKm: form.distanceKm ? Number(form.distanceKm) : null,
    isActive: form.isActive,
  };
}

function emptyPlaceForm(): PlaceForm {
  return {
    slug: "",
    nameEn: "",
    nameFil: "",
    nameBis: "",
    descriptionEn: "",
    phone: "",
    website: "",
    openingHoursEn: "",
    addressEn: "",
    coverImage: "",
    rating: 4,
    isActive: true,
    sortOrder: 0,
  };
}

function placeToForm(p: MapPlaceAdminRow | null): PlaceForm {
  if (!p) return emptyPlaceForm();
  return {
    slug: p.slug,
    nameEn: p.nameEn,
    nameFil: p.nameFil,
    nameBis: p.nameBis ?? "",
    descriptionEn: p.descriptionEn ?? "",
    phone: p.phone ?? "",
    website: p.website ?? "",
    openingHoursEn: p.openingHoursEn ?? "",
    addressEn: p.addressEn ?? "",
    coverImage: p.coverImage ?? "",
    rating: p.rating,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
  };
}

function placeFormToWrite(form: PlaceForm): MapPlaceWriteInput {
  return {
    slug: form.slug || undefined,
    nameEn: form.nameEn,
    nameFil: form.nameFil || form.nameEn,
    nameBis: form.nameBis || null,
    descriptionEn: form.descriptionEn || null,
    phone: form.phone || null,
    website: form.website || null,
    openingHoursEn: form.openingHoursEn || null,
    addressEn: form.addressEn || null,
    coverImage: form.coverImage || null,
    rating: form.rating,
    isActive: form.isActive,
    sortOrder: form.sortOrder,
  };
}

function emptyCategoryForm(): CategoryForm {
  return {
    slug: "",
    nameEn: "",
    nameFil: "",
    nameBis: "",
    color: "#0f766e",
    sortOrder: 0,
    showInFilter: true,
    showInLegend: true,
  };
}

function categoryToForm(c: MapCategoryAdminOption | null): CategoryForm {
  if (!c) return emptyCategoryForm();
  return {
    slug: c.slug,
    nameEn: c.nameEn,
    nameFil: c.nameFil,
    nameBis: c.nameBis ?? "",
    color: c.color,
    sortOrder: c.sortOrder,
    showInFilter: c.showInFilter,
    showInLegend: c.showInLegend,
  };
}

function categoryFormToWrite(form: CategoryForm): MapCategoryWriteInput {
  return {
    slug: form.slug || undefined,
    nameEn: form.nameEn,
    nameFil: form.nameFil || form.nameEn,
    nameBis: form.nameBis || null,
    color: form.color,
    sortOrder: form.sortOrder,
    showInFilter: form.showInFilter,
    showInLegend: form.showInLegend,
  };
}

function municipalityToForm(m: MapMunicipalityAdminRow | null): MunicipalityForm {
  if (!m) return { nameEn: "", nameFil: "", nameBis: "", description: "" };
  return {
    nameEn: m.nameEn,
    nameFil: m.nameFil,
    nameBis: m.nameBis ?? "",
    description: m.description ?? "",
  };
}

function municipalityFormToWrite(
  form: MunicipalityForm,
  labelX?: number,
  labelY?: number
): MapMunicipalityWriteInput {
  return {
    nameEn: form.nameEn,
    nameFil: form.nameFil || form.nameEn,
    nameBis: form.nameBis || null,
    description: form.description || null,
    labelX,
    labelY,
  };
}

function selectClassName() {
  return "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs";
}

async function uploadImage(file: File, slug: string): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  body.append("slug", slug || "map-upload");
  const res = await fetch("/api/admin/files/upload-homepage-icon", { method: "POST", body });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.fileUrl as string;
}


export function MapAdminClient({
  initialAttractions,
  categories,
  annotations: initialAnnotations,
  routes: initialRoutes,
  hotels: initialHotels,
  restaurants: initialRestaurants,
  municipalities: initialMunicipalities,
}: Props) {
  const fallbackCategoryId = categories[0]?.id ?? "";
  const [mode, setMode] = useState<AdminMode>("attractions");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialAttractions[0]?.id ?? null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [formTab, setFormTab] = useState<FormTab>("basics");
  const [lang, setLang] = useState<Lang>("en");

  const [attractions, setAttractions] = useState(initialAttractions);
  const [annotationRows, setAnnotationRows] = useState(initialAnnotations);
  const [routeRows, setRouteRows] = useState(initialRoutes);
  const [hotels, setHotels] = useState(initialHotels);
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [municipalityRows, setMunicipalityRows] = useState(initialMunicipalities);
  const [categoryRows, setCategoryRows] = useState(categories);

  const [attractionForm, setAttractionForm] = useState<AttractionForm>(() =>
    attractionToForm(initialAttractions[0] ?? null, fallbackCategoryId)
  );
  const [labelForm, setLabelForm] = useState<LabelForm>(() =>
    labelToForm(initialAnnotations[0] ?? null)
  );
  const [routeForm, setRouteForm] = useState<RouteForm>(() => routeToForm(initialRoutes[0] ?? null));
  const [hotelForm, setHotelForm] = useState<PlaceForm>(() => placeToForm(initialHotels[0] ?? null));
  const [restaurantForm, setRestaurantForm] = useState<PlaceForm>(() =>
    placeToForm(initialRestaurants[0] ?? null)
  );
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(() =>
    categoryToForm(categories[0] ?? null)
  );
  const [municipalityForm, setMunicipalityForm] = useState<MunicipalityForm>(() =>
    municipalityToForm(initialMunicipalities[0] ?? null)
  );

  const [pendingPlace, setPendingPlace] = useState<{ x: number; y: number } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [draftPos, setDraftPos] = useState<{ id: string; x: number; y: number } | null>(null);
  const [dragWaypointIndex, setDragWaypointIndex] = useState<number | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const dragIdRef = useRef<string | null>(null);
  const dragMoved = useRef(false);
  const draggingNewPin = useRef(false);
  const dragOrigin = useRef<{ x: number; y: number } | null>(null);
  const DRAG_THRESHOLD_PX = 6;

  useEffect(() => setAttractions(initialAttractions), [initialAttractions]);
  useEffect(() => setAnnotationRows(initialAnnotations), [initialAnnotations]);
  useEffect(() => setRouteRows(initialRoutes), [initialRoutes]);
  useEffect(() => setHotels(initialHotels), [initialHotels]);
  useEffect(() => setRestaurants(initialRestaurants), [initialRestaurants]);
  useEffect(() => setMunicipalityRows(initialMunicipalities), [initialMunicipalities]);
  useEffect(() => setCategoryRows(categories), [categories]);

  const selectedAttraction = useMemo(
    () => attractions.find((a) => a.id === selectedId) ?? null,
    [attractions, selectedId]
  );
  const selectedLabel = useMemo(
    () => annotationRows.find((a) => a.id === selectedId) ?? null,
    [annotationRows, selectedId]
  );
  const selectedRoute = useMemo(
    () => routeRows.find((r) => r.id === selectedId) ?? null,
    [routeRows, selectedId]
  );
  const selectedHotel = useMemo(
    () => hotels.find((h) => h.id === selectedId) ?? null,
    [hotels, selectedId]
  );
  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r.id === selectedId) ?? null,
    [restaurants, selectedId]
  );
  const selectedCategory = useMemo(
    () => categoryRows.find((c) => c.id === selectedId) ?? null,
    [categoryRows, selectedId]
  );
  const selectedMunicipality = useMemo(
    () => municipalityRows.find((m) => m.id === selectedId) ?? null,
    [municipalityRows, selectedId]
  );

  const resetFormUi = useCallback(() => {
    setFormTab("basics");
    setLang("en");
  }, []);

  const resetCreateState = useCallback(() => {
    setCreating(false);
    setPendingPlace(null);
    setDragWaypointIndex(null);
    draggingNewPin.current = false;
    // Do not clear dragId / dragMoved here — pin select runs during pointerdown
    // and must not cancel an in-progress drag.
  }, []);

  const clearDragState = useCallback(() => {
    dragIdRef.current = null;
    setDragId(null);
    setDraftPos(null);
    dragMoved.current = false;
    dragOrigin.current = null;
  }, []);

  const switchMode = useCallback(
    (next: AdminMode) => {
      setMode(next);
      setQuery("");
      resetFormUi();
      resetCreateState();
      clearDragState();
      if (next === "attractions") {
        const first = attractions[0] ?? null;
        setSelectedId(first?.id ?? null);
        setAttractionForm(attractionToForm(first, fallbackCategoryId));
      } else if (next === "volcanoes") {
        const peaks = annotationRows.filter((a) => a.kind === "peak");
        const first = peaks[0] ?? null;
        setSelectedId(first?.id ?? null);
        setLabelForm(labelToForm(first));
      } else if (next === "barangays") {
        const barangays = annotationRows.filter((a) => a.kind === "barangay");
        const first = barangays[0] ?? null;
        setSelectedId(first?.id ?? null);
        setLabelForm(labelToForm(first));
      } else if (next === "labels") {
        const other = annotationRows.filter((a) => a.kind !== "peak" && a.kind !== "barangay");
        const first = other[0] ?? null;
        setSelectedId(first?.id ?? null);
        setLabelForm(labelToForm(first));
      } else if (next === "routes") {
        const first = routeRows[0] ?? null;
        setSelectedId(first?.id ?? null);
        setRouteForm(routeToForm(first));
      } else if (next === "hotels") {
        const first = hotels[0] ?? null;
        setSelectedId(first?.id ?? null);
        setHotelForm(placeToForm(first));
      } else if (next === "restaurants") {
        const first = restaurants[0] ?? null;
        setSelectedId(first?.id ?? null);
        setRestaurantForm(placeToForm(first));
      } else if (next === "categories") {
        const first = categoryRows[0] ?? null;
        setSelectedId(first?.id ?? null);
        setCategoryForm(categoryToForm(first));
      } else {
        const first = municipalityRows[0] ?? null;
        setSelectedId(first?.id ?? null);
        setMunicipalityForm(municipalityToForm(first));
      }
    },
    [
      annotationRows,
      attractions,
      categoryRows,
      clearDragState,
      fallbackCategoryId,
      hotels,
      municipalityRows,
      resetCreateState,
      resetFormUi,
      restaurants,
      routeRows,
    ]
  );

  const percentFromPointer = useCallback((clientX: number, clientY: number) => {
    const el = stageRef.current;
    if (!el) return { x: 50, y: 50 };
    const rect = el.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100)),
    };
  }, []);

  const mapCrosshair =
    creating &&
    (mode === "attractions" ||
      mode === "volcanoes" ||
      mode === "barangays" ||
      mode === "labels" ||
      mode === "hotels" ||
      mode === "restaurants");

  const terrainAnnotations: MapTerrainLabelAnnotation[] | undefined = useMemo(() => {
    if (!isAnnotationMode(mode)) return undefined;
    const rows =
      mode === "volcanoes"
        ? annotationRows.filter((a) => a.kind === "peak")
        : mode === "barangays"
          ? annotationRows.filter((a) => a.kind === "barangay")
          : annotationRows.filter((a) => a.kind !== "peak" && a.kind !== "barangay");
    return rows.map((a) => ({
      id: a.id,
      text: creating && selectedId === a.id ? labelForm.text || a.text : a.text,
      kind: a.kind,
      x: a.mapX,
      y: a.mapY,
      fontSize: a.fontSize,
      anchor: a.anchor,
      isActive: a.isActive,
    }));
  }, [annotationRows, creating, labelForm.text, mode, selectedId]);

  const terrainMunicipalityLabels: MapTerrainMunicipalityLabel[] | undefined = useMemo(() => {
    if (mode !== "municipalities") return undefined;
    return municipalityRows.map((m) => ({
      slug: m.slug,
      text: m.nameEn.toUpperCase(),
      labelX: m.labelX,
      labelY: m.labelY,
    }));
  }, [mode, municipalityRows]);

  const routePoints = routeForm.points;

  const straightLinePoints = useCallback(() => {
    const from = attractions.find((a) => a.id === routeForm.fromId);
    const to = attractions.find((a) => a.id === routeForm.toId);
    if (!from || !to) return [];
    return [
      { x: from.mapX, y: from.mapY },
      { x: to.mapX, y: to.mapY },
    ];
  }, [attractions, routeForm.fromId, routeForm.toId]);

  const onGenericPinDown = useCallback(
    (e: React.PointerEvent, id: string, select: () => void) => {
      e.preventDefault();
      e.stopPropagation();
      // Select first (may reset create UI), then arm drag via ref so moves work immediately
      select();
      dragMoved.current = false;
      dragOrigin.current = { x: e.clientX, y: e.clientY };
      dragIdRef.current = id;
      setDragId(id);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    []
  );

  const onGenericPinMove = useCallback(
    (
      e: React.PointerEvent,
      id: string,
      updateLocal: (x: number, y: number) => void
    ) => {
      if (dragIdRef.current !== id) return;
      // Ignore tiny pointer jitter so a simple select/click does not move the pin
      if (!dragMoved.current && dragOrigin.current) {
        const dist = Math.hypot(
          e.clientX - dragOrigin.current.x,
          e.clientY - dragOrigin.current.y
        );
        if (dist < DRAG_THRESHOLD_PX) return;
      }
      dragMoved.current = true;
      const { x, y } = percentFromPointer(e.clientX, e.clientY);
      setDraftPos({ id, x, y });
      updateLocal(x, y);
    },
    [percentFromPointer]
  );

  const onGenericPinUp = useCallback(
    (
      e: React.PointerEvent,
      id: string,
      getPos: () => { x: number; y: number } | null,
      save: (x: number, y: number) => Promise<{ success: boolean; error?: string }>
    ) => {
      if (dragIdRef.current !== id) return;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* released */
      }
      const pos = getPos();
      const moved = dragMoved.current;
      clearDragState();
      if (!pos || !moved) return;
      startTransition(async () => {
        const result = await save(pos.x, pos.y);
        if (!result.success) toast.error(result.error ?? "Save failed");
        else toast.success("Position saved");
      });
    },
    [clearDragState]
  );

  const onMapClick = useCallback(
    (e: React.MouseEvent) => {
      if (
        dragMoved.current ||
        dragIdRef.current ||
        draggingNewPin.current ||
        dragWaypointIndex !== null
      ) {
        return;
      }
      const { x, y } = percentFromPointer(e.clientX, e.clientY);

      if (mode === "routes" && (creating || selectedId)) {
        setRouteForm((f) => ({ ...f, points: [...f.points, { x, y }] }));
        toast.message(`Waypoint added (${x.toFixed(1)}%, ${y.toFixed(1)}%)`);
        return;
      }

      // Only place a new pin when creating — never teleport an existing selected pin on click
      if (!creating) return;

      setPendingPlace({ x, y });
      toast.success(`Marked at ${x.toFixed(1)}%, ${y.toFixed(1)}%`);
    },
    [creating, dragWaypointIndex, mode, percentFromPointer, selectedId]
  );

  const onNewPinPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    draggingNewPin.current = true;
    dragMoved.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onNewPinPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingNewPin.current) return;
      dragMoved.current = true;
      setPendingPlace(percentFromPointer(e.clientX, e.clientY));
    },
    [percentFromPointer]
  );

  const onNewPinPointerUp = useCallback((e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* released */
    }
    draggingNewPin.current = false;
  }, []);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onUrl: (url: string) => void,
    slug: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, slug);
      onUrl(url);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId || creating) return;
    setPhotoUploading(true);
    try {
      const url = await uploadImage(file, selectedAttraction?.slug ?? "photo");
      startTransition(async () => {
        const result = await addMapAttractionPhoto(selectedId, url);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Photo added");
        setAttractions((prev) =>
          prev.map((a) =>
            a.id === selectedId
              ? {
                  ...a,
                  photos: [
                    ...a.photos,
                    { id: result.id!, url, caption: null, sortOrder: a.photos.length },
                  ],
                }
              : a
          )
        );
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  };

  const deletePhoto = (photoId: string) => {
    if (!selectedId) return;
    startTransition(async () => {
      const result = await deleteMapAttractionPhoto(photoId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Photo removed");
      setAttractions((prev) =>
        prev.map((a) =>
          a.id === selectedId ? { ...a, photos: a.photos.filter((p) => p.id !== photoId) } : a
        )
      );
    });
  };

  
  const startCreateForMode = () => {
    resetCreateState();
    resetFormUi();
    setCreating(true);
    setSelectedId(null);
    if (mode === "attractions") {
      setPendingPlace({ x: 48, y: 40 });
      setAttractionForm(emptyAttractionForm(fallbackCategoryId));
      toast.message("Click the map to place the pin, then Create");
    } else if (mode === "volcanoes") {
      setPendingPlace({ x: 48, y: 42 });
      setLabelForm(emptyLabelForm("peak"));
      toast.message("Click the map to place the volcano / peak label");
    } else if (mode === "barangays") {
      setPendingPlace({ x: 50, y: 50 });
      setLabelForm(emptyLabelForm("barangay"));
      toast.message("Click the map to place the barangay label");
    } else if (mode === "labels") {
      setPendingPlace({ x: 50, y: 50 });
      setLabelForm(emptyLabelForm());
      toast.message("Click the map to place the label marker");
    } else if (mode === "routes") {
      setRouteForm(emptyRouteForm());
      toast.message("Pick from/to attractions, click map for waypoints");
    } else if (mode === "hotels") {
      setPendingPlace({ x: 48, y: 40 });
      setHotelForm(emptyPlaceForm());
    } else if (mode === "restaurants") {
      setPendingPlace({ x: 48, y: 40 });
      setRestaurantForm(emptyPlaceForm());
    } else if (mode === "categories") {
      setCategoryForm(emptyCategoryForm());
    }
  };

  const cancelCreate = () => {
    resetCreateState();
    resetFormUi();
    if (mode === "attractions") {
      const first = attractions[0] ?? null;
      setSelectedId(first?.id ?? null);
      setAttractionForm(attractionToForm(first, fallbackCategoryId));
    } else if (mode === "volcanoes") {
      const peaks = annotationRows.filter((a) => a.kind === "peak");
      const first = peaks[0] ?? null;
      setSelectedId(first?.id ?? null);
      setLabelForm(labelToForm(first));
    } else if (mode === "barangays") {
      const barangays = annotationRows.filter((a) => a.kind === "barangay");
      const first = barangays[0] ?? null;
      setSelectedId(first?.id ?? null);
      setLabelForm(labelToForm(first));
    } else if (mode === "labels") {
      const other = annotationRows.filter((a) => a.kind !== "peak" && a.kind !== "barangay");
      const first = other[0] ?? null;
      setSelectedId(first?.id ?? null);
      setLabelForm(labelToForm(first));
    } else if (mode === "routes") {
      const first = routeRows[0] ?? null;
      setSelectedId(first?.id ?? null);
      setRouteForm(routeToForm(first));
    } else if (mode === "hotels") {
      const first = hotels[0] ?? null;
      setSelectedId(first?.id ?? null);
      setHotelForm(placeToForm(first));
    } else if (mode === "restaurants") {
      const first = restaurants[0] ?? null;
      setSelectedId(first?.id ?? null);
      setRestaurantForm(placeToForm(first));
    } else if (mode === "categories") {
      const first = categoryRows[0] ?? null;
      setSelectedId(first?.id ?? null);
      setCategoryForm(categoryToForm(first));
    }
  };

  const saveAttraction = () => {
    if (!attractionForm.nameEn.trim()) {
      toast.error("Name (EN) is required");
      return;
    }
    if (!attractionForm.categoryId) {
      toast.error("Category is required");
      return;
    }
    const payload = attractionFormToWrite(attractionForm);
    startTransition(async () => {
      if (creating) {
        if (!pendingPlace) {
          toast.error("Place the pin on the map first");
          return;
        }
        const result = await createMapAttraction({ ...payload, mapX: pendingPlace.x, mapY: pendingPlace.y });
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Attraction created");
        const cat = categoryRows.find((c) => c.id === payload.categoryId);
        const row: MapAttractionAdminRow = {
          id: result.id!,
          slug: payload.slug || payload.nameEn.toLowerCase().replace(/\s+/g, "-"),
          nameEn: payload.nameEn,
          nameFil: payload.nameFil ?? payload.nameEn,
          nameBis: payload.nameBis ?? null,
          descriptionEn: payload.descriptionEn,
          descriptionFil: payload.descriptionFil ?? payload.descriptionEn,
          descriptionBis: payload.descriptionBis ?? null,
          historyEn: payload.historyEn ?? null,
          historyFil: payload.historyFil ?? null,
          historyBis: payload.historyBis ?? null,
          categoryId: payload.categoryId,
          categorySlug: cat?.slug ?? "",
          categoryName: cat?.nameEn ?? "",
          municipalityId: payload.municipalityId ?? null,
          mapX: pendingPlace.x,
          mapY: pendingPlace.y,
          latitude: 0,
          longitude: 0,
          coverImage: payload.coverImage ?? null,
          entranceFeeEn: payload.entranceFeeEn ?? null,
          entranceFeeFil: payload.entranceFeeFil ?? null,
          entranceFeeBis: payload.entranceFeeBis ?? null,
          openingHoursEn: payload.openingHoursEn ?? null,
          openingHoursFil: payload.openingHoursFil ?? null,
          openingHoursBis: payload.openingHoursBis ?? null,
          travelTipsEn: payload.travelTipsEn ?? null,
          travelTipsFil: payload.travelTipsFil ?? null,
          travelTipsBis: payload.travelTipsBis ?? null,
          travelTimeEn: payload.travelTimeEn ?? null,
          travelTimeFil: payload.travelTimeFil ?? null,
          travelTimeBis: payload.travelTimeBis ?? null,
          distanceFromCapitolEn: payload.distanceFromCapitolEn ?? null,
          distanceFromCapitolFil: payload.distanceFromCapitolFil ?? null,
          distanceFromCapitolBis: payload.distanceFromCapitolBis ?? null,
          phone: payload.phone ?? null,
          website: payload.website ?? null,
          rating: payload.rating ?? 4.5,
          labelText: payload.labelText ?? null,
          labelDx: null,
          labelDy: null,
          labelSide: payload.labelSide ?? null,
          featured: Boolean(payload.featured),
          isActive: payload.isActive !== false,
          sortOrder: payload.sortOrder ?? 0,
          photos: [],
        };
        setAttractions((p) => [...p, row]);
        resetCreateState();
        setSelectedId(row.id);
        setAttractionForm(attractionToForm(row, fallbackCategoryId));
        return;
      }
      if (!selectedId) return;
      const result = await updateMapAttraction(selectedId, payload);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Attraction saved");
      const cat = categoryRows.find((c) => c.id === payload.categoryId);
      setAttractions((prev) =>
        prev.map((a) =>
          a.id === selectedId
            ? {
                ...a,
                ...payload,
                nameFil: payload.nameFil ?? a.nameFil,
                nameBis: payload.nameBis ?? a.nameBis,
                descriptionFil: payload.descriptionFil ?? a.descriptionFil,
                descriptionBis: payload.descriptionBis ?? a.descriptionBis,
                categorySlug: cat?.slug ?? a.categorySlug,
                categoryName: cat?.nameEn ?? a.categoryName,
                slug: payload.slug || a.slug,
              }
            : a
        )
      );
    });
  };

  const saveLabel = () => {
    if (!labelForm.text.trim()) {
      toast.error(mode === "barangays" ? "Barangay name is required" : "Label text is required");
      return;
    }
    const locked = lockedAnnotationKind(mode);
    const formForWrite = locked
      ? {
          ...labelForm,
          kind: locked,
          slug:
            labelForm.slug.trim() ||
            (mode === "barangays"
              ? `brgy-${labelForm.text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`
              : labelForm.slug),
        }
      : labelForm;
    const createdLabel =
      mode === "volcanoes" ? "Volcano / peak created" : mode === "barangays" ? "Barangay created" : "Label created";
    const savedLabel =
      mode === "volcanoes" ? "Volcano / peak saved" : mode === "barangays" ? "Barangay saved" : "Label saved";
    startTransition(async () => {
      if (creating) {
        if (!pendingPlace) {
          toast.error("Place the label on the map first");
          return;
        }
        const result = await createMapAnnotation(
          labelFormToWrite(formForWrite, pendingPlace.x, pendingPlace.y)
        );
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success(createdLabel);
        const row: MapAnnotationAdminRow = {
          id: result.id!,
          slug:
            formForWrite.slug ||
            labelForm.text.toLowerCase().replace(/\s+/g, "-"),
          text: labelForm.text,
          kind: formForWrite.kind,
          mapX: pendingPlace.x,
          mapY: pendingPlace.y,
          fontSize: formForWrite.fontSize ? Number(formForWrite.fontSize) : null,
          anchor: formForWrite.anchor,
          infoEn: formForWrite.infoEn || null,
          infoFil: null,
          infoBis: null,
          skipIfAttractionSlug: null,
          isActive: formForWrite.isActive,
          sortOrder: formForWrite.sortOrder,
        };
        setAnnotationRows((p) => [...p, row]);
        resetCreateState();
        setSelectedId(row.id);
        setLabelForm(labelToForm(row));
        return;
      }
      if (!selectedId || !selectedLabel) return;
      const result = await updateMapAnnotation(selectedId, labelFormToWrite(formForWrite));
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(savedLabel);
      setAnnotationRows((prev) =>
        prev.map((a) =>
          a.id === selectedId
            ? {
                ...a,
                text: formForWrite.text,
                kind: formForWrite.kind,
                infoEn: formForWrite.infoEn || null,
                fontSize: formForWrite.fontSize ? Number(formForWrite.fontSize) : null,
                anchor: formForWrite.anchor,
                isActive: formForWrite.isActive,
                sortOrder: formForWrite.sortOrder,
              }
            : a
        )
      );
    });
  };

  const saveRoute = () => {
    if (!routeForm.nameEn.trim()) {
      toast.error("Route name is required");
      return;
    }
    if (!routeForm.fromId || !routeForm.toId) {
      toast.error("From and to attractions are required");
      return;
    }
    const payload = routeFormToWrite(routeForm);
    startTransition(async () => {
      if (creating) {
        const result = await createMapRoute(payload);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Route created");
        const from = attractions.find((a) => a.id === payload.fromId)!;
        const to = attractions.find((a) => a.id === payload.toId)!;
        const row: MapRouteAdminRow = {
          id: result.id!,
          slug: payload.slug || payload.nameEn.toLowerCase().replace(/\s+/g, "-"),
          nameEn: payload.nameEn,
          nameFil: payload.nameFil ?? payload.nameEn,
          nameBis: payload.nameBis ?? null,
          kind: payload.kind,
          fromId: payload.fromId,
          toId: payload.toId,
          fromSlug: from.slug,
          toSlug: to.slug,
          fromName: from.nameEn,
          toName: to.nameEn,
          points: payload.points,
          travelTimeEn: payload.travelTimeEn ?? null,
          travelTimeFil: payload.travelTimeFil ?? null,
          travelTimeBis: payload.travelTimeBis ?? null,
          distanceKm: payload.distanceKm ?? null,
          isActive: payload.isActive !== false,
        };
        setRouteRows((p) => [...p, row]);
        resetCreateState();
        setSelectedId(row.id);
        setRouteForm(routeToForm(row));
        return;
      }
      if (!selectedId) return;
      const result = await updateMapRoute(selectedId, payload);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Route saved");
      setRouteRows((prev) =>
        prev.map((r) =>
          r.id === selectedId
            ? {
                ...r,
                nameEn: payload.nameEn,
                nameFil: payload.nameFil ?? payload.nameEn,
                nameBis: payload.nameBis ?? null,
                kind: payload.kind,
                fromId: payload.fromId,
                toId: payload.toId,
                points: payload.points,
                travelTimeEn: payload.travelTimeEn ?? null,
                travelTimeFil: payload.travelTimeFil ?? null,
                travelTimeBis: payload.travelTimeBis ?? null,
                distanceKm: payload.distanceKm ?? null,
                isActive: payload.isActive !== false,
              }
            : r
        )
      );
    });
  };

  const savePlace = (kind: "hotels" | "restaurants") => {
    const form = kind === "hotels" ? hotelForm : restaurantForm;
    if (!form.nameEn.trim()) {
      toast.error("Name (EN) is required");
      return;
    }
    const payload = placeFormToWrite(form);
    const createFn = kind === "hotels" ? createMapHotel : createMapRestaurant;
    const updateFn = kind === "hotels" ? updateMapHotel : updateMapRestaurant;
    const setList = kind === "hotels" ? setHotels : setRestaurants;
    const setFormFn = kind === "hotels" ? setHotelForm : setRestaurantForm;

    startTransition(async () => {
      if (creating) {
        if (!pendingPlace) {
          toast.error("Place the pin on the map first");
          return;
        }
        const result = await createFn({ ...payload, mapX: pendingPlace.x, mapY: pendingPlace.y });
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success(kind === "hotels" ? "Hotel created" : "Restaurant created");
        const row: MapPlaceAdminRow = {
          id: result.id!,
          slug: payload.slug || payload.nameEn.toLowerCase().replace(/\s+/g, "-"),
          nameEn: payload.nameEn,
          nameFil: payload.nameFil ?? payload.nameEn,
          nameBis: payload.nameBis ?? null,
          descriptionEn: payload.descriptionEn ?? null,
          descriptionFil: null,
          descriptionBis: null,
          coverImage: payload.coverImage ?? null,
          phone: payload.phone ?? null,
          website: payload.website ?? null,
          openingHoursEn: payload.openingHoursEn ?? null,
          openingHoursFil: null,
          openingHoursBis: null,
          addressEn: payload.addressEn ?? null,
          mapX: pendingPlace.x,
          mapY: pendingPlace.y,
          rating: payload.rating ?? 4,
          isActive: payload.isActive !== false,
          sortOrder: payload.sortOrder ?? 0,
        };
        setList((p) => [...p, row]);
        resetCreateState();
        setSelectedId(row.id);
        setFormFn(placeToForm(row));
        return;
      }
      if (!selectedId) return;
      const result = await updateFn(selectedId, payload);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Saved");
      setList((prev) =>
        prev.map((p) => (p.id === selectedId ? { ...p, ...payload, slug: payload.slug || p.slug } : p))
      );
    });
  };

  const saveCategory = () => {
    if (!categoryForm.nameEn.trim()) {
      toast.error("Name (EN) is required");
      return;
    }
    const payload = categoryFormToWrite(categoryForm);
    startTransition(async () => {
      if (creating) {
        const result = await createMapCategory(payload);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Category created");
        const row: MapCategoryAdminOption = {
          id: result.id!,
          slug: payload.slug || payload.nameEn.toLowerCase().replace(/\s+/g, "-"),
          nameEn: payload.nameEn,
          nameFil: payload.nameFil ?? payload.nameEn,
          nameBis: payload.nameBis ?? null,
          color: payload.color,
          icon: null,
          sortOrder: payload.sortOrder ?? 0,
          showInFilter: payload.showInFilter !== false,
          showInLegend: payload.showInLegend !== false,
          attractionCount: 0,
        };
        setCategoryRows((p) => [...p, row]);
        resetCreateState();
        setSelectedId(row.id);
        setCategoryForm(categoryToForm(row));
        return;
      }
      if (!selectedId) return;
      const result = await updateMapCategory(selectedId, payload);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Category saved");
      setCategoryRows((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? {
                ...c,
                nameEn: payload.nameEn,
                nameFil: payload.nameFil ?? payload.nameEn,
                nameBis: payload.nameBis ?? null,
                color: payload.color,
                sortOrder: payload.sortOrder ?? c.sortOrder,
                showInFilter: payload.showInFilter !== false,
                showInLegend: payload.showInLegend !== false,
                slug: payload.slug || c.slug,
              }
            : c
        )
      );
    });
  };

  const saveMunicipality = () => {
    if (!municipalityForm.nameEn.trim()) {
      toast.error("Name (EN) is required");
      return;
    }
    if (!selectedId || !selectedMunicipality) return;
    startTransition(async () => {
      const result = await updateMapMunicipality(
        selectedId,
        municipalityFormToWrite(municipalityForm, selectedMunicipality.labelX, selectedMunicipality.labelY)
      );
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Municipality saved");
      setMunicipalityRows((prev) =>
        prev.map((m) =>
          m.id === selectedId
            ? {
                ...m,
                nameEn: municipalityForm.nameEn,
                nameFil: municipalityForm.nameFil || municipalityForm.nameEn,
                nameBis: municipalityForm.nameBis || null,
                description: municipalityForm.description || null,
              }
            : m
        )
      );
    });
  };

  const handleDelete = () => {
    if (!selectedId || creating) return;
    const name =
      selectedAttraction?.nameEn ??
      selectedLabel?.text ??
      selectedRoute?.nameEn ??
      selectedHotel?.nameEn ??
      selectedRestaurant?.nameEn ??
      selectedCategory?.nameEn ??
      selectedMunicipality?.nameEn ??
      "this item";
    const extra =
      mode === "volcanoes"
        ? " This also removes the painted mountain from the kiosk map."
        : mode === "municipalities"
          ? " Attractions linked to it will keep their pins but lose this municipality tag."
          : "";
    if (!window.confirm(`Remove “${name}” from the map?${extra}\n\nThis cannot be undone.`)) return;

    startTransition(async () => {
      let result: { success: boolean; error?: string } = { success: false, error: "Unknown mode" };
      if (mode === "attractions") result = await deleteMapAttraction(selectedId);
      else if (isAnnotationMode(mode)) result = await deleteMapAnnotation(selectedId);
      else if (mode === "routes") result = await deleteMapRoute(selectedId);
      else if (mode === "hotels") result = await deleteMapHotel(selectedId);
      else if (mode === "restaurants") result = await deleteMapRestaurant(selectedId);
      else if (mode === "categories") result = await deleteMapCategory(selectedId);
      else if (mode === "municipalities") result = await deleteMapMunicipality(selectedId);
      else return;

      if (!result.success) {
        toast.error(result.error ?? "Delete failed");
        return;
      }
      toast.success("Removed from map");
      cancelCreate();
      if (mode === "attractions")
        setAttractions((p) => {
          const next = p.filter((a) => a.id !== selectedId);
          const first = next[0] ?? null;
          setSelectedId(first?.id ?? null);
          setAttractionForm(attractionToForm(first, fallbackCategoryId));
          return next;
        });
      else if (isAnnotationMode(mode))
        setAnnotationRows((p) => {
          const next = p.filter((a) => a.id !== selectedId);
          const pool =
            mode === "volcanoes"
              ? next.filter((a) => a.kind === "peak")
              : mode === "barangays"
                ? next.filter((a) => a.kind === "barangay")
                : next.filter((a) => a.kind !== "peak" && a.kind !== "barangay");
          const first = pool[0] ?? null;
          setSelectedId(first?.id ?? null);
          setLabelForm(labelToForm(first));
          return next;
        });
      else if (mode === "routes")
        setRouteRows((p) => {
          const next = p.filter((r) => r.id !== selectedId);
          const first = next[0] ?? null;
          setSelectedId(first?.id ?? null);
          setRouteForm(routeToForm(first));
          return next;
        });
      else if (mode === "hotels")
        setHotels((p) => {
          const next = p.filter((h) => h.id !== selectedId);
          const first = next[0] ?? null;
          setSelectedId(first?.id ?? null);
          setHotelForm(placeToForm(first));
          return next;
        });
      else if (mode === "restaurants")
        setRestaurants((p) => {
          const next = p.filter((r) => r.id !== selectedId);
          const first = next[0] ?? null;
          setSelectedId(first?.id ?? null);
          setRestaurantForm(placeToForm(first));
          return next;
        });
      else if (mode === "categories")
        setCategoryRows((p) => {
          const next = p.filter((c) => c.id !== selectedId);
          const first = next[0] ?? null;
          setSelectedId(first?.id ?? null);
          setCategoryForm(categoryToForm(first));
          return next;
        });
      else if (mode === "municipalities")
        setMunicipalityRows((p) => {
          const next = p.filter((m) => m.id !== selectedId);
          const first = next[0] ?? null;
          setSelectedId(first?.id ?? null);
          setMunicipalityForm(municipalityToForm(first));
          return next;
        });
    });
  };

  const q = query.trim().toLowerCase();
  const filteredAttractions = useMemo(
    () =>
      !q
        ? attractions
        : attractions.filter(
            (a) =>
              a.nameEn.toLowerCase().includes(q) ||
              a.slug.toLowerCase().includes(q) ||
              a.categoryName.toLowerCase().includes(q)
          ),
    [attractions, q]
  );
  const filteredLabels = useMemo(() => {
    const other = annotationRows.filter((a) => a.kind !== "peak" && a.kind !== "barangay");
    if (!q) return other;
    return other.filter(
      (a) => a.text.toLowerCase().includes(q) || a.kind.toLowerCase().includes(q)
    );
  }, [annotationRows, q]);
  const filteredVolcanoes = useMemo(() => {
    const peaks = annotationRows.filter((a) => a.kind === "peak");
    if (!q) return peaks;
    return peaks.filter(
      (a) => a.text.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q)
    );
  }, [annotationRows, q]);
  const filteredBarangays = useMemo(() => {
    const barangays = annotationRows.filter((a) => a.kind === "barangay");
    if (!q) return barangays;
    return barangays.filter(
      (a) => a.text.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q)
    );
  }, [annotationRows, q]);
  const filteredRoutes = useMemo(
    () =>
      !q
        ? routeRows
        : routeRows.filter(
            (r) =>
              r.nameEn.toLowerCase().includes(q) ||
              r.fromName.toLowerCase().includes(q) ||
              r.toName.toLowerCase().includes(q)
          ),
    [routeRows, q]
  );
  const filteredHotels = useMemo(
    () => (!q ? hotels : hotels.filter((h) => h.nameEn.toLowerCase().includes(q))),
    [hotels, q]
  );
  const filteredRestaurants = useMemo(
    () => (!q ? restaurants : restaurants.filter((r) => r.nameEn.toLowerCase().includes(q))),
    [restaurants, q]
  );
  const filteredCategories = useMemo(
    () => (!q ? categoryRows : categoryRows.filter((c) => c.nameEn.toLowerCase().includes(q))),
    [categoryRows, q]
  );
  const filteredMunicipalities = useMemo(
    () => (!q ? municipalityRows : municipalityRows.filter((m) => m.nameEn.toLowerCase().includes(q))),
    [municipalityRows, q]
  );

  const listMeta = {
    attractions: {
      placeholder: "Search attractions…",
      addLabel: "Add pin",
      showAdd: true,
      count: `${attractions.filter((a) => a.isActive).length} active · ${attractions.length} total`,
    },
    volcanoes: {
      placeholder: "Search volcanoes / peaks…",
      addLabel: "Add volcano",
      showAdd: true,
      count: `${annotationRows.filter((a) => a.kind === "peak").length} peaks`,
    },
    barangays: {
      placeholder: "Search barangays…",
      addLabel: "Add barangay",
      showAdd: true,
      count: `${annotationRows.filter((a) => a.kind === "barangay").length} barangays`,
    },
    labels: {
      placeholder: "Search labels…",
      addLabel: "Add label",
      showAdd: true,
      count: `${annotationRows.filter((a) => a.kind !== "peak" && a.kind !== "barangay").length} labels`,
    },
    routes: { placeholder: "Search routes…", addLabel: "Add route", showAdd: true, count: `${routeRows.length} routes` },
    hotels: { placeholder: "Search hotels…", addLabel: "Add hotel", showAdd: true, count: `${hotels.length} hotels` },
    restaurants: {
      placeholder: "Search restaurants…",
      addLabel: "Add restaurant",
      showAdd: true,
      count: `${restaurants.length} restaurants`,
    },
    categories: {
      placeholder: "Search categories…",
      addLabel: "Add category",
      showAdd: true,
      count: `${categoryRows.length} categories`,
    },
    municipalities: {
      placeholder: "Search municipalities…",
      addLabel: "",
      showAdd: false,
      count: `${municipalityRows.length} municipalities`,
    },
  }[mode];

  const mapHint = {
    attractions: creating
      ? "Adding pin · click map or drag green marker"
      : "Select a pin to edit · drag to move (click alone won’t move it)",
    volcanoes: creating
      ? "Adding volcano · click map or drag green marker"
      : "Select a peak · drag to move label (painted mountain follows)",
    barangays: creating
      ? "Adding barangay · click map or drag green marker"
      : "Select a barangay · drag to move",
    labels: creating ? "Adding label · click map or drag green marker" : "Select a label · drag to move",
    routes: "Click map to add waypoints · drag handles to adjust",
    hotels: creating ? "Adding hotel · click map or drag marker" : "Select a hotel · drag to move",
    restaurants: creating ? "Adding restaurant · click map or drag marker" : "Select a restaurant · drag to move",
    categories: "Preview only — no map editing in this mode",
    municipalities: "Select a municipality · drag label to move",
  }[mode];

  const formTitle = creating
    ? mode === "volcanoes"
      ? "Add volcano / peak"
      : mode === "barangays"
        ? "Add barangay"
        : `Add ${mode.slice(0, -1)}`
    : selectedAttraction?.nameEn ??
      selectedLabel?.text ??
      selectedRoute?.nameEn ??
      selectedHotel?.nameEn ??
      selectedRestaurant?.nameEn ??
      selectedCategory?.nameEn ??
      selectedMunicipality?.nameEn ??
      "Select an item";

  const liveCoords =
    draftPos ??
    (mode === "attractions" && selectedAttraction
      ? { x: selectedAttraction.mapX, y: selectedAttraction.mapY }
      : isAnnotationMode(mode) && selectedLabel
        ? { x: selectedLabel.mapX, y: selectedLabel.mapY }
        : mode === "hotels" && selectedHotel
          ? { x: selectedHotel.mapX, y: selectedHotel.mapY }
          : mode === "restaurants" && selectedRestaurant
            ? { x: selectedRestaurant.mapX, y: selectedRestaurant.mapY }
            : mode === "municipalities" && selectedMunicipality
              ? { x: selectedMunicipality.labelX, y: selectedMunicipality.labelY }
              : pendingPlace);

  const onSave = () => {
    if (mode === "attractions") saveAttraction();
    else if (isAnnotationMode(mode)) saveLabel();
    else if (mode === "routes") saveRoute();
    else if (mode === "hotels") savePlace("hotels");
    else if (mode === "restaurants") savePlace("restaurants");
    else if (mode === "categories") saveCategory();
    else saveMunicipality();
  };

  const canDelete = Boolean(selectedId) && !creating;
  const showMap = mode !== "categories";

  const modeCounts: Record<AdminMode, number> = {
    attractions: attractions.length,
    volcanoes: annotationRows.filter((a) => a.kind === "peak").length,
    barangays: annotationRows.filter((a) => a.kind === "barangay").length,
    labels: annotationRows.filter((a) => a.kind !== "peak" && a.kind !== "barangay").length,
    routes: routeRows.length,
    hotels: hotels.length,
    restaurants: restaurants.length,
    categories: categoryRows.length,
    municipalities: municipalityRows.length,
  };

  const selectItem = (id: string, load: () => void) => {
    resetCreateState();
    resetFormUi();
    setSelectedId(id);
    load();
  };

  const attractionFormTabs = [
    { id: "basics" as const, label: "Basics", icon: Info },
    { id: "details" as const, label: "Visitor info", icon: MapPin },
    { id: "media" as const, label: "Media", icon: ImageIcon },
  ];

  const currentListCount =
    mode === "attractions"
      ? filteredAttractions.length
      : mode === "volcanoes"
        ? filteredVolcanoes.length
        : mode === "barangays"
          ? filteredBarangays.length
          : mode === "labels"
            ? filteredLabels.length
            : mode === "routes"
              ? filteredRoutes.length
              : mode === "hotels"
                ? filteredHotels.length
                : mode === "restaurants"
                  ? filteredRestaurants.length
                  : mode === "categories"
                    ? filteredCategories.length
                    : filteredMunicipalities.length;

  
  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-4">
          {MODE_GROUPS.map((group) => (
            <div key={group.label} className="min-w-0">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{group.label}</p>
              <div className="flex flex-wrap gap-1">
                {group.modes.map((m) => {
                  const Icon = m.icon;
                  const active = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => switchMode(m.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition",
                        active ? "bg-kiosk-navy text-white shadow-sm" : "text-gray-600 hover:bg-slate-100"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {m.label}
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                          active ? "bg-white/20 text-white" : "bg-slate-100 text-gray-500"
                        )}
                      >
                        {modeCounts[m.id]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2.5 border-t pt-2.5 text-xs text-gray-500">{MODE_HELPERS[mode]}</p>
      </div>

      <div
        className={cn(
          "grid gap-4 xl:h-[min(640px,calc(100vh-13rem))] xl:min-h-0 xl:items-stretch",
          showMap ? "xl:grid-cols-[240px_minmax(0,1fr)_340px]" : "xl:grid-cols-[280px_minmax(0,1fr)]"
        )}
      >
        <aside className="flex max-h-[420px] flex-col overflow-hidden rounded-xl border bg-white shadow-sm xl:max-h-none">
          <div className="space-y-2 border-b p-3">
            <Input placeholder={listMeta.placeholder} value={query} onChange={(e) => setQuery(e.target.value)} />
            <p className="text-[11px] text-gray-500">{listMeta.count}</p>
            {listMeta.showAdd && (
              <Button type="button" className="w-full" onClick={startCreateForMode}>
                <Plus className="mr-1.5 h-4 w-4" />
                {listMeta.addLabel}
              </Button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {currentListCount === 0 && (
              <p className="px-2 py-6 text-center text-xs text-gray-400">
                No items — click {listMeta.showAdd ? listMeta.addLabel : "Add"} above
              </p>
            )}
            {mode === "attractions" &&
              filteredAttractions.map((a) => {
                const selected = selectedId === a.id && !creating;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => selectItem(a.id, () => setAttractionForm(attractionToForm(a, fallbackCategoryId)))}
                    className={cn(
                      "mb-1 flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition",
                      selected ? "bg-kiosk-navy text-white" : "hover:bg-slate-100"
                    )}
                  >
                    <MapPin className={cn("mt-0.5 h-4 w-4 shrink-0", selected ? "text-kiosk-green" : "text-orange-500")} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="min-w-0 truncate font-medium">{MAP_SPOT_LABELS[a.slug]?.text ?? a.nameEn}</span>
                        <StatusBadge active={a.isActive} inverted={selected} />
                      </span>
                      <span className={cn("block truncate text-[11px]", selected ? "text-white/70" : "text-gray-500")}>
                        {a.categoryName}
                      </span>
                    </span>
                  </button>
                );
              })}
            {mode === "volcanoes" &&
              filteredVolcanoes.map((a) => {
                const selected = selectedId === a.id && !creating;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => selectItem(a.id, () => setLabelForm(labelToForm(a)))}
                    className={cn(
                      "mb-1 flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition",
                      selected ? "bg-kiosk-navy text-white" : "hover:bg-slate-100"
                    )}
                  >
                    <Mountain className={cn("mt-0.5 h-4 w-4 shrink-0", selected ? "text-lime-300" : "text-lime-700")} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="min-w-0 truncate font-medium">{a.text}</span>
                        <StatusBadge active={a.isActive} inverted={selected} />
                      </span>
                      <span className={cn("block truncate text-[11px]", selected ? "text-white/70" : "text-gray-500")}>
                        Peak · {a.slug}
                      </span>
                    </span>
                  </button>
                );
              })}
            {mode === "barangays" &&
              filteredBarangays.map((a) => {
                const selected = selectedId === a.id && !creating;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => selectItem(a.id, () => setLabelForm(labelToForm(a)))}
                    className={cn(
                      "mb-1 flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition",
                      selected ? "bg-kiosk-navy text-white" : "hover:bg-slate-100"
                    )}
                  >
                    <Home className={cn("mt-0.5 h-4 w-4 shrink-0", selected ? "text-orange-300" : "text-orange-600")} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="min-w-0 truncate font-medium">{a.text}</span>
                        <StatusBadge active={a.isActive} inverted={selected} />
                      </span>
                      <span className={cn("block truncate text-[11px]", selected ? "text-white/70" : "text-gray-500")}>
                        Barangay · {a.slug}
                      </span>
                    </span>
                  </button>
                );
              })}
            {mode === "labels" &&
              filteredLabels.map((a) => {
                const selected = selectedId === a.id && !creating;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => selectItem(a.id, () => setLabelForm(labelToForm(a)))}
                    className={cn(
                      "mb-1 flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition",
                      selected ? "bg-kiosk-navy text-white" : "hover:bg-slate-100"
                    )}
                  >
                    <Tag className={cn("mt-0.5 h-4 w-4 shrink-0", selected ? "text-kiosk-green" : "text-emerald-600")} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="min-w-0 truncate font-medium">{a.text}</span>
                        <StatusBadge active={a.isActive} inverted={selected} />
                      </span>
                      <span className={cn("block truncate text-[11px]", selected ? "text-white/70" : "text-gray-500")}>{a.kind}</span>
                    </span>
                  </button>
                );
              })}
            {mode === "routes" &&
              filteredRoutes.map((r) => {
                const selected = selectedId === r.id && !creating;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => selectItem(r.id, () => setRouteForm(routeToForm(r)))}
                    className={cn(
                      "mb-1 flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition",
                      selected ? "bg-kiosk-navy text-white" : "hover:bg-slate-100"
                    )}
                  >
                    <Route className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="min-w-0 truncate font-medium">{r.nameEn}</span>
                        <StatusBadge active={r.isActive} inverted={selected} />
                      </span>
                      <span className={cn("block truncate text-[11px]", selected ? "text-white/70" : "text-gray-500")}>
                        {r.fromName} → {r.toName}
                      </span>
                    </span>
                  </button>
                );
              })}
            {mode === "hotels" &&
              filteredHotels.map((h) => {
                const selected = selectedId === h.id && !creating;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => selectItem(h.id, () => setHotelForm(placeToForm(h)))}
                    className={cn(
                      "mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition",
                      selected ? "bg-kiosk-navy text-white" : "hover:bg-slate-100"
                    )}
                  >
                    <Bed className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-medium">{h.nameEn}</span>
                        <StatusBadge active={h.isActive} inverted={selected} />
                      </span>
                      <span className={cn("block truncate text-[11px]", selected ? "text-white/70" : "text-gray-500")}>Hotel</span>
                    </span>
                  </button>
                );
              })}
            {mode === "restaurants" &&
              filteredRestaurants.map((r) => {
                const selected = selectedId === r.id && !creating;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => selectItem(r.id, () => setRestaurantForm(placeToForm(r)))}
                    className={cn(
                      "mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition",
                      selected ? "bg-kiosk-navy text-white" : "hover:bg-slate-100"
                    )}
                  >
                    <UtensilsCrossed className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-medium">{r.nameEn}</span>
                        <StatusBadge active={r.isActive} inverted={selected} />
                      </span>
                      <span className={cn("block truncate text-[11px]", selected ? "text-white/70" : "text-gray-500")}>Restaurant</span>
                    </span>
                  </button>
                );
              })}
            {mode === "categories" &&
              filteredCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectItem(c.id, () => setCategoryForm(categoryToForm(c)))}
                  className={cn(
                    "mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition",
                    selectedId === c.id && !creating ? "bg-kiosk-navy text-white" : "hover:bg-slate-100"
                  )}
                >
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                  <Tag className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{c.nameEn}</span>
                    <span
                      className={cn(
                        "block truncate text-[11px]",
                        selectedId === c.id && !creating ? "text-white/70" : "text-gray-500"
                      )}
                    >
                      {c.attractionCount} attraction{c.attractionCount === 1 ? "" : "s"}
                    </span>
                  </span>
                </button>
              ))}
            {mode === "municipalities" &&
              filteredMunicipalities.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => selectItem(m.id, () => setMunicipalityForm(municipalityToForm(m)))}
                  className={cn(
                    "mb-1 flex w-full rounded-lg px-2.5 py-2 text-left text-sm transition",
                    selectedId === m.id ? "bg-kiosk-navy text-white" : "hover:bg-slate-100"
                  )}
                >
                  <span className="block truncate font-medium">{m.nameEn}</span>
                  <span className={cn("block truncate text-[11px]", selectedId === m.id ? "text-white/70" : "text-gray-500")}>
                    {m.slug}
                  </span>
                </button>
              ))}
          </div>
        </aside>

        {showMap ? (
        <section className="relative flex h-[min(420px,55vh)] flex-col overflow-hidden rounded-xl border bg-[#5eb0cc] shadow-sm xl:h-full xl:max-h-full">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-slate-950/75 to-slate-950/40 px-4 py-2.5 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-kiosk-green/90">Map workflow</p>
                <p className="mt-0.5 text-xs font-medium leading-snug sm:text-sm">{mapHint}</p>
              </div>
              <div className="shrink-0 text-right text-[11px] font-medium">
                {liveCoords && "x" in liveCoords ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-1">
                    {pendingPlace && creating ? "New pin" : "Position"} · {liveCoords.x.toFixed(1)}%, {liveCoords.y.toFixed(1)}%
                  </span>
                ) : null}
                {pending && (
                  <span className="mt-1 inline-flex items-center gap-1 text-white/80">
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                  </span>
                )}
              </div>
            </div>
          </div>
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-2 pt-12"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 70% 15%, rgba(255,255,255,0.32), transparent 55%), linear-gradient(145deg, #5eb0cc 0%, #7ec8de 40%, #4a9bbb 100%)",
            }}
          >
            <div
              ref={stageRef}
              className={cn(
                "relative aspect-[1024/721] h-full max-h-full w-auto max-w-full touch-none",
                mapCrosshair && "cursor-crosshair",
                mode === "routes" && (creating || selectedId) && "cursor-crosshair"
              )}
              onClick={onMapClick}
            >
              <VectorTerrain selectedMunicipalitySlug={null} nightMode={false} hideOcean />
              {(mode === "volcanoes" || mode === "labels" || mode === "barangays") && (
                <WatercolorMapDecor
                  nightMode={false}
                  peakPositions={annotationRows
                    .filter((a) => a.kind === "peak")
                    .map((a) => ({ id: a.slug, x: a.mapX, y: a.mapY }))}
                />
              )}
              <MapTerrainLabels
                selectedMunicipalitySlug={null}
                nightMode={false}
                annotations={terrainAnnotations}
                municipalityLabels={terrainMunicipalityLabels}
              />

              {mode === "routes" && routePoints.length >= 2 && (
                <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polyline
                    points={routePoints.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke={routeForm.kind === "boat" ? "#0284c7" : "#dc2626"}
                    strokeWidth="0.6"
                    strokeDasharray={routeForm.kind === "boat" ? "2 1" : undefined}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}

              {mode === "routes" &&
                routePoints.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Waypoint ${idx + 1}`}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setDragWaypointIndex(idx);
                      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    }}
                    onPointerMove={(e) => {
                      if (dragWaypointIndex !== idx) return;
                      const { x, y } = percentFromPointer(e.clientX, e.clientY);
                      setRouteForm((f) => ({
                        ...f,
                        points: f.points.map((pt, i) => (i === idx ? { x, y } : pt)),
                      }));
                    }}
                    onPointerUp={(e) => {
                      if (dragWaypointIndex !== idx) return;
                      try {
                        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                      } catch {
                        /* released */
                      }
                      setDragWaypointIndex(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white bg-amber-500 shadow active:cursor-grabbing"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  />
                ))}

              {mode === "attractions" &&
                attractions.map((a) => {
                  const active = selectedId === a.id && !creating;
                  const color = categoryMeta(a.categorySlug as AttractionCategory)?.color ?? "#f97316";
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onPointerDown={(e) =>
                        onGenericPinDown(e, a.id, () => {
                          resetCreateState();
                          resetFormUi();
                          setSelectedId(a.id);
                          setAttractionForm(attractionToForm(a, fallbackCategoryId));
                        })
                      }
                      onPointerMove={(e) =>
                        onGenericPinMove(e, a.id, (x, y) =>
                          setAttractions((prev) => prev.map((row) => (row.id === a.id ? { ...row, mapX: x, mapY: y } : row)))
                        )
                      }
                      onPointerUp={(e) =>
                        onGenericPinUp(e, a.id, () => {
                          const row = attractions.find((r) => r.id === a.id);
                          if (draftPos?.id === a.id) return draftPos;
                          return row ? { x: row.mapX, y: row.mapY } : null;
                        }, async (x, y) => updateMapAttractionPosition(a.id, x, y))
                      }
                      onPointerCancel={(e) =>
                        onGenericPinUp(e, a.id, () => null, async () => ({ success: true }))
                      }
                      onClick={(e) => e.stopPropagation()}
                      className={cn("absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center", !a.isActive && "opacity-40")}
                      style={{ left: `${a.mapX}%`, top: `${a.mapY}%` }}
                    >
                      <span className={cn("flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-lg", active && "ring-4 ring-kiosk-green/45")} style={{ backgroundColor: color }}>
                        <MapPin className="h-3.5 w-3.5 text-white" />
                      </span>
                      {active && (
                        <span className="mt-0.5 max-w-[88px] truncate rounded bg-slate-900/85 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow">
                          {MAP_SPOT_LABELS[a.slug]?.text ?? a.nameEn}
                        </span>
                      )}
                    </button>
                  );
                })}

              {isAnnotationMode(mode) &&
                (mode === "volcanoes"
                  ? annotationRows.filter((a) => a.kind === "peak")
                  : mode === "barangays"
                    ? annotationRows.filter((a) => a.kind === "barangay")
                    : annotationRows.filter((a) => a.kind !== "peak" && a.kind !== "barangay")
                ).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                      onPointerDown={(e) =>
                        onGenericPinDown(e, a.id, () => {
                          resetCreateState();
                          resetFormUi();
                          setSelectedId(a.id);
                          setLabelForm(labelToForm(a));
                        })
                      }
                    onPointerMove={(e) =>
                      onGenericPinMove(e, a.id, (x, y) =>
                        setAnnotationRows((prev) => prev.map((row) => (row.id === a.id ? { ...row, mapX: x, mapY: y } : row)))
                      )
                    }
                    onPointerUp={(e) =>
                      onGenericPinUp(e, a.id, () => {
                        if (draftPos?.id === a.id) return draftPos;
                        const row = annotationRows.find((r) => r.id === a.id);
                        return row ? { x: row.mapX, y: row.mapY } : null;
                      }, async (x, y) => updateMapAnnotationPosition(a.id, x, y))
                    }
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow",
                      mode === "barangays" ? "bg-orange-500" : "bg-emerald-500"
                    )}
                    style={{ left: `${a.mapX}%`, top: `${a.mapY}%` }}
                  />
                ))}

              {(mode === "hotels" || mode === "restaurants") &&
                (mode === "hotels" ? hotels : restaurants).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                      onPointerDown={(e) =>
                        onGenericPinDown(e, p.id, () => {
                          resetCreateState();
                          resetFormUi();
                          setSelectedId(p.id);
                          if (mode === "hotels") setHotelForm(placeToForm(p));
                          else setRestaurantForm(placeToForm(p));
                        })
                      }
                    onPointerMove={(e) =>
                      onGenericPinMove(e, p.id, (x, y) => {
                        const setter = mode === "hotels" ? setHotels : setRestaurants;
                        setter((prev) => prev.map((row) => (row.id === p.id ? { ...row, mapX: x, mapY: y } : row)));
                      })
                    }
                    onPointerUp={(e) =>
                      onGenericPinUp(e, p.id, () => {
                        if (draftPos?.id === p.id) return draftPos;
                        return { x: p.mapX, y: p.mapY };
                      }, async (x, y) =>
                        mode === "hotels"
                          ? updateMapHotelPosition(p.id, x, y)
                          : updateMapRestaurantPosition(p.id, x, y)
                      )
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                    style={{ left: `${p.mapX}%`, top: `${p.mapY}%` }}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-indigo-600 shadow-lg">
                      {mode === "hotels" ? <Bed className="h-3.5 w-3.5 text-white" /> : <UtensilsCrossed className="h-3.5 w-3.5 text-white" />}
                    </span>
                  </button>
                ))}

              {mode === "municipalities" &&
                municipalityRows.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                      onPointerDown={(e) =>
                        onGenericPinDown(e, m.id, () => {
                          resetFormUi();
                          setSelectedId(m.id);
                          setMunicipalityForm(municipalityToForm(m));
                        })
                      }
                    onPointerMove={(e) =>
                      onGenericPinMove(e, m.id, (x, y) =>
                        setMunicipalityRows((prev) => prev.map((row) => (row.id === m.id ? { ...row, labelX: x, labelY: y } : row)))
                      )
                    }
                    onPointerUp={(e) =>
                      onGenericPinUp(e, m.id, () => {
                        if (draftPos?.id === m.id) return draftPos;
                        return { x: m.labelX, y: m.labelY };
                      }, async (x, y) => updateMapMunicipalityLabelPosition(m.id, x, y))
                    }
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-white bg-yellow-400 shadow",
                      selectedId === m.id && "ring-4 ring-kiosk-green/45"
                    )}
                    style={{ left: `${m.labelX}%`, top: `${m.labelY}%` }}
                  />
                ))}

              {creating && pendingPlace && mode !== "routes" && (
                <button
                  type="button"
                  onPointerDown={onNewPinPointerDown}
                  onPointerMove={onNewPinPointerMove}
                  onPointerUp={onNewPinPointerUp}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 cursor-grab flex-col items-center active:cursor-grabbing"
                  style={{ left: `${pendingPlace.x}%`, top: `${pendingPlace.y}%` }}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-white bg-kiosk-green text-white shadow-lg ring-4 ring-kiosk-green/35">
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
              )}
            </div>
          </div>
        </section>
        ) : null}

        <aside className="flex max-h-[480px] flex-col overflow-hidden rounded-xl border bg-white shadow-sm xl:max-h-none">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold text-kiosk-navy">{formTitle}</h2>
            {creating && (
              <p className="mt-0.5 text-xs text-amber-700">New item — fill in details then Create</p>
            )}
          </div>
          {!showMap && (
            <div className="border-b bg-teal-50/70 px-4 py-3">
              <div className="flex items-start gap-2.5">
                <Settings2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                <p className="text-xs text-gray-600">
                  Categories control pin colors and filter/legend options. No map editing needed here.
                </p>
              </div>
            </div>
          )}
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {mode === "attractions" && (
              <>
                <FormTabBar tab={formTab} onChange={setFormTab} tabs={attractionFormTabs} />
                {(formTab === "basics" || formTab === "details") && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500">Language</span>
                    <LangToggle lang={lang} onChange={setLang} />
                  </div>
                )}
                {formTab === "basics" && (
                  <div className="space-y-2.5">
                    <div className="space-y-1.5">
                      <Label>Name ({lang.toUpperCase()})</Label>
                      <Input
                        value={lang === "en" ? attractionForm.nameEn : lang === "fil" ? attractionForm.nameFil : attractionForm.nameBis}
                        onChange={(e) =>
                          setAttractionForm((f) =>
                            lang === "en"
                              ? { ...f, nameEn: e.target.value }
                              : lang === "fil"
                                ? { ...f, nameFil: e.target.value }
                                : { ...f, nameBis: e.target.value }
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1.5"><Label>Slug</Label><Input value={attractionForm.slug} onChange={(e) => setAttractionForm((f) => ({ ...f, slug: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label>Category</Label>
                        <select className={selectClassName()} value={attractionForm.categoryId} onChange={(e) => setAttractionForm((f) => ({ ...f, categoryId: e.target.value }))}>
                          {categoryRows.map((c) => (<option key={c.id} value={c.id}>{c.nameEn}</option>))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Municipality</Label>
                        <select className={selectClassName()} value={attractionForm.municipalityId} onChange={(e) => setAttractionForm((f) => ({ ...f, municipalityId: e.target.value }))}>
                          <option value="">— None —</option>
                          {municipalityRows.map((m) => (<option key={m.id} value={m.id}>{m.nameEn}</option>))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description ({lang.toUpperCase()})</Label>
                      <Textarea
                        rows={2}
                        value={lang === "en" ? attractionForm.descriptionEn : lang === "fil" ? attractionForm.descriptionFil : attractionForm.descriptionBis}
                        onChange={(e) =>
                          setAttractionForm((f) =>
                            lang === "en"
                              ? { ...f, descriptionEn: e.target.value }
                              : lang === "fil"
                                ? { ...f, descriptionFil: e.target.value }
                                : { ...f, descriptionBis: e.target.value }
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>History ({lang.toUpperCase()})</Label>
                      <Textarea
                        rows={2}
                        value={lang === "en" ? attractionForm.historyEn : lang === "fil" ? attractionForm.historyFil : attractionForm.historyBis}
                        onChange={(e) =>
                          setAttractionForm((f) =>
                            lang === "en"
                              ? { ...f, historyEn: e.target.value }
                              : lang === "fil"
                                ? { ...f, historyFil: e.target.value }
                                : { ...f, historyBis: e.target.value }
                          )
                        }
                      />
                    </div>
                    <div className="flex flex-wrap gap-4 pt-1">
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={attractionForm.isActive} onChange={(e) => setAttractionForm((f) => ({ ...f, isActive: e.target.checked }))} /> Active</label>
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={attractionForm.featured} onChange={(e) => setAttractionForm((f) => ({ ...f, featured: e.target.checked }))} /> Featured</label>
                    </div>
                    <div className="space-y-1.5"><Label>Sort order</Label><Input type="number" value={attractionForm.sortOrder} onChange={(e) => setAttractionForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))} /></div>
                  </div>
                )}
                {formTab === "details" && (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5"><Label>Phone</Label><Input value={attractionForm.phone} onChange={(e) => setAttractionForm((f) => ({ ...f, phone: e.target.value }))} /></div>
                      <div className="space-y-1.5"><Label>Website</Label><Input value={attractionForm.website} onChange={(e) => setAttractionForm((f) => ({ ...f, website: e.target.value }))} /></div>
                    </div>
                    <div className="space-y-1.5"><Label>Rating</Label><Input type="number" step="0.1" value={attractionForm.rating} onChange={(e) => setAttractionForm((f) => ({ ...f, rating: Number(e.target.value) || 0 }))} /></div>
                    <div className="space-y-1.5">
                      <Label>Entrance fee ({lang.toUpperCase()})</Label>
                      <Input
                        value={lang === "en" ? attractionForm.entranceFeeEn : lang === "fil" ? attractionForm.entranceFeeFil : attractionForm.entranceFeeBis}
                        onChange={(e) =>
                          setAttractionForm((f) =>
                            lang === "en"
                              ? { ...f, entranceFeeEn: e.target.value }
                              : lang === "fil"
                                ? { ...f, entranceFeeFil: e.target.value }
                                : { ...f, entranceFeeBis: e.target.value }
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Opening hours ({lang.toUpperCase()})</Label>
                      <Input
                        value={lang === "en" ? attractionForm.openingHoursEn : lang === "fil" ? attractionForm.openingHoursFil : attractionForm.openingHoursBis}
                        onChange={(e) =>
                          setAttractionForm((f) =>
                            lang === "en"
                              ? { ...f, openingHoursEn: e.target.value }
                              : lang === "fil"
                                ? { ...f, openingHoursFil: e.target.value }
                                : { ...f, openingHoursBis: e.target.value }
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Travel tips ({lang.toUpperCase()})</Label>
                      <Textarea
                        rows={2}
                        value={lang === "en" ? attractionForm.travelTipsEn : lang === "fil" ? attractionForm.travelTipsFil : attractionForm.travelTipsBis}
                        onChange={(e) =>
                          setAttractionForm((f) =>
                            lang === "en"
                              ? { ...f, travelTipsEn: e.target.value }
                              : lang === "fil"
                                ? { ...f, travelTipsFil: e.target.value }
                                : { ...f, travelTipsBis: e.target.value }
                          )
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label>Travel time ({lang.toUpperCase()})</Label>
                        <Input
                          value={lang === "en" ? attractionForm.travelTimeEn : lang === "fil" ? attractionForm.travelTimeFil : attractionForm.travelTimeBis}
                          onChange={(e) =>
                            setAttractionForm((f) =>
                              lang === "en"
                                ? { ...f, travelTimeEn: e.target.value }
                                : lang === "fil"
                                  ? { ...f, travelTimeFil: e.target.value }
                                  : { ...f, travelTimeBis: e.target.value }
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Distance from capitol ({lang.toUpperCase()})</Label>
                        <Input
                          value={lang === "en" ? attractionForm.distanceFromCapitolEn : lang === "fil" ? attractionForm.distanceFromCapitolFil : attractionForm.distanceFromCapitolBis}
                          onChange={(e) =>
                            setAttractionForm((f) =>
                              lang === "en"
                                ? { ...f, distanceFromCapitolEn: e.target.value }
                                : lang === "fil"
                                  ? { ...f, distanceFromCapitolFil: e.target.value }
                                  : { ...f, distanceFromCapitolBis: e.target.value }
                            )
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5"><Label>Map label text</Label><Input value={attractionForm.labelText} onChange={(e) => setAttractionForm((f) => ({ ...f, labelText: e.target.value }))} /></div>
                    <div className="space-y-1.5">
                      <Label>Label side</Label>
                      <select className={selectClassName()} value={attractionForm.labelSide} onChange={(e) => setAttractionForm((f) => ({ ...f, labelSide: e.target.value }))}>
                        <option value="">Default</option>
                        {LABEL_SIDES.map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                    </div>
                  </div>
                )}
                {formTab === "media" && (
                  <div className="space-y-2.5">
                    <div className="space-y-2 rounded-lg border bg-gray-50 p-3">
                      <Label>Cover image</Label>
                      {attractionForm.coverImage ? (
                        <div className="relative h-24 w-full overflow-hidden rounded-lg border bg-white">
                          <Image src={attractionForm.coverImage} alt="Cover" fill className="object-cover" unoptimized />
                        </div>
                      ) : null}
                      <Input value={attractionForm.coverImage} onChange={(e) => setAttractionForm((f) => ({ ...f, coverImage: e.target.value }))} />
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-kiosk-navy px-3 py-1.5 text-xs font-medium text-white">
                        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        Upload cover
                        <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleImageUpload(e, (url) => setAttractionForm((f) => ({ ...f, coverImage: url })), attractionForm.slug || attractionForm.nameEn)} />
                      </label>
                    </div>
                    {!creating && selectedAttraction && (
                      <div className="space-y-2 rounded-lg border p-3">
                        <Label>Photo gallery</Label>
                        {selectedAttraction.photos.length === 0 && (
                          <p className="text-xs text-gray-400">No photos yet</p>
                        )}
                        {selectedAttraction.photos.map((photo) => (
                          <div key={photo.id} className="flex items-center gap-2">
                            <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded border">
                              <Image src={photo.url} alt="" fill className="object-cover" unoptimized />
                            </div>
                            <Button type="button" size="sm" variant="destructive" onClick={() => deletePhoto(photo.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-kiosk-navy">
                          {photoUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                          Add photo
                          <input type="file" accept="image/*" className="hidden" disabled={photoUploading} onChange={handlePhotoUpload} />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {isAnnotationMode(mode) && (
              <div className="space-y-2.5">
                {mode === "volcanoes" && (
                  <p className="rounded-lg border border-lime-200 bg-lime-50 px-3 py-2 text-xs text-lime-900">
                    Drag peaks to move the name and the painted mountain together on the kiosk map.
                    Visitor pins (Hibok-Hibok, Walkway, Observatory) are under Attractions.
                  </p>
                )}
                {mode === "barangays" && (
                  <p className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-950">
                    Add a barangay name, place it on the map, then Save. Use Remove to delete it from the kiosk map.
                    Uncheck Active to hide without deleting.
                  </p>
                )}
                <div className="space-y-1.5">
                  <Label>{mode === "barangays" ? "Barangay name" : "Name"}</Label>
                  <Input value={labelForm.text} onChange={(e) => setLabelForm((f) => ({ ...f, text: e.target.value }))} />
                </div>
                {mode === "labels" ? (
                  <div className="space-y-1.5">
                    <Label>Kind</Label>
                    <select className={selectClassName()} value={labelForm.kind} onChange={(e) => setLabelForm((f) => ({ ...f, kind: e.target.value }))}>
                      {ANNOTATION_KINDS.map((k) => (<option key={k} value={k}>{k}</option>))}
                    </select>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Kind: {mode === "volcanoes" ? "peak (volcano)" : "barangay"}
                  </p>
                )}
                <div className="space-y-1.5">
                  <Label>Info (EN)</Label>
                  <Textarea
                    rows={2}
                    value={labelForm.infoEn}
                    onChange={(e) => setLabelForm((f) => ({ ...f, infoEn: e.target.value }))}
                    placeholder={
                      mode === "barangays"
                        ? "Optional note when visitors tap this barangay"
                        : "Optional info when visitors tap this peak"
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5"><Label>Font size</Label><Input value={labelForm.fontSize} onChange={(e) => setLabelForm((f) => ({ ...f, fontSize: e.target.value }))} /></div>
                  <div className="space-y-1.5">
                    <Label>Anchor</Label>
                    <select className={selectClassName()} value={labelForm.anchor} onChange={(e) => setLabelForm((f) => ({ ...f, anchor: e.target.value }))}>
                      {TEXT_ANCHORS.map((a) => (<option key={a} value={a}>{a}</option>))}
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={labelForm.isActive} onChange={(e) => setLabelForm((f) => ({ ...f, isActive: e.target.checked }))} /> Active on kiosk map</label>
              </div>
            )}

            {mode === "routes" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500">Language</span>
                  <LangToggle lang={lang} onChange={setLang} />
                </div>
                <div className="space-y-1.5">
                  <Label>Name ({lang.toUpperCase()})</Label>
                  <Input
                    value={lang === "en" ? routeForm.nameEn : lang === "fil" ? routeForm.nameFil : routeForm.nameBis}
                    onChange={(e) =>
                      setRouteForm((f) =>
                        lang === "en"
                          ? { ...f, nameEn: e.target.value }
                          : lang === "fil"
                            ? { ...f, nameFil: e.target.value }
                            : { ...f, nameBis: e.target.value }
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Kind</Label>
                  <select className={selectClassName()} value={routeForm.kind} onChange={(e) => setRouteForm((f) => ({ ...f, kind: e.target.value as "road" | "boat" }))}>
                    <option value="road">Road</option>
                    <option value="boat">Boat</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label>From</Label>
                    <select className={selectClassName()} value={routeForm.fromId} onChange={(e) => setRouteForm((f) => ({ ...f, fromId: e.target.value }))}>
                      <option value="">Select…</option>
                      {attractions.map((a) => (<option key={a.id} value={a.id}>{a.nameEn}</option>))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>To</Label>
                    <select className={selectClassName()} value={routeForm.toId} onChange={(e) => setRouteForm((f) => ({ ...f, toId: e.target.value }))}>
                      <option value="">Select…</option>
                      {attractions.map((a) => (<option key={a.id} value={a.id}>{a.nameEn}</option>))}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{routeForm.points.length} waypoint(s) · click map to append</p>
                <div className="space-y-1.5">
                  <Label>Travel time ({lang.toUpperCase()})</Label>
                  <Input
                    value={lang === "en" ? routeForm.travelTimeEn : lang === "fil" ? routeForm.travelTimeFil : routeForm.travelTimeBis}
                    onChange={(e) =>
                      setRouteForm((f) =>
                        lang === "en"
                          ? { ...f, travelTimeEn: e.target.value }
                          : lang === "fil"
                            ? { ...f, travelTimeFil: e.target.value }
                            : { ...f, travelTimeBis: e.target.value }
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5"><Label>Distance (km)</Label><Input type="number" step="0.1" value={routeForm.distanceKm} onChange={(e) => setRouteForm((f) => ({ ...f, distanceKm: e.target.value }))} /></div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={routeForm.isActive} onChange={(e) => setRouteForm((f) => ({ ...f, isActive: e.target.checked }))} /> Active</label>
              </div>
            )}

            {(mode === "hotels" || mode === "restaurants") && (() => {
              const form = mode === "hotels" ? hotelForm : restaurantForm;
              const setForm = mode === "hotels" ? setHotelForm : setRestaurantForm;
              return (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500">Language</span>
                    <LangToggle lang={lang} onChange={setLang} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Name ({lang.toUpperCase()})</Label>
                    <Input
                      value={lang === "en" ? form.nameEn : lang === "fil" ? form.nameFil : form.nameBis}
                      onChange={(e) =>
                        setForm((f) =>
                          lang === "en"
                            ? { ...f, nameEn: e.target.value }
                            : lang === "fil"
                              ? { ...f, nameFil: e.target.value }
                              : { ...f, nameBis: e.target.value }
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1.5"><Label>Description (EN)</Label><Textarea rows={2} value={form.descriptionEn} onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label>Rating</Label><Input type="number" step="0.1" value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) || 0 }))} /></div>
                  </div>
                  <div className="space-y-1.5"><Label>Website</Label><Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>Opening hours (EN)</Label><Input value={form.openingHoursEn} onChange={(e) => setForm((f) => ({ ...f, openingHoursEn: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>Address (EN)</Label><Input value={form.addressEn} onChange={(e) => setForm((f) => ({ ...f, addressEn: e.target.value }))} /></div>
                  <div className="space-y-2 rounded-lg border bg-gray-50 p-3">
                    <Label>Cover image</Label>
                    {form.coverImage ? (
                      <div className="relative h-24 w-full overflow-hidden rounded-lg border bg-white">
                        <Image src={form.coverImage} alt="Cover" fill className="object-cover" unoptimized />
                      </div>
                    ) : null}
                    <Input value={form.coverImage} onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))} />
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-kiosk-navy px-3 py-1.5 text-xs font-medium text-white">
                      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      Upload
                      <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleImageUpload(e, (url) => setForm((f) => ({ ...f, coverImage: url })), form.slug || form.nameEn)} />
                    </label>
                  </div>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} /> Active</label>
                </div>
              );
            })()}

            {mode === "categories" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500">Language</span>
                  <LangToggle lang={lang} onChange={setLang} />
                </div>
                <div className="space-y-1.5">
                  <Label>Name ({lang.toUpperCase()})</Label>
                  <Input
                    value={lang === "en" ? categoryForm.nameEn : lang === "fil" ? categoryForm.nameFil : categoryForm.nameBis}
                    onChange={(e) =>
                      setCategoryForm((f) =>
                        lang === "en"
                          ? { ...f, nameEn: e.target.value }
                          : lang === "fil"
                            ? { ...f, nameFil: e.target.value }
                            : { ...f, nameBis: e.target.value }
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5"><Label>Slug</Label><Input value={categoryForm.slug} onChange={(e) => setCategoryForm((f) => ({ ...f, slug: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5"><Label>Color</Label><Input type="color" value={categoryForm.color} onChange={(e) => setCategoryForm((f) => ({ ...f, color: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>Sort order</Label><Input type="number" value={categoryForm.sortOrder} onChange={(e) => setCategoryForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))} /></div>
                </div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={categoryForm.showInFilter} onChange={(e) => setCategoryForm((f) => ({ ...f, showInFilter: e.target.checked }))} /> Show in filter</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={categoryForm.showInLegend} onChange={(e) => setCategoryForm((f) => ({ ...f, showInLegend: e.target.checked }))} /> Show in legend</label>
              </div>
            )}

            {mode === "municipalities" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500">Language</span>
                  <LangToggle lang={lang} onChange={setLang} />
                </div>
                <div className="space-y-1.5">
                  <Label>Name ({lang.toUpperCase()})</Label>
                  <Input
                    value={lang === "en" ? municipalityForm.nameEn : lang === "fil" ? municipalityForm.nameFil : municipalityForm.nameBis}
                    onChange={(e) =>
                      setMunicipalityForm((f) =>
                        lang === "en"
                          ? { ...f, nameEn: e.target.value }
                          : lang === "fil"
                            ? { ...f, nameFil: e.target.value }
                            : { ...f, nameBis: e.target.value }
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={municipalityForm.description} onChange={(e) => setMunicipalityForm((f) => ({ ...f, description: e.target.value }))} /></div>
                {selectedMunicipality && (
                  <p className="text-xs text-gray-500">Label @ {selectedMunicipality.labelX.toFixed(1)}%, {selectedMunicipality.labelY.toFixed(1)}%</p>
                )}
              </div>
            )}
          </div>
          <div className="sticky bottom-0 z-10 flex flex-wrap gap-2 border-t bg-white/95 p-3 backdrop-blur-sm">
            <Button type="button" className="min-w-[120px] flex-1" onClick={onSave} disabled={pending}>
              {pending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : creating ? <Plus className="mr-1.5 h-4 w-4" /> : <Save className="mr-1.5 h-4 w-4" />}
              {creating ? "Create" : "Save"}
            </Button>
            {creating && (
              <Button type="button" variant="outline" onClick={cancelCreate} disabled={pending}>
                Cancel
              </Button>
            )}
            {mode === "attractions" && !creating && selectedId && (
              <Button type="button" variant="outline" title="Reset to default" onClick={() => startTransition(async () => {
                const result = await resetMapAttractionPosition(selectedId);
                if (!result.success) toast.error(result.error);
                else if (typeof result.mapX === "number") {
                  toast.success("Position reset");
                  setAttractions((prev) => prev.map((a) => a.id === selectedId ? { ...a, mapX: result.mapX!, mapY: result.mapY! } : a));
                }
              })} disabled={pending}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            {mode === "routes" && (creating || selectedId) && (
              <>
                <Button type="button" variant="outline" onClick={() => setRouteForm((f) => ({ ...f, points: [] }))}>
                  Clear points
                </Button>
                <Button type="button" variant="outline" onClick={() => setRouteForm((f) => ({ ...f, points: straightLinePoints() }))}>
                  Reset line
                </Button>
              </>
            )}
            {canDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={pending}
                title="Remove from map"
                aria-label="Remove from map"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
