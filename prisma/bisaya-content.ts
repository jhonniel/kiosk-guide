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
    descriptionBis: "Mga FAQ bahin sa Camiguin ug chat kang Cami, ang assistant sa isla.",
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
  "Office of the Provincial Governor": {
    nameBis: "Opisina sa Provincial Governor",
    descriptionBis:
      "Provincial Governor sa Camiguin: Hon. Xavier Jesus “XJ” D. Romualdo. Capitol Building, Mambajao.",
  },
  "Office of the Provincial Administrator": {
    nameBis: "Opisina sa Provincial Administrator",
  },
  "Provincial General Services Department": {
    nameBis: "Provincial General Services Department",
  },
  "Provincial Budget Department": { nameBis: "Provincial Budget Department" },
  "Provincial Accounting Department": { nameBis: "Provincial Accounting Department" },
  "Provincial Treasury Department": { nameBis: "Provincial Treasury Department" },
  "Provincial Assessments Department": { nameBis: "Provincial Assessments Department" },
  "Provincial Health Department": { nameBis: "Provincial Health Department" },
  "Provincial Social Welfare and Development Department": {
    nameBis: "Provincial Social Welfare and Development Department",
  },
  "Provincial Agriculture Department": { nameBis: "Provincial Agriculture Department" },
  "Provincial Veterinary Department": { nameBis: "Provincial Veterinary Department" },
  "Provincial Engineering Department": { nameBis: "Provincial Engineering Department" },
  "Provincial Tourism Department": { nameBis: "Provincial Tourism Department" },
  "Provincial Legal Department": { nameBis: "Provincial Legal Department" },
  "Provincial Planning and Development Department": {
    nameBis: "Provincial Planning and Development Department",
  },
};

export const BISAYA_DOWNLOADS: Record<string, { titleBis: string }> = {
  "Business Permit Application Form": { titleBis: "Porma sa Pag-aplay alang sa Permiso sa Negosyo" },
  "Building Permit Application": { titleBis: "Porma sa Pag-aplay alang sa Permiso sa Pagtukod" },
  "Citizens' Charter Handbook": { titleBis: "Citizens' Charter Handbook" },
};

export const BISAYA_FAQS: Array<{ questionBis: string; answerBis: string }> = [
  {
    questionBis: "Kinsa ang kasamtangang gobernador sa Camiguin?",
    answerBis:
      "Ang kasamtangang Provincial Governor sa Camiguin mao si Hon. Xavier Jesus “XJ” D. Romualdo. Ang Governor’s Office anaa sa Capitol Building (2nd Floor, Room 201). Mahimo usab ablihan ang Government Directory niining kiosk para sa provincial offices ug contacts.",
  },
  {
    questionBis: "Unsa ang oras sa opisina sa Capitol sa lalawigan?",
    answerBis:
      "Ang mga opisina sa Provincial Capitol kasagarang abli Lunes hangtod Biyernes, 8:00 AM hangtod 5:00 PM (gawas sa holiday). Para sa piho nga opisina, tan-awa ang Government Directory o Building Directory niining kiosk.",
  },
  {
    questionBis: "Unsaon pag-apply og business permit sa Camiguin?",
    answerBis:
      "Adto sa Business Permits Office sa Capitol Building (Ground Floor, Room 108) uban ang requirements, o ablihi ang Quick Start / Services → Business Permit niining kiosk. Mahimo usab i-download ang Business Permit Application Form sa Download Center.",
  },
  {
    questionBis: "Asa ko makakuha ug cedula?",
    answerBis:
      "Ang cedula ihatag sa Treasurer's Office / Provincial Treasury Department sa Capitol Building (Ground Floor, Room 105). Ablihi ang Services → Cedula / Community Tax niining kiosk, o i-download ang form sa Download Center.",
  },
  {
    questionBis: "Unsaon pag-apply og building permit?",
    answerBis:
      "Gamita ang Services → Building Permit niining kiosk para sa overview sa requirements ug proseso. Aduna usab related forms sama sa Building Permit Application, Zoning Clearance, ug Occupancy Permit Checklist sa Download Center.",
  },
  {
    questionBis: "Unsa ang Citizens' Charter ug asa nako kini mabasa?",
    answerBis:
      "Ang Citizens' Charter naglista sa mga serbisyo sa gobyerno uban ang requirements, bayad, ug oras sa proseso. Ablihi ang Citizens' Charter module niining kiosk, o i-download ang Citizens' Charter Handbook sa Download Center.",
  },
  {
    questionBis: "Unsaon pagpangita og opisina sulod sa Capitol Building?",
    answerBis:
      "Ablihi ang Building Directory para sa mga lawak ug floor sulod sa Capitol, o ang Government Directory para sa provincial offices, heads, ug contact numbers. Magamit usab ang Smart Search sa home screen.",
  },
  {
    questionBis: "Unsa ang lima ka munisipalidad sa Camiguin?",
    answerBis:
      "Ang Lalawigan sa Camiguin adunay lima ka munisipalidad: Mambajao (kapital), Mahinog, Guinsiliban, Sagay, ug Catarman. Tan-awa kini sa Map of Camiguin module.",
  },
  {
    questionBis: "Unsaon kasagarang moabot ang mga bisita sa Camiguin?",
    answerBis:
      "Daghang bisita moabot pinaagi sa Benoni Port sa Mahinog gikan sa mainland Mindanao (kasagaran via Balingoan). Gikan Benoni, adunay land transport sa circumferential road sa isla. Tan-awa ang Tourism Information ug Map module.",
  },
  {
    questionBis: "Unsaon pagbisita sa White Island?",
    answerBis:
      "Ang White Island usa ka walay pumuyo nga sandbar gawas sa Yumbing, Mambajao, nga adunay tin-aw nga tubig ug tan-awon sa Mt. Hibok-Hibok. Pinakamaayo bisitahon sayo sa buntag pinaagi sa mubo nga biyahe sa bangka gikan Yumbing. Tan-awa ang Tourism Information → White Island.",
  },
  {
    questionBis: "Unsa ang kilala sa Katibawasan Falls?",
    answerBis:
      "Ang Katibawasan Falls sa Brgy. Pandan, Mambajao usa ka ~250-tiil nga waterfall nga mohulog ngadto sa bugnaw nga natural pool, gilibutan og mga pako ug orchid. Kasagaran adunay lokal nga merienda sama sa kiping duol. Ablihi ang Tourism Information.",
  },
  {
    questionBis: "Unsa ang Sunken Cemetery?",
    answerBis:
      "Sa Bonbon, Catarman, usa ka dako nga krus ang nagtimaan sa sementeryo nga milubog sa dagat panahon sa pagbuto sa Mt. Vulcan niadtong 1871. Kilala kini sa sunset, snorkeling, ug diving. Tan-awa ang Tourism Information → Sunken Cemetery.",
  },
  {
    questionBis: "Unsaon pag-adto sa Mantigue Island?",
    answerBis:
      "Ang Mantigue Island usa ka gamay nga isla nga adunay puti nga balas ug marine sanctuary gawas sa Mahinog, mga 20 minutos nga biyahe sa bangka. Maayo para sa snorkeling, picnic, ug mubo nga lakaw. Detalye sa Tourism Information.",
  },
  {
    questionBis: "Mahimo ba kong mag-hike sa Mt. Hibok-Hibok?",
    answerBis:
      "Oo. Ang Mt. Hibok-Hibok (1,332 m) aktibong bulkan sa Camiguin ug popular nga day hike, apan gikinahanglan ang guide ug permit gikan sa LGU/DENR. Kasagaran usab ang Ardent Hot Springs human sa cooler activities. Tan-awa ang Tourism Information.",
  },
  {
    questionBis: "Asa nako makita ang emergency hotlines sa Camiguin?",
    answerBis:
      "Ablihi ang Emergency Contacts module. Nalista didto ang Province ug municipal hotlines para sa emergency services, pulis, bumbero, ug ospital (lakip ang Mambajao, Mahinog, Guinsiliban, Sagay, ug Catarman). Kung emergency nga may peligro sa kinabuhi, tawagi dayon ang lokal nga hotline.",
  },
  {
    questionBis: "Kanus-a ang Lanzones Festival?",
    answerBis:
      "Ang Lanzones Festival mao ang signature harvest thanksgiving sa Camiguin, kasagaran sa ulahing bahin sa Oktubre sa Mambajao (mga Okt 20–26 sa Events Calendar niining kiosk). Highlights: street dancing, Ugmad trade fair, Mutya sa Buahanan, ug selebrasyon sa lanzones. Ablihi ang Events Calendar para sa detalyadong iskedyul.",
  },
  {
    questionBis: "Unsa ang Panaad sa Camiguin?",
    answerBis:
      "Ang Panaad usa ka Holy Week penitential pilgrimage sa ~64-km circumferential road sa Camiguin, kasagaran motapos sa Stations of the Cross sa Old Volcano, Catarman. Tan-awa ang Events Calendar → Panaad Holy Week Pilgrimage.",
  },
  {
    questionBis: "Unsa pay ubang festival ang gisaulog sa Camiguin?",
    answerBis:
      "Gawas sa Lanzones Festival, adunay Sinulog de Camiguin (Enero, Mambajao), San Juan Hibok-Hibokan (Hunyo 24, kasagaran sa Cabuan/Agohay), May Festival & Santacruzan, ug Christmas Festival of Lights. Tan-awa ang Events Calendar para sa petsa ug iskedyul.",
  },
  {
    questionBis: "Asa ko makadownload og opisyal nga forms ug brochure?",
    answerBis:
      "Ablihi ang Download Center para sa forms (business/building permit, cedula, ID, ug uban pa), tourism brochure, disaster preparedness guide, ug uban pang dokumento. Mahimo i-email o i-QR ang file depende sa opsyon sa kiosk.",
  },
  {
    questionBis: "Kinsa si Cami niining kiosk?",
    answerBis:
      "Si Cami mao ang Camiguin assistant sa kiosk. Pangutana kang Cami bahin sa serbisyo sa lalawigan, turismo, events, emergency contacts, downloads, ug uban pang impormasyon niining system. Motubag si Cami bahin sa Camiguin ug sa impormasyon sa kiosk lang.",
  },
  {
    questionBis: "Asa ang Provincial Tourism Office?",
    answerBis:
      "Pangitaa ang Provincial Tourism Department sa Government Directory para sa head-of-office ug contact details. Para sa atraksyon ug travel tips, ablihi ang Tourism Information. Para sa festival ug kalihokan, ablihi ang Events Calendar.",
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
  "Province Emergency Services": {
    nameBis: "Province Emergency Services",
    descriptionBis: "Provincial emergency hotline",
  },
  "Province Police": {
    nameBis: "Province Police",
    descriptionBis: "Provincial police hotline",
  },
  "Camiguin General Hospital": {
    nameBis: "Camiguin General Hospital",
    descriptionBis: "Provincial hospital hotline",
  },
  "Province Fire Protection": {
    nameBis: "Province Fire Protection",
    descriptionBis: "Provincial fire protection hotline",
  },
  "Mambajao Emergency Services": {
    nameBis: "Mambajao Emergency Services",
    descriptionBis: "Mambajao emergency hotline",
  },
  "Mambajao Police": {
    nameBis: "Mambajao Police",
    descriptionBis: "Mambajao police hotline",
  },
  "Mambajao Fire Protection": {
    nameBis: "Mambajao Fire Protection",
    descriptionBis: "Mambajao fire protection hotline",
  },
  "Mahinog Emergency Services": {
    nameBis: "Mahinog Emergency Services",
    descriptionBis: "Mahinog emergency hotline",
  },
  "Mahinog Police": {
    nameBis: "Mahinog Police",
    descriptionBis: "Mahinog police hotline",
  },
  "Mahinog Fire Protection": {
    nameBis: "Mahinog Fire Protection",
    descriptionBis: "Mahinog fire protection hotline",
  },
  "Guinsiliban Emergency Services": {
    nameBis: "Guinsiliban Emergency Services",
    descriptionBis: "Guinsiliban emergency hotline",
  },
  "Guinsiliban Police": {
    nameBis: "Guinsiliban Police",
    descriptionBis: "Guinsiliban police hotline",
  },
  "Guinsiliban Fire Protection": {
    nameBis: "Guinsiliban Fire Protection",
    descriptionBis: "Guinsiliban fire protection hotline",
  },
  "Sagay Emergency Services": {
    nameBis: "Sagay Emergency Services",
    descriptionBis: "Sagay emergency hotline",
  },
  "Sagay Police": {
    nameBis: "Sagay Police",
    descriptionBis: "Sagay police hotline",
  },
  "Sagay Fire Protection": {
    nameBis: "Sagay Fire Protection",
    descriptionBis: "Sagay fire protection hotline",
  },
  "Catarman Emergency Services": {
    nameBis: "Catarman Emergency Services",
    descriptionBis: "Catarman emergency hotline",
  },
  "Catarman Police": {
    nameBis: "Catarman Police",
    descriptionBis: "Catarman police hotline",
  },
  "Catarman Fire Protection": {
    nameBis: "Catarman Fire Protection",
    descriptionBis: "Catarman fire protection hotline",
  },
  "Catarman District Hospital": {
    nameBis: "Catarman District Hospital",
    descriptionBis: "Catarman district hospital hotline",
  },
};

export const BISAYA_EVENTS: Array<{ titleBis: string; descriptionBis: string }> = [
  {
    titleBis: "Sinulog de Camiguin",
    descriptionBis:
      "Debosyon sa Mambajao sa Santo Niño uban ang street dancing, prusisyon, trade fair, ug cultural presentations sa Camiguin.",
  },
  {
    titleBis: "Camiguin Farmers Kadiwa Market Day",
    descriptionBis:
      "Kadiwa market sa lalawigan nga adunay fresh farm produce, produkto sa lanzones, ug local agri enterprises sa Camiguin.",
  },
  {
    titleBis: "Mambajao Coastal Protection Orientation",
    descriptionBis:
      "Community briefing bahin sa coastal protection, CLAYGO, ug visitor guidelines sa shoreline areas sa Mambajao.",
  },
  {
    titleBis: "Panaad Holy Week Pilgrimage",
    descriptionBis:
      "Tuigang penitential walk sa 64-km circumferential road sa Camiguin, motapos sa Stations of the Cross sa Old Volcano, Catarman.",
  },
  {
    titleBis: "Camiguin May Festival & Santacruzan",
    descriptionBis:
      "Mga highlight sa May fiesta sa barangay ug lungsod uban ang Santacruzan ug Rose of May celebrations sa Camiguin.",
  },
  {
    titleBis: "Sto. Niño Cold Springs Family Day",
    descriptionBis:
      "Family-friendly community day sa Sto. Niño Cold Springs para sa lokal nga libangan ug nature tourism sa Camiguin.",
  },
  {
    titleBis: "San Juan Hibok-Hibokan Festival",
    descriptionBis:
      "Pista ni St. John the Baptist sa tibuok lalawigan uban ang fluvial procession, water sports, ug beach gatherings sa Cabuan ug Agohay.",
  },
  {
    titleBis: "Mantigue Island Marine Sanctuary Day",
    descriptionBis:
      "Adlaw sa marine awareness ug snorkel-safe orientation aron protektahan ang reef ug sanctuary guidelines sa Mantigue Island.",
  },
  {
    titleBis: "Camiguin Circumferential Road Cycling Day",
    descriptionBis:
      "Community cycling sa scenic circumferential road sa Camiguin para sa fitness ug turismo.",
  },
  {
    titleBis: "Meeting sa Provincial Development Council",
    descriptionBis:
      "Quarterly meeting bahin sa mga programa sa lalawigan, infrastructure, ug local development priorities sa Camiguin.",
  },
  {
    titleBis: "Katibawasan Falls Eco-Tourism Briefing",
    descriptionBis:
      "Briefing para sa bisita ug guide bahin sa trail etiquette, kaluwasan, ug conservation sa Katibawasan Falls.",
  },
  {
    titleBis: "White Island Coastal Clean-Up",
    descriptionBis:
      "Volunteer clean-up drive aron protektahan ang sandbar sa White Island ug ang palibot nga dagat.",
  },
  {
    titleBis: "Catarman Heritage & Old Volcano Walk",
    descriptionBis:
      "Guided heritage walk sa Old Volcano walkway sa Catarman, kasaysayan sa Bonbon, ug duol nga cultural landmarks.",
  },
  {
    titleBis: "Mahinog Benoni Port Tourism Welcome Day",
    descriptionBis:
      "Welcome-day orientation para sa mga moabot sa Benoni Port uban ang tourism info, transport tips, ug island itinerary guides.",
  },
  {
    titleBis: "Camiguin Agri-Trade and Food Fair",
    descriptionBis:
      "Pasundayag sa farm produce, produkto sa lanzones, handicrafts, ug local food enterprises sa Camiguin.",
  },
  {
    titleBis: "Lanzones Festival",
    descriptionBis:
      "Pangunang harvest festival sa Camiguin uban ang street dancing, Ugmad trade fair, konsiyerto, ug selebrasyon sa lanzones sa Mambajao.",
  },
  {
    titleBis: "Guinsiliban Cultural Community Night",
    descriptionBis:
      "Gabii sa cultural program uban ang performers gikan Guinsiliban, local food stalls, ug community music.",
  },
  {
    titleBis: "Sunken Cemetery Candle-Lighting Vigil",
    descriptionBis:
      "Gabii sa paghinumdom ug heritage remembrance sa iconic Sunken Cemetery sa Catarman, Camiguin.",
  },
  {
    titleBis: "Camiguin Tourism Stakeholders Forum",
    descriptionBis:
      "Forum para sa resorts, tour operators, LGU, ug komunidad bahin sa sustainable tourism ug mas maayong visitor experience.",
  },
  {
    titleBis: "Dive Camiguin Awareness Weekend",
    descriptionBis:
      "Dive ug snorkel awareness weekend nga nag-highlight sa dive sites sa Camiguin, proteksyon sa reef, ug responsible diving.",
  },
  {
    titleBis: "Mount Hibok-Hibok Eco-Trail Day",
    descriptionBis:
      "Guided eco-trail orientation ug responsible hiking advocacy para sa Hibok-Hibok ug duol nga natural sites.",
  },
  {
    titleBis: "Camiguin Christmas Festival of Lights",
    descriptionBis:
      "Holiday lighting sa isla, community night market, ug Christmas cultural presentations sa Mambajao.",
  },
];

export const BISAYA_PAGES: Record<string, { titleBis: string; contentBis: string }> = {
  "citizens-charter": {
    titleBis: "Citizens' Charter",
    contentBis:
      "Ang Citizens' Charter usa ka opisyal nga dokumento nga nagpakita sa mga serbisyo sa gobyerno lakip ang mga kinahanglanon, bayad, ug oras sa pagproseso.",
  },
};
