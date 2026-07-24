/**
 * Every visible label from the Camiguin tourism map artwork,
 * positioned in map % (0–100) to match the traced island silhouette.
 */

export type AnnotationKind =
  | "barangay"
  | "peak"
  | "poi"
  | "port"
  | "reef"
  | "terminal"
  | "area"
  | "infra";

export type MapAnnotation = {
  id: string;
  text: string;
  x: number;
  y: number;
  kind: AnnotationKind;
  /** Skip if this id is already an interactive attraction */
  skipIfAttraction?: boolean;
  fontSize?: number;
  anchor?: "start" | "middle" | "end";
};

/** Municipality display names (tourism map uses all-caps). */
export const MAP_MUNICIPALITY_LABELS: Record<string, string> = {
  mambajao: "MAMBAJAO",
  mahinog: "MAHINOG",
  guinsiliban: "GUINSILIBAN",
  sagay: "SAGAY",
  catarman: "CATARMAN",
};

/** Interactive spot short labels (used by AttractionObjects). */
export type MapSpotLabel = {
  text: string;
  dx?: number;
  dy?: number;
  side?: "bottom" | "top" | "left" | "right";
};

export const MAP_SPOT_LABELS: Record<string, MapSpotLabel> = {
  "white-island": { text: "White Island", side: "bottom", dy: 2 },
  "mantigue-island": { text: "Mantigue Island", side: "left", dx: -4 },
  "sunken-cemetery": { text: "Sunken Cemetery", side: "right", dx: 4 },
  "old-church-ruins": { text: "Old Church Ruins", side: "right", dx: 4 },
  "katibawasan-falls": { text: "Katibawasan Falls", side: "right", dx: 4 },
  "tuasan-falls": { text: "Tuasan Falls", side: "left", dx: -4 },
  "binangawan-falls": { text: "Binangawan Falls", side: "right", dx: 4 },
  "soda-water-pool": { text: "Soda Waters", side: "left", dx: -4 },
  "ardent-hot-spring": { text: "Ardent Hot Springs", side: "right", dx: 4 },
  "sto-nino-cold-spring": { text: "Santo Niño Cold Springs", side: "bottom", dy: 2 },
  "volcano-observatory": { text: "Volcano Observatory", side: "left", dx: -4 },
  "mt-hibok-hibok": { text: "Mt. Hibok-Hibok", side: "bottom", dy: 2 },
  "giant-clam-sanctuary": { text: "Giant Clam Sanctuary", side: "left", dx: -4 },
  "cabuan-eco-village": { text: "Cabu-an Eco-Village", side: "bottom", dy: 2 },
  "moro-watch-tower": { text: "Moro Watch Tower", side: "left", dx: -4 },
  "walkway-old-volcano": { text: "Walkway to the Old Volcano", side: "left", dx: -4 },
  "macau-springs": { text: "Macau Springs", side: "left", dx: -4 },
  "benoni-port": { text: "Benoni Port", side: "left", dx: -4 },
  "balbagon-port": { text: "Balbagon Port", side: "bottom", dy: 2 },
  "camiguin-airport": { text: "Airport", side: "bottom", dy: 2 },
};

/**
 * Static labels that appear on the tourism map but are not (or not only)
 * covered by interactive attraction markers.
 */
export const MAP_ANNOTATIONS: MapAnnotation[] = [
  // —— Peaks / volcanoes ——
  { id: "old-volcano", text: "Old Volcano", x: 24, y: 36, kind: "peak" },
  { id: "mt-tres-marias", text: "Mt. Tres Marias", x: 40, y: 40, kind: "peak" },
  { id: "mt-timpoong", text: "Mt. Timpoong", x: 50, y: 40, kind: "peak" },
  { id: "mt-mambajao", text: "Mt. Mambajao", x: 56, y: 34, kind: "peak" },
  { id: "mt-minsok", text: "Mt. Minsok", x: 50, y: 50, kind: "peak" },
  { id: "mt-uhay", text: "Mt. Uhay", x: 60, y: 50, kind: "peak" },
  { id: "guinsiliban-peak", text: "Guinsiliban Peak", x: 64, y: 74, kind: "peak" },
  {
    id: "timpoong-natural-monument",
    text: "Timpoong Hibok-Hibok Natural Monument",
    x: 44,
    y: 44,
    kind: "area",
    fontSize: 9,
  },

  // —— Extra tourist / nature labels on the art ——
  { id: "jicdup-reef", text: "Jicdup Reef", x: 72, y: 18, kind: "reef" },
  { id: "burias-shoal", text: "Burias Shoal", x: 82, y: 38, kind: "reef" },
  { id: "blue-lagoon", text: "Blue Lagoon", x: 18, y: 62, kind: "poi" },
  { id: "guinsiliban-port", text: "Guinsiliban Port", x: 72, y: 82, kind: "port" },
  { id: "benoni-crater-lake", text: "Benoni Crater Lake", x: 72, y: 54, kind: "poi" },
  { id: "camiguin-nightscapes", text: "Camiguin Nightscapes", x: 38, y: 32, kind: "poi" },
  { id: "secret-paradise", text: "Secret Paradise", x: 46, y: 46, kind: "poi" },
  { id: "langoyan-pool", text: "Langoyan ki Nagoy Pool", x: 66, y: 70, kind: "poi", fontSize: 8 },
  { id: "sagay-church-ruins", text: "Sagay Church Ruins", x: 48, y: 82, kind: "poi" },
  {
    id: "pump-boat-white-island",
    text: "Pump boat terminal to White Island",
    x: 22,
    y: 16,
    kind: "terminal",
    fontSize: 8,
    anchor: "start",
  },
  {
    id: "pump-boat-mantigue",
    text: "Pump boat terminal to Mantigue Island",
    x: 78,
    y: 46,
    kind: "terminal",
    fontSize: 8,
    anchor: "end",
  },

  // —— North coast barangays ——
  { id: "brgy-naasag", text: "Naasag", x: 20, y: 18, kind: "barangay" },
  { id: "brgy-yumbing", text: "Yumbing", x: 26, y: 14, kind: "barangay" },
  { id: "brgy-agoho", text: "Agoho", x: 32, y: 12, kind: "barangay" },
  { id: "brgy-tagdo", text: "Tagdo", x: 38, y: 12, kind: "barangay" },
  { id: "brgy-bug-ong", text: "Bug-ong", x: 44, y: 10, kind: "barangay" },
  { id: "brgy-kuguita", text: "Kuguita", x: 50, y: 10, kind: "barangay" },
  { id: "brgy-baylao", text: "Baylao", x: 56, y: 10, kind: "barangay" },
  { id: "brgy-balbagon", text: "Balbagon", x: 60, y: 14, kind: "barangay" },

  // —— Northeast / east barangays ——
  { id: "brgy-anto", text: "Anto", x: 68, y: 20, kind: "barangay" },
  { id: "brgy-maeting", text: "Maeting", x: 72, y: 26, kind: "barangay" },
  { id: "brgy-tupsan", text: "Tupsan", x: 74, y: 32, kind: "barangay" },
  { id: "brgy-benhaan", text: "Benhaan", x: 76, y: 38, kind: "barangay" },
  { id: "brgy-san-isidro", text: "San Isidro", x: 76, y: 42, kind: "barangay" },
  { id: "brgy-catohugan", text: "Catohugan", x: 74, y: 46, kind: "barangay" },
  { id: "brgy-hibangon", text: "Hibangon", x: 72, y: 50, kind: "barangay" },
  { id: "brgy-san-jose", text: "San Jose", x: 70, y: 54, kind: "barangay" },
  { id: "brgy-tubod", text: "Tubod", x: 76, y: 50, kind: "barangay" },
  { id: "brgy-san-roque", text: "San Roque", x: 78, y: 52, kind: "barangay" },
  { id: "brgy-puntod", text: "Puntod", x: 74, y: 58, kind: "barangay" },
  { id: "brgy-owakan", text: "Owakan", x: 72, y: 62, kind: "barangay" },

  // —— Southeast barangays ——
  { id: "brgy-san-miguel", text: "San Miguel", x: 70, y: 68, kind: "barangay" },
  { id: "brgy-cabuan", text: "Cabu-an", x: 74, y: 74, kind: "barangay" },
  { id: "brgy-cantan", text: "Cantan", x: 70, y: 78, kind: "barangay" },
  { id: "brgy-long", text: "Long", x: 66, y: 80, kind: "barangay" },
  { id: "brgy-balite", text: "Balite", x: 60, y: 84, kind: "barangay" },

  // —— South / southwest barangays ——
  { id: "brgy-bonbon", text: "Bonbon", x: 54, y: 84, kind: "barangay" },
  { id: "brgy-mamuyog", text: "Mamuyog", x: 48, y: 84, kind: "barangay" },
  { id: "brgy-alangilan", text: "Alangilan", x: 42, y: 82, kind: "barangay" },
  { id: "brgy-butay", text: "Butay", x: 38, y: 80, kind: "barangay" },
  { id: "brgy-mawana", text: "Mawana", x: 34, y: 76, kind: "barangay" },
  { id: "brgy-tangaro", text: "Tangaro", x: 30, y: 72, kind: "barangay" },
  { id: "brgy-bugaon", text: "Bugaon", x: 28, y: 68, kind: "barangay" },
  { id: "brgy-alga", text: "Alga", x: 26, y: 64, kind: "barangay" },
  { id: "brgy-looc", text: "Looc", x: 24, y: 60, kind: "barangay" },
  { id: "brgy-compis", text: "Compis", x: 22, y: 56, kind: "barangay" },

  // —— West coast barangays ——
  { id: "brgy-pangilawan", text: "Pangilawan", x: 18, y: 52, kind: "barangay" },
  { id: "brgy-lawigan", text: "Lawigan", x: 16, y: 46, kind: "barangay" },
  { id: "brgy-bura", text: "Bura", x: 18, y: 42, kind: "barangay" },
  { id: "brgy-manit", text: "Manit", x: 16, y: 38, kind: "barangay" },
  { id: "brgy-catibac", text: "Catibac", x: 14, y: 34, kind: "barangay" },

  // —— Inland barangays near falls ——
  { id: "brgy-pandan", text: "Pandan", x: 44, y: 56, kind: "barangay" },
  { id: "brgy-sorsogon", text: "Sorsogon", x: 40, y: 58, kind: "barangay" },
  { id: "brgy-mandulog", text: "Mandulog", x: 48, y: 60, kind: "barangay" },
  { id: "brgy-bacnit", text: "Bacnit", x: 36, y: 54, kind: "barangay" },
];

/** @deprecated use MAP_ANNOTATIONS peaks — kept for any old imports */
export const MAP_PEAK_LABELS = MAP_ANNOTATIONS.filter((a) => a.kind === "peak").map((a) => ({
  text: a.text,
  x: a.x,
  y: a.y,
}));
