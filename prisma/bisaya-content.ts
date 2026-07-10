/** Cebuano translations for seeded kiosk content. */

export const BISAYA_SETTINGS: Record<string, string> = {
  gov_name_bis: "Provincial Government sa Camiguin",
  gov_prefix_bis: "Provincial Government sa",
  gov_short_bis: "CAMIGUIN",
  tagline_bis: "Ang Pulo nga Gipanganak sa Kalayo",
  welcome_bis:
    "Gamita kini nga kiosk aron makit-an ang mga serbisyo, opisina, form, ug impormasyon bahin sa Camiguin.",
  footer_tagline_bis:
    "Pagdugtong sa mga Tawo. Pagtukod sa mga Komunidad. Pag-uswag sa Camiguin.",
  office_hours_bis: "Lunes hangtod Biyernes, 8:00 AM – 5:00 PM",
  building_name_bis: "Demo Academic Building",
  building_demo_notice_bis:
    "Kini nga building naggamit ug demonstration data. Ang navigation gibase sa Demo Academic Building para sa testing.",
  building_demo_banner_bis:
    "Wala pa na-upload ang opisyal nga floor plan. Ang navigation naggamit sa Demo Academic Building para sa testing.",
  building_missing_location_bis:
    "Dili nako makit-an kana nga lokasyon sa kasamtangang building directory. Kung wala pa na-upload ang opisyal nga floor plan, naggamit ang system ug demonstration data para sa testing.",
  building_quick_questions_bis: JSON.stringify([
    "Asa ang Opisina sa Registrar?",
    "Unsaon pag-adto sa Library?",
    "Asa ang labing duol nga CR?",
    "Asa ang Opisina sa Dean?",
    "Emergency exit",
  ]),
  building_page_title_bis: "Direktoryo sa Building",
  building_page_description_bis:
    "Pangitaa ang mga kwarto, opisina, ug pasilidad uban sa step-by-step nga indoor navigation.",
  building_guide_subtitle_bis:
    "Pangutana asa ang kwarto o pasilidad — giyahan tika step by step.",
  building_guide_placeholder_bis: 'pananglitan, "Asa ang Opisina sa Registrar?"',
};

export const BISAYA_QUICK_LINKS: Record<string, { titleBis: string }> = {
  "business-permit": { titleBis: "Permiso sa Negosyo" },
  cedula: { titleBis: "Sedula / Buhis sa Komunidad" },
  "barangay-clearance": { titleBis: "Klaro sa Barangay" },
  "building-permit": { titleBis: "Permiso sa Pagtukod" },
  "traffic-mv": { titleBis: "Trapiko / Serbisyo sa Sasakyan" },
};

export const BISAYA_HOMEPAGE_CARDS: Record<string, { titleBis: string; descriptionBis: string }> = {
  "citizens-charter": {
    titleBis: "Citizens' Charter",
    descriptionBis: "Mga standard sa serbisyo, oras sa pagproseso, ug mga kinahanglanon.",
  },
  "building-directory": {
    titleBis: "Direktoryo sa Building",
    descriptionBis: "Pangitaa ang mga opisina ug kwarto sulod sa capitol building.",
  },
  map: {
    titleBis: "Mapa sa Camiguin",
    descriptionBis: "Suhola ang mga munisipalidad, landmark, ug importante nga lokasyon.",
  },
  "government-directory": {
    titleBis: "Direktoryo sa Gobyerno",
    descriptionBis: "Mga departamento, opisyal, ug impormasyon sa kontak.",
  },
  news: {
    titleBis: "Balita ug Anunsyo",
    descriptionBis: "Pinakabag-ong mga abiso, programa, ug pampublikong paalala.",
  },
  "download-center": {
    titleBis: "Sentro sa Pagkuha",
    descriptionBis: "Mga porma, giya, ug opisyal nga dokumento.",
  },
  faq: {
    titleBis: "Kanunay nga Gipangutana",
    descriptionBis: "Daling mga tubag sa kasagaran nga pangutana bahin sa serbisyo.",
  },
  tourism: {
    titleBis: "Impormasyon sa Turismo",
    descriptionBis: "Mga atraksyon, aktibidad, ug mga tip sa pagbiyahe.",
  },
  emergency: {
    titleBis: "Mga Contact sa Emergency",
    descriptionBis: "Mga hotline para sa pulis, bumbero, kalusugan, ug rescue.",
  },
  events: {
    titleBis: "Kalendaryo sa mga Kalihokan",
    descriptionBis: "Mga umaabot nga festival, meeting, ug aktibidad.",
  },
  help: {
    titleBis: "Kinahanglan Ko ug Tabang sa...",
    descriptionBis: "Giya nga tabang para sa kasagaran nga mga hangyo.",
  },
};

export const BISAYA_SERVICES: Record<
  string,
  {
    titleBis: string;
    descriptionBis: string;
    requirementsBis?: string;
    documentsBis?: string;
  }
> = {
  "business-permit": {
    titleBis: "Permiso sa Negosyo",
    descriptionBis: "Pag-aplay alang sa bag-ong permiso sa negosyo o pag-renew sa naa na.",
    requirementsBis: "Balido nga ID, Klaro sa Barangay, DTI/SEC Registration, Kontrata sa Abangan",
    documentsBis: "Porma sa Pag-aplay, Sketch sa Lokasyon sa Negosyo, Sertipiko sa Kaluwasan sa Sunog",
  },
  cedula: {
    titleBis: "Sedula / Buhis sa Komunidad",
    descriptionBis: "Kuhaa ang imong sedula (community tax certificate).",
    requirementsBis: "Balido nga ID, Prueba sa Kita (kung employed)",
  },
  "barangay-clearance": {
    titleBis: "Klaro sa Barangay",
    descriptionBis: "Pangayo ug sertipiko sa klaro sa barangay.",
    requirementsBis: "Balido nga ID, Prueba sa Pagpuyo",
  },
  "building-permit": {
    titleBis: "Permiso sa Pagtukod",
    descriptionBis: "Pag-aplay alang sa permiso sa pagtukod ug konstruksyon.",
    requirementsBis: "Titulo sa Yuta, Plano sa Tukod, Disenyo sa Estruktura",
  },
  "traffic-mv": {
    titleBis: "Trapiko / Serbisyo sa Sasakyan",
    descriptionBis: "Rehistro sa motor vehicle ug mga serbisyo bahin sa trapiko.",
    requirementsBis: "Balido nga ID, OR/CR, Insurance",
  },
};

export const BISAYA_DIRECTORIES: Record<string, { nameBis: string; descriptionBis?: string }> = {
  "Governor's Office": { nameBis: "Opisina sa Gobernador" },
  "Treasurer's Office": { nameBis: "Opisina sa Treasurer" },
  "Business Permits Office": { nameBis: "Opisina sa Business Permits" },
  "Provincial Health Office": { nameBis: "Opisina sa Panglawas sa Lalawigan" },
  "Provincial Engineering Office": { nameBis: "Opisina sa Engineering sa Lalawigan" },
  "Provincial Social Welfare Office": { nameBis: "Opisina sa Social Welfare sa Lalawigan" },
};

export const BISAYA_DOWNLOADS: Record<string, { titleBis: string }> = {
  "Business Permit Application Form": { titleBis: "Porma sa Pag-aplay alang sa Permiso sa Negosyo" },
  "Building Permit Application": { titleBis: "Porma sa Pag-aplay alang sa Permiso sa Pagtukod" },
  "Citizens' Charter Handbook": { titleBis: "Citizens' Charter Handbook" },
};

export const BISAYA_FAQS: Array<{ questionBis: string; answerBis: string }> = [
  {
    questionBis: "Unsa ang oras sa opisina?",
    answerBis: "Ang oras sa opisina kay Lunes hangtod Biyernes, 8:00 AM hangtod 5:00 PM.",
  },
  {
    questionBis: "Unsaon pag-apply para sa business permit?",
    answerBis:
      "Bisitaha ang Business Permits Office uban ang gikinahanglan nga dokumento o gamita ang Quick Start menu.",
  },
  {
    questionBis: "Asa ko makakuha ug cedula?",
    answerBis: "Ang mga cedula ihatag sa Treasurer's Office sa Capitol Building.",
  },
];

export const BISAYA_ANNOUNCEMENTS: Array<{ titleBis: string; contentBis: string }> = [
  {
    titleBis: "Lanzones Festival 2024",
    contentBis:
      "Apil kita sa tinuig nga Lanzones Festival nga nagselebrar sa bulawan nga prutas sa Camiguin.",
  },
  {
    titleBis: "Bag-ong Online Services Portal",
    contentBis:
      "Gilunsad sa provincial government ang bag-ong online services para sa mas paspas nga transaksyon.",
  },
];

export const BISAYA_TOURISM: Record<string, { titleBis: string; descriptionBis: string }> = {
  "White Island": {
    titleBis: "White Island",
    descriptionBis:
      "Usa ka matahum nga sandbar nga adunay kristal nga tin-aw nga tubig, perpekto para sa snorkeling.",
  },
  "Katibawasan Falls": {
    titleBis: "Katibawasan Falls",
    descriptionBis:
      "Usa ka dalaygon nga 250-foot nga waterfall nga gilibutan sa luntiang tropikal nga lasang.",
  },
  "Sunken Cemetery": {
    titleBis: "Sunken Cemetery",
    descriptionBis: "Usa ka makasaysayanong landmark gikan sa pagbuka sa bulkan niadtong 1871.",
  },
};

export const BISAYA_EMERGENCY: Record<string, { nameBis: string; descriptionBis: string }> = {
  "PNP Camiguin": { nameBis: "PNP Camiguin", descriptionBis: "Philippine National Police" },
  "BFP Camiguin": { nameBis: "BFP Camiguin", descriptionBis: "Bureau of Fire Protection" },
  "Provincial Hospital": {
    nameBis: "Provincial Hospital",
    descriptionBis: "Camiguin Provincial Hospital",
  },
  "Coast Guard": {
    nameBis: "Coast Guard",
    descriptionBis: "Philippine Coast Guard Station",
  },
};

export const BISAYA_EVENTS: Array<{ titleBis: string; descriptionBis: string }> = [
  {
    titleBis: "Meeting sa Provincial Development Council",
    descriptionBis: "Buwanang meeting sa Provincial Development Council.",
  },
  {
    titleBis: "Lanzones Festival",
    descriptionBis: "Tinuig nga selebrasyon sa ani sa lanzones sa Camiguin.",
  },
];

export const BISAYA_PAGES: Record<string, { titleBis: string; contentBis: string }> = {
  "citizens-charter": {
    titleBis: "Citizens' Charter",
    contentBis:
      "Ang Citizens' Charter usa ka opisyal nga dokumento nga nagpakita sa mga serbisyo sa gobyerno lakip ang mga kinahanglanon, bayad, ug oras sa pagproseso.",
  },
};
