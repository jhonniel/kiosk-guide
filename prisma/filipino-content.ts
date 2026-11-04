/**
 * Filipino translations for seeded kiosk content that seed.ts leaves in English.
 * Proper nouns (office, place, festival, hotel and restaurant names) are intentionally omitted.
 */

export const FILIPINO_SERVICES: Record<string, { requirementsFil?: string }> = {
  "building-permit": {
    requirementsFil: "Titulo ng Lupa, Mga Plano ng Gusali, Disenyong Pang-istruktura",
  },
};

export const FILIPINO_DIRECTORIES: Record<string, { nameFil: string; descriptionFil?: string }> = {
  "Office of the Provincial Governor": { nameFil: "Tanggapan ng Provincial Governor" },
  "Office of the Provincial Administrator": { nameFil: "Tanggapan ng Provincial Administrator" },
};

export const FILIPINO_EMERGENCY: Record<string, { nameFil: string; descriptionFil: string }> = {
  "Province Emergency Services": {
    nameFil: "Serbisyong Pang-emergency ng Lalawigan",
    descriptionFil: "Emergency hotline ng lalawigan",
  },
  "Province Police": {
    nameFil: "Pulisya ng Lalawigan",
    descriptionFil: "Hotline ng pulisya ng lalawigan",
  },
  "Camiguin General Hospital": {
    nameFil: "Camiguin General Hospital",
    descriptionFil: "Hotline ng ospital ng lalawigan",
  },
  "Province Fire Protection": {
    nameFil: "Bumbero ng Lalawigan",
    descriptionFil: "Hotline ng bumbero ng lalawigan",
  },
  "Mambajao Emergency Services": {
    nameFil: "Serbisyong Pang-emergency ng Mambajao",
    descriptionFil: "Emergency hotline ng Mambajao",
  },
  "Mambajao Police": {
    nameFil: "Pulisya ng Mambajao",
    descriptionFil: "Hotline ng pulisya ng Mambajao",
  },
  "Mambajao Fire Protection": {
    nameFil: "Bumbero ng Mambajao",
    descriptionFil: "Hotline ng bumbero ng Mambajao",
  },
  "Mahinog Emergency Services": {
    nameFil: "Serbisyong Pang-emergency ng Mahinog",
    descriptionFil: "Emergency hotline ng Mahinog",
  },
  "Mahinog Police": {
    nameFil: "Pulisya ng Mahinog",
    descriptionFil: "Hotline ng pulisya ng Mahinog",
  },
  "Mahinog Fire Protection": {
    nameFil: "Bumbero ng Mahinog",
    descriptionFil: "Hotline ng bumbero ng Mahinog",
  },
  "Guinsiliban Emergency Services": {
    nameFil: "Serbisyong Pang-emergency ng Guinsiliban",
    descriptionFil: "Emergency hotline ng Guinsiliban",
  },
  "Guinsiliban Police": {
    nameFil: "Pulisya ng Guinsiliban",
    descriptionFil: "Hotline ng pulisya ng Guinsiliban",
  },
  "Guinsiliban Fire Protection": {
    nameFil: "Bumbero ng Guinsiliban",
    descriptionFil: "Hotline ng bumbero ng Guinsiliban",
  },
  "Sagay Emergency Services": {
    nameFil: "Serbisyong Pang-emergency ng Sagay",
    descriptionFil: "Emergency hotline ng Sagay",
  },
  "Sagay Police": {
    nameFil: "Pulisya ng Sagay",
    descriptionFil: "Hotline ng pulisya ng Sagay",
  },
  "Sagay Fire Protection": {
    nameFil: "Bumbero ng Sagay",
    descriptionFil: "Hotline ng bumbero ng Sagay",
  },
  "Catarman Emergency Services": {
    nameFil: "Serbisyong Pang-emergency ng Catarman",
    descriptionFil: "Emergency hotline ng Catarman",
  },
  "Catarman Police": {
    nameFil: "Pulisya ng Catarman",
    descriptionFil: "Hotline ng pulisya ng Catarman",
  },
  "Catarman Fire Protection": {
    nameFil: "Bumbero ng Catarman",
    descriptionFil: "Hotline ng bumbero ng Catarman",
  },
  "Catarman District Hospital": {
    nameFil: "Catarman District Hospital",
    descriptionFil: "Hotline ng Catarman District Hospital",
  },
};

/** Keyed by `titleEn`. */
export const FILIPINO_EVENTS: Record<string, { titleFil: string }> = {
  "Camiguin Agri-Trade and Food Fair": { titleFil: "Agri-Trade at Food Fair ng Camiguin" },
  "Panaad Holy Week Pilgrimage": { titleFil: "Panaad: Pilgrimage sa Mahal na Araw" },
  "Camiguin Tourism Stakeholders Forum": {
    titleFil: "Forum ng mga Stakeholder sa Turismo ng Camiguin",
  },
};

// ---------- Interactive map (keyed by slug; applied after seedMapEngine) ----------

export const FILIPINO_MAP_CATEGORIES: Record<string, { nameFil: string }> = {
  marine: { nameFil: "Santuwaryong Pandagat" },
};

export const FILIPINO_MAP_ATTRACTIONS: Record<string, { nameFil?: string; entranceFeeFil?: string }> = {
  "volcano-observatory": { nameFil: "Obserbatoryo ng Bulkan" },
  "giant-clam-sanctuary": {
    nameFil: "Santuwaryo ng Taklobo",
    entranceFeeFil: "Bayad sa eco / panonood",
  },
  "mt-hibok-hibok": { entranceFeeFil: "Bayad sa guide at pag-akyat" },
  airport: { entranceFeeFil: "Tiket sa eroplano" },
  "benoni-port": { entranceFeeFil: "Bayad sa terminal / tiket sa barko" },
};

export const FILIPINO_MAP_ROUTES: Record<string, { nameFil?: string; travelTimeFil?: string }> = {
  "boat-benoni-mantigue": { nameFil: "Pantalan ng Benoni → Mantigue Island" },
  "road-mambajao-katibawasan": { nameFil: "Paliparan ng Camiguin → Katibawasan Falls" },
  "road-capitol-ardent": { nameFil: "Pantalan ng Balbagon → Ardent Hot Spring" },
  "road-sunken-loop": {
    nameFil: "Sunken Cemetery → Guho ng Lumang Simbahan",
    travelTimeFil: "~5–10 minuto",
  },
  "road-south-springs": {
    nameFil: "Sto Niño Cold Spring → Macau Springs",
    travelTimeFil: "~15 minuto",
  },
  "road-to-benoni": { nameFil: "Katibawasan Falls → Pantalan ng Benoni" },
  "boat-yumbing-white-island": { nameFil: "Pantalan ng Balbagon → White Island" },
};

export const FILIPINO_MAP_FEATURES: Record<string, { nameFil: string }> = {
  "forest-north": { nameFil: "Hilagang kagubatan" },
  "forest-central": { nameFil: "Gitnang kagubatan" },
  "forest-south": { nameFil: "Katimugang kagubatan" },
  "inland-road-north": { nameFil: "Hilagang daan sa loob ng isla" },
  "inland-road-east": { nameFil: "Silangang daan sa loob ng isla" },
  "inland-road-south": { nameFil: "Katimugang daan sa loob ng isla" },
  "shallow-reef-north": { nameFil: "Hilagang mababaw na bahura" },
  "shallow-reef-east": { nameFil: "Silangang mababaw na bahura" },
  "ocean-base": { nameFil: "Dagat Bohol" },
  "master-road-0": { nameFil: "Bahagi ng daan 1" },
  "master-road-1": { nameFil: "Bahagi ng daan 2" },
  "master-road-2": { nameFil: "Bahagi ng daan 3" },
  "master-road-3": { nameFil: "Bahagi ng daan 4" },
};
