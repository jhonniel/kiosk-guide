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
    "Asa ang Provincial Treasury Office?",
    "Asa ang Provincial Assessor's Office?",
    "Asa ang Provincial Tourism Office?",
    "Asa ang labing duol nga comfort room?",
    "Asa ang Elevator 2?",
  ]),
  building_page_title_bis: "Direktoryo sa Bilding",
  building_page_description_bis:
    "Pangitaa ang mga kwarto, opisina, ug pasilidad uban sa step-by-step nga indoor navigation.",
  building_guide_subtitle_bis:
    "Pangutana asa ang kwarto o pasilidad — giyahan tika step by step.",
  building_guide_placeholder_bis: 'pananglitan, "Asa ang Provincial Treasury Office?"',
};

export const BISAYA_QUICK_LINKS: Record<string, { titleBis: string }> = {
  "business-permit": { titleBis: "Permiso sa Negosyo" },
  cedula: { titleBis: "Sedula / Buhis sa Komunidad" },
  "barangay-clearance": { titleBis: "Barangay Clearance" },
  "building-permit": { titleBis: "Permiso sa Pagtukod" },
  "traffic-mv": { titleBis: "Trapiko / Serbisyo sa Sasakyan" },
};

export const BISAYA_HOMEPAGE_CARDS: Record<string, { titleBis: string; descriptionBis: string }> = {
  "citizens-charter": {
    titleBis: "Citizens' Charter",
    descriptionBis: "Mga standard sa serbisyo, oras sa pagproseso, ug mga kinahanglanon.",
  },
  "building-directory": {
    titleBis: "Direktoryo sa Bilding",
    descriptionBis: "Pangitaa ang mga opisina ug kwarto sulod sa Capitol.",
  },
  map: {
    titleBis: "Mapa sa Camiguin",
    descriptionBis: "Suroya ang mga lungsod, timailhan, ug importanteng lugar.",
  },
  "government-directory": {
    titleBis: "Direktoryo sa Gobyerno",
    descriptionBis: "Mga departamento, opisyal, ug impormasyon sa kontak.",
  },
  news: {
    titleBis: "Balita ug Pahibalo",
    descriptionBis: "Pinakabag-ong mga pahibalo, programa, ug pahimangno sa publiko.",
  },
  "download-center": {
    titleBis: "Download Center",
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
    descriptionBis: "Mga hotline para sa pulis, bombero, panglawas, ug rescue.",
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
  "Governor's Office": {
    nameBis: "Opisina sa Gobernador",
    descriptionBis:
      "Opisina sa Provincial Governor sa Camiguin. Kasamtangang gobernador: Hon. Xavier Jesus “XJ” D. Romualdo.",
  },
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

export const BISAYA_DOWNLOADS: Record<string, { titleBis: string; descriptionBis?: string }> = {
  "Business Permit Application Form": {
    titleBis: "Porma sa Pag-aplay alang sa Permiso sa Negosyo",
    descriptionBis: "Pag-aplay og bag-ong business permit o i-renew ang naa na gamit kining opisyal nga porma.",
  },
  "Building Permit Application": {
    titleBis: "Porma sa Pag-aplay alang sa Permiso sa Pagtukod",
    descriptionBis:
      "Gikinahanglang porma sa aplikasyon para sa bag-ong konstruksyon, renobasyon, ug building permit.",
  },
  "Citizens' Charter Handbook": {
    titleBis: "Citizens' Charter Handbook",
    descriptionBis: "Kompleto nga 2026 First Edition sa Citizens' Charter sa Provincial Government sa Camiguin.",
  },
  "Barangay Clearance Request Form": {
    titleBis: "Porma sa Paghangyo og Barangay Clearance",
    descriptionBis:
      "Template nga porma sa paghangyo og barangay clearance nga gigamit sa trabaho, negosyo, ug lokal nga transaksyon.",
  },
  "Real Property Tax Declaration Form": {
    titleBis: "Porma sa Deklarasyon sa Real Property Tax",
    descriptionBis: "Porma sa deklarasyon para sa assessment sa real property tax ug giya sa pagbayad.",
  },
  "Marriage License Requirements Checklist": {
    titleBis: "Listahan sa mga Kinahanglanon para sa Marriage License",
    descriptionBis: "Listahan sa mga dokumento ug lakang nga gikinahanglan sa pag-aplay og marriage license.",
  },
  "Sanitary Permit Application": {
    titleBis: "Aplikasyon para sa Sanitary Permit",
    descriptionBis:
      "Porma sa aplikasyon para sa sanitary permit sa mga food establishment ug susamang negosyo.",
  },
  "Zoning Clearance Form": {
    titleBis: "Porma sa Zoning Clearance",
    descriptionBis:
      "Porma sa paghangyo og zoning clearance sa dili pa magtukod o aprobahan ang lokasyon sa negosyo.",
  },
  "Occupancy Permit Checklist": {
    titleBis: "Listahan para sa Occupancy Permit",
    descriptionBis:
      "Listahan sa mga kinahanglanon sa dili pa mangayo og occupancy permit para sa nahuman nga building.",
  },
  "Tourism Accreditation Application": {
    titleBis: "Aplikasyon para sa Tourism Accreditation",
    descriptionBis: "Mga porma sa aplikasyon para sa accreditation sa tourism enterprise sa Camiguin.",
  },
  "Job Order Application Form": {
    titleBis: "Porma sa Aplikasyon para sa Job Order",
    descriptionBis:
      "Porma sa aplikasyon sa trabaho para sa job order ug contractual nga oportunidad sa provincial government.",
  },
  "Scholarship Application Form": {
    titleBis: "Porma sa Aplikasyon para sa Scholarship",
    descriptionBis:
      "Porma sa aplikasyon para sa provincial scholarship ug mga programa sa tabang sa edukasyon.",
  },
  "Senior Citizen ID Application": {
    titleBis: "Aplikasyon para sa Senior Citizen ID",
    descriptionBis: "Porma ug listahan sa pag-aplay og Senior Citizen Identification Card.",
  },
  "PWD ID Application Form": {
    titleBis: "Porma sa Aplikasyon para sa PWD ID",
    descriptionBis: "Porma sa aplikasyon para sa ID sa Persons with Disability ug mga kaubang benepisyo.",
  },
  "Disaster Preparedness Guide": {
    titleBis: "Giya sa Pagpangandam sa Katalagman",
    descriptionBis: "Giya sa komunidad sa pagpangandam sa bagyo, linog, ug emergency sa Camiguin.",
  },
  "Solid Waste Management Ordinance Summary": {
    titleBis: "Sumaryo sa Solid Waste Management Ordinance",
    descriptionBis:
      "Sumaryo sa lokal nga mga lagda sa solid waste, giya sa pagbulag-bulag sa basura, ug mga silot.",
  },
  "Investment Incentives Brochure": {
    titleBis: "Brochure sa Investment Incentives",
    descriptionBis:
      "Brochure nga nagpasabot sa mga investment incentive ug oportunidad sa negosyo sa Camiguin.",
  },
  "Camiguin Tourism Brochure": {
    titleBis: "Brochure sa Turismo sa Camiguin",
    descriptionBis:
      "Brochure para sa mga bisita nga adunay mga pangunang destinasyon, pista, ug tip sa pagbiyahe.",
  },
  "Annual Investment Program Summary": {
    titleBis: "Sumaryo sa Annual Investment Program",
    descriptionBis:
      "Pampublikong sumaryo sa tinuig nga mga prayoridad ug programa sa pamuhunan sa lalawigan.",
  },
  "Cedula / Community Tax Application": {
    titleBis: "Aplikasyon para sa Sedula / Buhis sa Komunidad",
    descriptionBis: "Porma sa paghangyo og Community Tax Certificate (sedula) sa Treasurer's Office.",
  },
  "Gender and Development Plan Highlights": {
    titleBis: "Mga Highlight sa Gender and Development Plan",
    descriptionBis: "Mga highlight sa provincial Gender and Development plan ug mga pangunang programa.",
  },
  "Capitol Office Directory": {
    titleBis: "Direktoryo sa mga Opisina sa Capitol",
    descriptionBis: "Direktoryo sa mga provincial office, contact number, ug lokasyon sa mga opisina.",
  },
  "Public Hearing Schedule": {
    titleBis: "Iskedyul sa Public Hearing",
    descriptionBis: "Kasamtangang iskedyul sa mga public hearing ug konsultasyon sa komunidad.",
  },
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
      "Ablihi ang Emergency Contacts module. Nalista didto ang Province ug municipal hotlines para sa emergency services, pulis, bombero, ug ospital (lakip ang Mambajao, Mahinog, Guinsiliban, Sagay, ug Catarman). Kung emergency nga may peligro sa kinabuhi, tawagi dayon ang lokal nga hotline.",
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

/** Keyed by `titleEn`. */
export const BISAYA_ANNOUNCEMENTS: Record<string, { titleBis: string; contentBis: string }> = {
  "Camiguin Provincial Government Advisory on Typhoon Preparedness": {
    titleBis: "Abiso sa Provincial Government sa Camiguin bahin sa Pagpangandam sa Bagyo",
    contentBis:
      "Pabiling nahibalo ug andam. Basaha ang tibuok abiso para sa mga giya ug lakang sa kaluwasan aron mapanalipdan ang imong pamilya ug komunidad panahon sa dautang panahon.",
  },
  "Free Medical Mission in Mambajao": {
    titleBis: "Libre nga Medical Mission sa Mambajao",
    contentBis: "Apil kanamo para sa libre nga medical check-up ug konsultasyon. Abli sa tanang residente.",
  },
  "Schedule of Regular Sangguniang Session": {
    titleBis: "Iskedyul sa Regular nga Sesyon sa Sangguniang Panlalawigan",
    contentBis: "Gipaskil na ang iskedyul sa Regular nga Sesyon sa ika-10 nga Sangguniang Panlalawigan.",
  },
  "Tourism Month Celebration 2026": {
    titleBis: "Selebrasyon sa Tourism Month 2026",
    contentBis:
      "Apil sa mga kalihokan sa Tourism Month sa Camiguin nga nagsaulog sa kultura, kinaiyahan, ug pagkamaabiabihon sa isla.",
  },
  "Reminder: Payment of Real Property Taxes": {
    titleBis: "Pahinumdom: Pagbayad sa Real Property Tax",
    contentBis:
      "Bayri ang imong real property tax sa saktong panahon aron malikayan ang multa. Bisitaha ang Provincial Treasurer's Office para sa tabang.",
  },
};

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
  "Ardent Hot Springs": {
    titleBis: "Ardent Hot Springs",
    descriptionBis:
      "Mga natural nga init nga pool (mga 40°C) nga gipainit sa Mt. Hibok-Hibok, sulod sa luntiang lasang. Labing maayo bisitahan sa gabii o human sa bugnaw nga paglangoy sa laing dapit. Adunay mga cottage ug picnic area.",
  },
  "Mantigue Island": {
    titleBis: "Mantigue Island",
    descriptionBis:
      "Usa ka 4-ektarya nga pulo nga gilibutan sa puti nga balas ug marine sanctuary nga adunay buhi nga mga coral ug isda. Maayo para sa snorkeling, picnic sa pulo, ug mubo nga lakaw sa lasang. Maabot pinaagi sa 20 minutos nga biyahe sa bangka gikan sa Mahinog.",
  },
  "Mt. Hibok-Hibok": {
    titleBis: "Mt. Hibok-Hibok",
    descriptionBis:
      "Ang aktibong bulkan sa Camiguin (1,332 m) ug paborito nga day hike nga adunay tan-awon sa crater lake ug panorama sa isla ug sa Bohol Sea. Gikinahanglan ang guide ug permit gikan sa LGU/DENR para sa pagsaka.",
  },
  "Tuasan Falls": {
    titleBis: "Tuasan Falls",
    descriptionBis:
      "Usa ka kusog nga 25-metros nga busay nga nagdagayday sa batoon nga bangilid paingon sa berdeng lim-aw, ug karon dali na maabot pinaagi sa matahum nga konkretong dalan. Maayo para sa makapalab-as nga paglangoy layo sa kadaghanan.",
  },
  "Sto. Niño Cold Spring": {
    titleBis: "Sto. Niño Cold Spring",
    descriptionBis:
      "Usa ka dako nga natural nga tubod nga pool nga adunay bugnaw kaayo ug tin-aw nga tubig ibabaw sa balason nga salog nga adunay gagmay nga isda. Gilibutan sa mga picnic hut — paborito nga hunonganan sa pamilya aron magpabugnaw human sa paglibot sa isla.",
  },
  "Old Guiob Church Ruins": {
    titleBis: "Guba sa Daang Simbahan sa Guiob",
    descriptionBis:
      "Mga bungbong nga coral-stone nga gitabonan sa lumot, kampanaryo, ug kombento — nahibilin sa simbahang Espanyol sa ika-16 nga siglo nga naguba sa pagbuto niadtong 1871. Usa ka makapahinuklog ug matahum nga heritage site nga gilandongan sa mga kahoy nga siglo na ang edad.",
  },
  "Walkway to the Old Volcano & Stations of the Cross": {
    titleBis: "Walkway padulong sa Old Volcano ug Stations of the Cross",
    descriptionBis:
      "Usa ka pilgrimage trail paingon sa bakilid sa Old Vulcan nga adunay 14 ka dagkong Stations of the Cross ug lapad nga tan-awon sa baybayon. Labi nga daghang tawo panahon sa Panaad walk sa Semana Santa.",
  },
  "Taguines Lagoon": {
    titleBis: "Taguines Lagoon",
    descriptionBis:
      "Usa ka kalmado nga asul-berde nga lagoon nga gilibutan sa mga bungtod — dinhi makit-an ang zipline sa isla, kayaking, aqua park, ug mga floating restaurant. Makalingaw nga adventure stop duol sa Benoni Port.",
  },
  "Kabila Giant Clam Sanctuary": {
    titleBis: "Kabila Giant Clam Sanctuary",
    descriptionBis:
      "Usa ka conservation site sa Kabila Beach nga nag-atiman sa liboan ka taklobo (giant clam) sa nagkalainlaing klase. Mag-snorkel ibabaw sa mga clam garden uban ang guide, o tan-awa ang gagmay nga taklobo sa mga tangke sa hatchery.",
  },
  "Bura Soda Water Park": {
    titleBis: "Bura Soda Water Park",
    descriptionBis:
      "Langoy sa bugtong soda water pool sa Pilipinas — natural nga carbonated nga tubig sa tubod nga gituohang maayo sa panit. Talagsaon ug makapalab-as nga hunonganan nga adunay picnic shed ug mga tanaman.",
  },
  "Binangawan Falls": {
    titleBis: "Binangawan Falls",
    descriptionBis:
      "Usa ka misteryoso nga busay nga daghang ang-ang ibabaw sa pulahon nga bato sa bulkan, maabot pinaagi sa lisud nga pagbaktas sa lasang gikan sa Sagay. Sulit para sa mga adventurous nga hiker — kasagaran adunay balangaw nga motungha sa alisbo niini.",
  },
};

export const BISAYA_EMERGENCY: Record<string, { nameBis: string; descriptionBis: string }> = {
  "Province Emergency Services": {
    nameBis: "Serbisyo sa Emergency sa Lalawigan",
    descriptionBis: "Emergency hotline sa lalawigan",
  },
  "Province Police": {
    nameBis: "Pulis sa Lalawigan",
    descriptionBis: "Hotline sa pulis sa lalawigan",
  },
  "Camiguin General Hospital": {
    nameBis: "Camiguin General Hospital",
    descriptionBis: "Hotline sa ospital sa lalawigan",
  },
  "Province Fire Protection": {
    nameBis: "Bombero sa Lalawigan",
    descriptionBis: "Hotline sa bombero sa lalawigan",
  },
  "Mambajao Emergency Services": {
    nameBis: "Serbisyo sa Emergency sa Mambajao",
    descriptionBis: "Emergency hotline sa Mambajao",
  },
  "Mambajao Police": {
    nameBis: "Pulis sa Mambajao",
    descriptionBis: "Hotline sa pulis sa Mambajao",
  },
  "Mambajao Fire Protection": {
    nameBis: "Bombero sa Mambajao",
    descriptionBis: "Hotline sa bombero sa Mambajao",
  },
  "Mahinog Emergency Services": {
    nameBis: "Serbisyo sa Emergency sa Mahinog",
    descriptionBis: "Emergency hotline sa Mahinog",
  },
  "Mahinog Police": {
    nameBis: "Pulis sa Mahinog",
    descriptionBis: "Hotline sa pulis sa Mahinog",
  },
  "Mahinog Fire Protection": {
    nameBis: "Bombero sa Mahinog",
    descriptionBis: "Hotline sa bombero sa Mahinog",
  },
  "Guinsiliban Emergency Services": {
    nameBis: "Serbisyo sa Emergency sa Guinsiliban",
    descriptionBis: "Emergency hotline sa Guinsiliban",
  },
  "Guinsiliban Police": {
    nameBis: "Pulis sa Guinsiliban",
    descriptionBis: "Hotline sa pulis sa Guinsiliban",
  },
  "Guinsiliban Fire Protection": {
    nameBis: "Bombero sa Guinsiliban",
    descriptionBis: "Hotline sa bombero sa Guinsiliban",
  },
  "Sagay Emergency Services": {
    nameBis: "Serbisyo sa Emergency sa Sagay",
    descriptionBis: "Emergency hotline sa Sagay",
  },
  "Sagay Police": {
    nameBis: "Pulis sa Sagay",
    descriptionBis: "Hotline sa pulis sa Sagay",
  },
  "Sagay Fire Protection": {
    nameBis: "Bombero sa Sagay",
    descriptionBis: "Hotline sa bombero sa Sagay",
  },
  "Catarman Emergency Services": {
    nameBis: "Serbisyo sa Emergency sa Catarman",
    descriptionBis: "Emergency hotline sa Catarman",
  },
  "Catarman Police": {
    nameBis: "Pulis sa Catarman",
    descriptionBis: "Hotline sa pulis sa Catarman",
  },
  "Catarman Fire Protection": {
    nameBis: "Bombero sa Catarman",
    descriptionBis: "Hotline sa bombero sa Catarman",
  },
  "Catarman District Hospital": {
    nameBis: "Catarman District Hospital",
    descriptionBis: "Hotline sa Catarman District Hospital",
  },
};

/** Keyed by `titleEn`. */
export const BISAYA_EVENTS: Record<string, { titleBis: string; descriptionBis: string }> = {
  "Sinulog de Camiguin": {
    titleBis: "Sinulog de Camiguin",
    descriptionBis:
      "Debosyon sa Mambajao sa Santo Niño uban ang street dancing, prusisyon, trade fair, ug cultural presentations sa Camiguin.",
  },
  "Camiguin Farmers Kadiwa Market Day": {
    titleBis: "Adlaw sa Kadiwa Market sa mga Mag-uuma sa Camiguin",
    descriptionBis:
      "Kadiwa market sa lalawigan nga adunay fresh farm produce, produkto sa lanzones, ug local agri enterprises sa Camiguin.",
  },
  "Mambajao Coastal Protection Orientation": {
    titleBis: "Oryentasyon sa Pagpanalipod sa Baybayon sa Mambajao",
    descriptionBis:
      "Community briefing bahin sa coastal protection, CLAYGO, ug visitor guidelines sa shoreline areas sa Mambajao.",
  },
  "Panaad Holy Week Pilgrimage": {
    titleBis: "Panaad: Pilgrimage sa Semana Santa",
    descriptionBis:
      "Tuigang penitential walk sa 64-km circumferential road sa Camiguin, motapos sa Stations of the Cross sa Old Volcano, Catarman.",
  },
  "Camiguin May Festival & Santacruzan": {
    titleBis: "May Festival ug Santacruzan sa Camiguin",
    descriptionBis:
      "Mga highlight sa May fiesta sa barangay ug lungsod uban ang Santacruzan ug Rose of May celebrations sa Camiguin.",
  },
  "Sto. Niño Cold Springs Family Day": {
    titleBis: "Adlaw sa Pamilya sa Sto. Niño Cold Springs",
    descriptionBis:
      "Family-friendly community day sa Sto. Niño Cold Springs para sa lokal nga libangan ug nature tourism sa Camiguin.",
  },
  "San Juan Hibok-Hibokan Festival": {
    titleBis: "San Juan Hibok-Hibokan Festival",
    descriptionBis:
      "Pista ni St. John the Baptist sa tibuok lalawigan uban ang fluvial procession, water sports, ug beach gatherings sa Cabuan ug Agohay.",
  },
  "Mantigue Island Marine Sanctuary Day": {
    titleBis: "Adlaw sa Mantigue Island Marine Sanctuary",
    descriptionBis:
      "Adlaw sa marine awareness ug snorkel-safe orientation aron protektahan ang reef ug sanctuary guidelines sa Mantigue Island.",
  },
  "Camiguin Circumferential Road Cycling Day": {
    titleBis: "Adlaw sa Pagbisikleta sa Circumferential Road sa Camiguin",
    descriptionBis:
      "Community cycling sa scenic circumferential road sa Camiguin para sa fitness ug turismo.",
  },
  "Provincial Development Council Meeting": {
    titleBis: "Meeting sa Provincial Development Council",
    descriptionBis:
      "Quarterly meeting bahin sa mga programa sa lalawigan, infrastructure, ug local development priorities sa Camiguin.",
  },
  "Katibawasan Falls Eco-Tourism Briefing": {
    titleBis: "Briefing sa Eco-Tourism sa Katibawasan Falls",
    descriptionBis:
      "Briefing para sa bisita ug guide bahin sa trail etiquette, kaluwasan, ug conservation sa Katibawasan Falls.",
  },
  "White Island Coastal Clean-Up": {
    titleBis: "Paglimpyo sa Baybayon sa White Island",
    descriptionBis:
      "Volunteer clean-up drive aron protektahan ang sandbar sa White Island ug ang palibot nga dagat.",
  },
  "Catarman Heritage & Old Volcano Walk": {
    titleBis: "Lakaw sa Kabilin sa Catarman ug Old Volcano",
    descriptionBis:
      "Guided heritage walk sa Old Volcano walkway sa Catarman, kasaysayan sa Bonbon, ug duol nga cultural landmarks.",
  },
  "Mahinog Benoni Port Tourism Welcome Day": {
    titleBis: "Adlaw sa Pag-abiabi sa mga Turista sa Benoni Port, Mahinog",
    descriptionBis:
      "Welcome-day orientation para sa mga moabot sa Benoni Port uban ang tourism info, transport tips, ug island itinerary guides.",
  },
  "Camiguin Agri-Trade and Food Fair": {
    titleBis: "Agri-Trade ug Food Fair sa Camiguin",
    descriptionBis:
      "Pasundayag sa farm produce, produkto sa lanzones, handicrafts, ug local food enterprises sa Camiguin.",
  },
  "Lanzones Festival": {
    titleBis: "Lanzones Festival",
    descriptionBis:
      "Pangunang harvest festival sa Camiguin uban ang street dancing, Ugmad trade fair, konsiyerto, ug selebrasyon sa lanzones sa Mambajao.",
  },
  "Guinsiliban Cultural Community Night": {
    titleBis: "Gabii sa Kultura sa Komunidad sa Guinsiliban",
    descriptionBis:
      "Gabii sa cultural program uban ang performers gikan Guinsiliban, local food stalls, ug community music.",
  },
  "Sunken Cemetery Candle-Lighting Vigil": {
    titleBis: "Pagdagkot og Kandila sa Sunken Cemetery",
    descriptionBis:
      "Gabii sa paghinumdom ug heritage remembrance sa iconic Sunken Cemetery sa Catarman, Camiguin.",
  },
  "Camiguin Tourism Stakeholders Forum": {
    titleBis: "Forum sa mga Stakeholder sa Turismo sa Camiguin",
    descriptionBis:
      "Forum para sa resorts, tour operators, LGU, ug komunidad bahin sa sustainable tourism ug mas maayong visitor experience.",
  },
  "Dive Camiguin Awareness Weekend": {
    titleBis: "Dive Camiguin Awareness Weekend",
    descriptionBis:
      "Dive ug snorkel awareness weekend nga nag-highlight sa dive sites sa Camiguin, proteksyon sa reef, ug responsible diving.",
  },
  "Mount Hibok-Hibok Eco-Trail Day": {
    titleBis: "Adlaw sa Eco-Trail sa Mount Hibok-Hibok",
    descriptionBis:
      "Guided eco-trail orientation ug responsible hiking advocacy para sa Hibok-Hibok ug duol nga natural sites.",
  },
  "Camiguin Christmas Festival of Lights": {
    titleBis: "Camiguin Christmas Festival of Lights",
    descriptionBis:
      "Holiday lighting sa isla, community night market, ug Christmas cultural presentations sa Mambajao.",
  },
};

export const BISAYA_PAGES: Record<string, { titleBis: string; contentBis: string }> = {
  "citizens-charter": {
    titleBis: "Citizens' Charter",
    contentBis:
      "Ang Citizens' Charter usa ka opisyal nga dokumento nga nagpakita sa mga serbisyo sa gobyerno lakip ang mga kinahanglanon, bayad, ug oras sa pagproseso.",
  },
};

// ---------- Interactive map (keyed by slug; applied after seedMapEngine) ----------

export const BISAYA_MAP_CATEGORIES: Record<string, { nameBis: string }> = {
  marine: { nameBis: "Santuwaryo sa Kadagatan" },
};

export const BISAYA_MAP_ATTRACTIONS: Record<string, { nameBis?: string; entranceFeeBis?: string }> = {
  "volcano-observatory": { nameBis: "Obserbatoryo sa Bulkan" },
  "giant-clam-sanctuary": {
    nameBis: "Santuwaryo sa Taklobo",
    entranceFeeBis: "Bayad sa eco / pagtan-aw",
  },
  "mt-hibok-hibok": { entranceFeeBis: "Bayad sa guide ug pagsaka" },
  airport: { entranceFeeBis: "Tiket sa eroplano" },
  "benoni-port": { entranceFeeBis: "Bayad sa terminal / tiket sa barko" },
};

export const BISAYA_MAP_ROUTES: Record<string, { nameBis?: string; travelTimeBis?: string }> = {
  "boat-benoni-mantigue": { nameBis: "Pantalan sa Benoni → Mantigue Island" },
  "road-mambajao-katibawasan": { nameBis: "Tugpahanan sa Camiguin → Katibawasan Falls" },
  "road-capitol-ardent": { nameBis: "Pantalan sa Balbagon → Ardent Hot Spring" },
  "road-sunken-loop": {
    nameBis: "Sunken Cemetery → Guba sa Daang Simbahan",
    travelTimeBis: "~5–10 minutos",
  },
  "road-south-springs": {
    nameBis: "Sto Niño Cold Spring → Macau Springs",
    travelTimeBis: "~15 minutos",
  },
  "road-to-benoni": { nameBis: "Katibawasan Falls → Pantalan sa Benoni" },
  "boat-yumbing-white-island": { nameBis: "Pantalan sa Balbagon → White Island" },
};

export const BISAYA_MAP_FEATURES: Record<string, { nameBis: string }> = {
  "forest-north": { nameBis: "Amihanang lasang" },
  "forest-central": { nameBis: "Lasang sa tunga" },
  "forest-south": { nameBis: "Habagatang lasang" },
  "inland-road-north": { nameBis: "Amihanang dalan sa sulod sa isla" },
  "inland-road-east": { nameBis: "Sidlakang dalan sa sulod sa isla" },
  "inland-road-south": { nameBis: "Habagatang dalan sa sulod sa isla" },
  "shallow-reef-north": { nameBis: "Amihanang mabaw nga bahura" },
  "shallow-reef-east": { nameBis: "Sidlakang mabaw nga bahura" },
  "ocean-base": { nameBis: "Dagat sa Bohol" },
  "master-road-0": { nameBis: "Bahin sa dalan 1" },
  "master-road-1": { nameBis: "Bahin sa dalan 2" },
  "master-road-2": { nameBis: "Bahin sa dalan 3" },
  "master-road-3": { nameBis: "Bahin sa dalan 4" },
};
