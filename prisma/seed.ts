import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { SETTING_DEFAULTS } from "../features/settings/defaults";
import { SETTING_GROUPS } from "../features/admin/settings-definitions";

// Match Next.js env priority so seed writes to the same DB the app reads.
loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });

const prisma = new PrismaClient();

function redactDatabaseUrl(url: string | undefined) {
  if (!url) return "(missing DATABASE_URL)";
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}:${parsed.port || "5432"}${parsed.pathname}`;
  } catch {
    return "(invalid DATABASE_URL)";
  }
}

function settingGroupForKey(key: string) {
  for (const group of SETTING_GROUPS) {
    if (group.fields.some((field) => field.key === key)) return group.id;
  }
  return "general";
}

async function upsertByTitleEn<T extends { titleEn: string }>(
  model: {
    findFirst: (args: { where: { titleEn: string } }) => Promise<{ id: string } | null>;
    update: (args: { where: { id: string }; data: T }) => Promise<unknown>;
    create: (args: { data: T }) => Promise<unknown>;
  },
  item: T
) {
  const existing = await model.findFirst({ where: { titleEn: item.titleEn } });
  if (existing) {
    await model.update({ where: { id: existing.id }, data: item });
  } else {
    await model.create({ data: item });
  }
}

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      description: "Full system administrator",
    },
  });

  const editorRole = await prisma.role.upsert({
    where: { name: "editor" },
    update: {},
    create: {
      name: "editor",
      description: "Content editor",
    },
  });

  const permissions = [
    { name: "manage_services", module: "services" },
    { name: "manage_directories", module: "directories" },
    { name: "manage_downloads", module: "downloads" },
    { name: "manage_announcements", module: "announcements" },
    { name: "manage_faqs", module: "faqs" },
    { name: "manage_events", module: "events" },
    { name: "manage_emergency", module: "emergency" },
    { name: "manage_tourism", module: "tourism" },
    { name: "manage_users", module: "users" },
    { name: "manage_settings", module: "settings" },
    { name: "manage_building", module: "building" },
    { name: "manage_citizens_charter", module: "citizens-charter" },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }

  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@camiguin.gov.ph" },
    update: {},
    create: {
      email: "admin@camiguin.gov.ph",
      password: hashedPassword,
      name: "System Administrator",
      roleId: adminRole.id,
    },
  });

  // Seed all known settings (branding, welcome, footer image, downloads, promo video, etc.)
  // so a fresh pull + db:seed restores the local kiosk experience.
  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value, group: settingGroupForKey(key) },
      create: { key, value, group: settingGroupForKey(key) },
    });
  }

  const promoVideoPath = SETTING_DEFAULTS.promo_video_url.replace(/^\//, "");
  const promoVideoAbs = resolve(process.cwd(), "public", promoVideoPath);
  if (!existsSync(promoVideoAbs)) {
    console.warn(
      `[seed] Promo video missing at public/${promoVideoPath}. Place islebethere.webm under public/videos/promo/.`
    );
  } else {
    console.log(`[seed] Promo video ready: /${promoVideoPath}`);
  }

  const quickLinks = [
    { slug: "business-permit", titleEn: "Business Permit", titleFil: "Permit ng Negosyo", icon: "Briefcase", href: "/services/business-permit", sortOrder: 1 },
    { slug: "cedula", titleEn: "Cedula / Community Tax", titleFil: "Cedula / Buwis sa Komunidad", icon: "FileText", href: "/services/cedula", sortOrder: 2 },
    { slug: "barangay-clearance", titleEn: "Barangay Clearance", titleFil: "Barangay Clearance", icon: "Shield", href: "/services/barangay-clearance", sortOrder: 3 },
    { slug: "building-permit", titleEn: "Building Permit", titleFil: "Pahintulot sa Gusali", icon: "Building2", href: "/services/building-permit", sortOrder: 4 },
    { slug: "traffic-mv", titleEn: "Traffic / MV Services", titleFil: "Trapiko / Serbisyo ng MV", icon: "Car", href: "/services/traffic-mv", sortOrder: 5 },
  ];

  for (const link of quickLinks) {
    await prisma.quickLink.upsert({
      where: { slug: link.slug },
      update: link,
      create: link,
    });
  }

  const homepageCards = [
    { slug: "citizens-charter", titleEn: "Citizens' Charter", titleFil: "Citizens' Charter", descriptionEn: "Service standards, processing times, and requirements.", descriptionFil: "Mga pamantayan ng serbisyo, oras ng pagproseso, at mga kinakailangan.", icon: "FileCheck", iconUrl: "/images/home-icons/icon-citizens-charter.png", color: "blue", href: "/citizens-charter", sortOrder: 1 },
    { slug: "building-directory", titleEn: "Building Directory", titleFil: "Direktoryo ng Gusali", descriptionEn: "Find offices and rooms inside the capitol building.", descriptionFil: "Hanapin ang mga opisina at silid sa loob ng capitol building.", icon: "Building", iconUrl: "/images/home-icons/icon-building-directory.png", color: "green", href: "/building-directory", sortOrder: 2 },
    { slug: "map", titleEn: "Map of Camiguin", titleFil: "Mapa ng Camiguin", descriptionEn: "Explore municipalities, landmarks, and key locations.", descriptionFil: "Tuklasin ang mga munisipalidad, palatandaan, at mahahalagang lokasyon.", icon: "Map", iconUrl: "/images/home-icons/icon-map.png", color: "teal", href: "/map", sortOrder: 3 },
    { slug: "government-directory", titleEn: "Government Directory", titleFil: "Direktoryo ng Pamahalaan", descriptionEn: "Departments, officials, and contact information.", descriptionFil: "Mga departamento, opisyal, at impormasyon sa pakikipag-ugnayan.", icon: "Users", iconUrl: "/images/home-icons/icon-government-directory.png", color: "purple", href: "/government-directory", sortOrder: 4 },
    { slug: "news", titleEn: "News & Announcements", titleFil: "Balita at Anunsyo", descriptionEn: "Latest advisories, programs, and public notices.", descriptionFil: "Pinakabagong mga abiso, programa, at pampublikong paunawa.", icon: "Megaphone", iconUrl: "/images/home-icons/icon-news.png", color: "orange", href: "/news", sortOrder: 5 },
    { slug: "download-center", titleEn: "Download Center", titleFil: "Sentro ng Pag-download", descriptionEn: "Forms, guidelines, and official documents.", descriptionFil: "Mga form, gabay, at opisyal na dokumento.", icon: "Download", iconUrl: "/images/home-icons/icon-download-center.png", color: "red-orange", href: "/download-center", sortOrder: 6 },
    { slug: "tourism", titleEn: "Tourism Information", titleFil: "Impormasyon sa Turismo", descriptionEn: "Attractions, activities, and travel tips.", descriptionFil: "Mga atraksyon, aktibidad, at mga tip sa paglalakbay.", icon: "Palmtree", iconUrl: "/images/home-icons/icon-tourism.png", color: "pink", href: "/tourism", sortOrder: 7 },
    { slug: "emergency", titleEn: "Emergency Contacts", titleFil: "Mga Contact sa Emergency", descriptionEn: "Hotlines for police, fire, health, and rescue.", descriptionFil: "Mga hotline para sa pulis, bumbero, kalusugan, at rescue.", icon: "Phone", iconUrl: "/images/home-icons/icon-emergency.png", color: "red", href: "/emergency", sortOrder: 8 },
    { slug: "events", titleEn: "Events Calendar", titleFil: "Kalendaryo ng mga Kaganapan", descriptionEn: "Upcoming festivals, meetings, and activities.", descriptionFil: "Mga paparating na festival, pagpupulong, at aktibidad.", icon: "Calendar", iconUrl: "/images/home-icons/icon-events.png", color: "violet", href: "/events", sortOrder: 9 },
    { slug: "faq", titleEn: "Frequently Asked Questions", titleFil: "Mga Madalas Itanong", descriptionEn: "Camiguin FAQs and chat with Cami, your island assistant.", descriptionFil: "Mga FAQ tungkol sa Camiguin at chat kay Cami, ang assistant ng isla.", icon: "HelpCircle", iconUrl: "/images/home-icons/icon-faq.png", color: "sky", href: "/faq", sortOrder: 10 },
  ];

  for (const card of homepageCards) {
    await prisma.homepageCard.upsert({
      where: { slug: card.slug },
      update: card,
      create: card,
    });
  }

  // Remove retired homepage cards (e.g. old "I Need Help With..." /help card).
  // Upsert alone never deletes rows that were removed from the seed list.
  await prisma.homepageCard.deleteMany({
    where: { slug: { notIn: homepageCards.map((card) => card.slug) } },
  });

  const services = [
    {
      slug: "business-permit",
      titleEn: "Business Permit",
      titleFil: "Permit ng Negosyo",
      descriptionEn: "Apply for a new business permit or renew an existing one.",
      descriptionFil: "Mag-apply para sa bagong permit sa negosyo o mag-renew ng umiiral na permit.",
      requirementsEn: "Valid ID, Barangay Clearance, DTI/SEC Registration, Lease Contract",
      requirementsFil: "Valid na ID, Barangay Clearance, DTI/SEC Registration, Lease Contract",
      documentsEn: "Application Form, Sketch of Business Location, Fire Safety Certificate",
      documentsFil: "Application Form, Sketch ng Lokasyon ng Negosyo, Fire Safety Certificate",
      officeLocation: "Business Permits and Licensing Office, Capitol Building, Ground Floor",
      officeHours: "Monday to Friday, 8:00 AM – 5:00 PM",
      processingTime: "3-5 working days",
      fee: "Varies by business type",
      contactInfo: "(088) 387-1001",
      category: "business",
      icon: "Briefcase",
      color: "blue",
    },
    {
      slug: "cedula",
      titleEn: "Cedula / Community Tax",
      titleFil: "Cedula / Buwis sa Komunidad",
      descriptionEn: "Obtain your community tax certificate (cedula).",
      descriptionFil: "Kumuha ng iyong community tax certificate (cedula).",
      requirementsEn: "Valid ID, Proof of Income (if employed)",
      requirementsFil: "Valid na ID, Patunay ng Kita (kung employed)",
      officeLocation: "Treasurer's Office, Capitol Building",
      officeHours: "Monday to Friday, 8:00 AM – 5:00 PM",
      processingTime: "Same day",
      fee: "Based on income bracket",
      category: "tax",
      icon: "FileText",
      color: "green",
    },
    {
      slug: "barangay-clearance",
      titleEn: "Barangay Clearance",
      titleFil: "Barangay Clearance",
      descriptionEn: "Request a barangay clearance certificate.",
      descriptionFil: "Humiling ng barangay clearance certificate.",
      requirementsEn: "Valid ID, Proof of Residency",
      requirementsFil: "Valid na ID, Patunay ng Paninirahan",
      officeLocation: "Your respective Barangay Hall",
      processingTime: "1-2 working days",
      fee: "Minimal fee",
      category: "clearance",
      icon: "Shield",
      color: "teal",
    },
    {
      slug: "building-permit",
      titleEn: "Building Permit",
      titleFil: "Pahintulot sa Gusali",
      descriptionEn: "Apply for construction and building permits.",
      descriptionFil: "Mag-apply para sa construction at building permits.",
      requirementsEn: "Lot Title, Building Plans, Structural Design",
      requirementsFil: "Lot Title, Building Plans, Structural Design",
      officeLocation: "Engineering Office, Capitol Building",
      officeHours: "Monday to Friday, 8:00 AM – 5:00 PM",
      processingTime: "10-15 working days",
      category: "permit",
      icon: "Building2",
      color: "purple",
    },
    {
      slug: "traffic-mv",
      titleEn: "Traffic / MV Services",
      titleFil: "Trapiko / Serbisyo ng MV",
      descriptionEn: "Motor vehicle registration and traffic-related services.",
      descriptionFil: "Rehistro ng motor vehicle at mga serbisyo na may kaugnayan sa trapiko.",
      requirementsEn: "Valid ID, OR/CR, Insurance",
      requirementsFil: "Valid na ID, OR/CR, Insurance",
      officeLocation: "LTO Camiguin District Office",
      processingTime: "Same day to 3 days",
      category: "traffic",
      icon: "Car",
      color: "orange",
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: service,
      create: service,
    });
  }

  const directories = [
    {
      type: "building",
      nameEn: "Governor's Office",
      nameFil: "Tanggapan ng Gobernador",
      floor: "2nd Floor",
      room: "201",
      building: "Capitol Building",
      contactNumber: "(088) 387-1001",
      headName: "Hon. Xavier Jesus D. Romualdo",
      email: "governor@camiguin.gov.ph",
      descriptionEn:
        "Office of the Provincial Governor of Camiguin. Current governor: Hon. Xavier Jesus “XJ” D. Romualdo.",
      descriptionFil:
        "Tanggapan ng Provincial Governor ng Camiguin. Kasalukuyang gobernador: Hon. Xavier Jesus “XJ” D. Romualdo.",
      sortOrder: 1,
    },
    { type: "building", nameEn: "Treasurer's Office", nameFil: "Tanggapan ng Ingat-Yaman", floor: "Ground Floor", room: "105", building: "Capitol Building", contactNumber: "(088) 387-1002", sortOrder: 2 },
    { type: "building", nameEn: "Business Permits Office", nameFil: "Tanggapan ng Business Permits", floor: "Ground Floor", room: "108", building: "Capitol Building", contactNumber: "(088) 387-1003", sortOrder: 3 },
    {
      type: "government",
      nameEn: "Office of the Provincial Governor",
      nameFil: "Office of the Provincial Governor",
      department: "Office of the Governor",
      headName: "Hon. Xavier Jesus D. Romualdo",
      contactNumber: "(088) 387-1001",
      email: "governor@camiguin.gov.ph",
      descriptionEn:
        "Provincial Governor of Camiguin: Hon. Xavier Jesus “XJ” D. Romualdo. Capitol Building, Mambajao.",
      descriptionFil:
        "Provincial Governor ng Camiguin: Hon. Xavier Jesus “XJ” D. Romualdo. Capitol Building, Mambajao.",
      sortOrder: 0,
    },
    {
      type: "government",
      nameEn: "Office of the Provincial Administrator",
      nameFil: "Office of the Provincial Administrator",
      department: "Administration",
      headName: "Abuzo, Rita C.",
      contactNumber: "0926-577-6286",
      sortOrder: 1,
    },
    {
      type: "government",
      nameEn: "Provincial General Services Department",
      nameFil: "Provincial General Services Department",
      department: "General Services",
      headName: "Bacolcol, Rey B.",
      contactNumber: "0928-688-7688",
      sortOrder: 2,
    },
    {
      type: "government",
      nameEn: "Provincial Budget Department",
      nameFil: "Provincial Budget Department",
      department: "Budget",
      headName: "Marapao, Rutchie S.",
      contactNumber: null,
      sortOrder: 3,
    },
    {
      type: "government",
      nameEn: "Provincial Accounting Department",
      nameFil: "Provincial Accounting Department",
      department: "Accounting",
      headName: "Del Bando, Tito Anthony S.",
      contactNumber: "0917-634-3391",
      sortOrder: 4,
    },
    {
      type: "government",
      nameEn: "Provincial Treasury Department",
      nameFil: "Provincial Treasury Department",
      department: "Treasury",
      headName: "Pacto, Mary Lussel S.",
      contactNumber: "0926-658-0636",
      sortOrder: 5,
    },
    {
      type: "government",
      nameEn: "Provincial Assessments Department",
      nameFil: "Provincial Assessments Department",
      department: "Assessments",
      headName: "Tabamo, Rizza C.",
      contactNumber: "0975-641-2186",
      sortOrder: 6,
    },
    {
      type: "government",
      nameEn: "Provincial Health Department",
      nameFil: "Provincial Health Department",
      department: "Health",
      headName: "Naman, Magnolia A.",
      contactNumber: "0911-709-0820",
      sortOrder: 7,
    },
    {
      type: "government",
      nameEn: "Provincial Social Welfare and Development Department",
      nameFil: "Provincial Social Welfare and Development Department",
      department: "Social Welfare",
      headName: "Baclayo, Maida G.",
      contactNumber: "0926-846-2625",
      sortOrder: 8,
    },
    {
      type: "government",
      nameEn: "Provincial Agriculture Department",
      nameFil: "Provincial Agriculture Department",
      department: "Agriculture",
      headName: "Chan, Aida G.",
      contactNumber: "0995-216-5953",
      sortOrder: 9,
    },
    {
      type: "government",
      nameEn: "Provincial Veterinary Department",
      nameFil: "Provincial Veterinary Department",
      department: "Veterinary",
      headName: "Gamo, Lordgin V.",
      contactNumber: "0956-530-064",
      sortOrder: 10,
    },
    {
      type: "government",
      nameEn: "Provincial Engineering Department",
      nameFil: "Provincial Engineering Department",
      department: "Engineering",
      headName: "Añana, Lorenzo S.",
      contactNumber: "0935-619-0586",
      sortOrder: 11,
    },
    {
      type: "government",
      nameEn: "Provincial Tourism Department",
      nameFil: "Provincial Tourism Department",
      department: "Tourism",
      headName: "Dael, Candice Naomi B.",
      contactNumber: "0917-706-0688",
      sortOrder: 12,
    },
    {
      type: "government",
      nameEn: "Provincial Legal Department",
      nameFil: "Provincial Legal Department",
      department: "Legal",
      headName: "Sagocsoc, Johann Mae M.",
      contactNumber: null,
      sortOrder: 13,
    },
    {
      type: "government",
      nameEn: "Provincial Planning and Development Department",
      nameFil: "Provincial Planning and Development Department",
      department: "Planning and Development",
      headName: "Oclarit, Leonides G.",
      contactNumber: "0926-737-2520",
      sortOrder: 14,
    },
  ];

  for (const dir of directories) {
    const existing = await prisma.directory.findFirst({
      where: { type: dir.type, nameEn: dir.nameEn },
    });
    if (existing) {
      await prisma.directory.update({ where: { id: existing.id }, data: dir });
    } else {
      await prisma.directory.create({ data: dir });
    }
  }

  const governmentNames = directories
    .filter((dir) => dir.type === "government")
    .map((dir) => dir.nameEn);
  await prisma.directory.deleteMany({
    where: { type: "government", nameEn: { notIn: governmentNames } },
  });

  const downloads = [
    {
      titleEn: "Business Permit Application Form",
      titleFil: "Form ng Application para sa Business Permit",
      descriptionEn: "Apply for a new business permit or renew an existing one with this official form.",
      descriptionFil: "Gamitin ang form na ito para mag-apply o mag-renew ng business permit.",
      fileUrl: "/downloads/business-permit-form.pdf",
      fileName: "business-permit-form.pdf",
      fileSize: "120 KB",
      category: "business",
      sortOrder: 1,
    },
    {
      titleEn: "Building Permit Application",
      titleFil: "Application para sa Building Permit",
      descriptionEn: "Required application form for new construction, renovation, and building permits.",
      descriptionFil: "Kinakailangang application form para sa bagong construction, renovation, at building permit.",
      fileUrl: "/downloads/building-permit-form.pdf",
      fileName: "building-permit-form.pdf",
      fileSize: "145 KB",
      category: "permit",
      sortOrder: 2,
    },
    {
      titleEn: "Citizens' Charter Handbook",
      titleFil: "Citizens' Charter Handbook",
      descriptionEn: "Complete 2026 First Edition of the Provincial Government of Camiguin Citizens' Charter.",
      descriptionFil: "Kumpletong 2026 First Edition ng Citizens' Charter ng Lalawigan ng Camiguin.",
      fileUrl: "/downloads/citizens-charter.pdf",
      fileName: "citizens-charter.pdf",
      fileSize: "5.0 MB",
      category: "general",
      sortOrder: 3,
    },
    {
      titleEn: "Cedula / Community Tax Application",
      titleFil: "Application para sa Cedula / Community Tax",
      descriptionEn: "Form for requesting a Community Tax Certificate (cedula) at the Treasurer's Office.",
      descriptionFil: "Form para humiling ng Community Tax Certificate (cedula) sa Treasurer's Office.",
      fileUrl: "/downloads/cedula-application-form.pdf",
      fileName: "cedula-application-form.pdf",
      fileSize: "95 KB",
      category: "tax",
      sortOrder: 4,
    },
    {
      titleEn: "Barangay Clearance Request Form",
      titleFil: "Form ng Barangay Clearance",
      descriptionEn: "Template request form for barangay clearance used for employment, business, and local transactions.",
      descriptionFil: "Template request form para sa barangay clearance na ginagamit sa employment, business, at lokal na transaksyon.",
      fileUrl: "/downloads/barangay-clearance-request.pdf",
      fileName: "barangay-clearance-request.pdf",
      fileSize: "88 KB",
      category: "forms",
      sortOrder: 5,
    },
    {
      titleEn: "Real Property Tax Declaration Form",
      titleFil: "Form ng Real Property Tax Declaration",
      descriptionEn: "Declaration form for real property tax assessment and payment guidance.",
      descriptionFil: "Declaration form para sa assessment at bayad ng real property tax.",
      fileUrl: "/downloads/real-property-tax-declaration.pdf",
      fileName: "real-property-tax-declaration.pdf",
      fileSize: "160 KB",
      category: "tax",
      sortOrder: 6,
    },
    {
      titleEn: "Marriage License Requirements Checklist",
      titleFil: "Checklist ng Mga Kinakailangan sa Marriage License",
      descriptionEn: "Checklist of documents and steps needed to apply for a marriage license.",
      descriptionFil: "Checklist ng mga dokumento at hakbang para mag-apply ng marriage license.",
      fileUrl: "/downloads/marriage-license-requirements.pdf",
      fileName: "marriage-license-requirements.pdf",
      fileSize: "110 KB",
      category: "guidelines",
      sortOrder: 7,
    },
    {
      titleEn: "Sanitary Permit Application",
      titleFil: "Application para sa Sanitary Permit",
      descriptionEn: "Application form for sanitary permits for food establishments and related businesses.",
      descriptionFil: "Application form para sa sanitary permit ng food establishments at kaugnay na negosyo.",
      fileUrl: "/downloads/sanitary-permit-application.pdf",
      fileName: "sanitary-permit-application.pdf",
      fileSize: "102 KB",
      category: "health",
      sortOrder: 8,
    },
    {
      titleEn: "Zoning Clearance Form",
      titleFil: "Form ng Zoning Clearance",
      descriptionEn: "Form used to request zoning clearance before construction or business location approval.",
      descriptionFil: "Form para humiling ng zoning clearance bago magtayo o magnegosyo.",
      fileUrl: "/downloads/zoning-clearance-form.pdf",
      fileName: "zoning-clearance-form.pdf",
      fileSize: "98 KB",
      category: "permit",
      sortOrder: 9,
    },
    {
      titleEn: "Occupancy Permit Checklist",
      titleFil: "Checklist ng Occupancy Permit",
      descriptionEn: "Requirements checklist before requesting an occupancy permit for completed buildings.",
      descriptionFil: "Checklist ng mga kinakailangan bago humiling ng occupancy permit.",
      fileUrl: "/downloads/occupancy-permit-checklist.pdf",
      fileName: "occupancy-permit-checklist.pdf",
      fileSize: "84 KB",
      category: "permit",
      sortOrder: 10,
    },
    {
      titleEn: "Tourism Accreditation Application",
      titleFil: "Application para sa Tourism Accreditation",
      descriptionEn: "Application packet for tourism enterprise accreditation in Camiguin.",
      descriptionFil: "Application packet para sa accreditation ng tourism enterprise sa Camiguin.",
      fileUrl: "/downloads/tourism-accreditation-form.pdf",
      fileName: "tourism-accreditation-form.pdf",
      fileSize: "175 KB",
      category: "tourism",
      sortOrder: 11,
    },
    {
      titleEn: "Job Order Application Form",
      titleFil: "Form ng Job Order Application",
      descriptionEn: "Employment request form for job order and contractual opportunities in the provincial government.",
      descriptionFil: "Employment request form para sa job order at contractual opportunities sa pamahalaang panlalawigan.",
      fileUrl: "/downloads/job-order-application.pdf",
      fileName: "job-order-application.pdf",
      fileSize: "90 KB",
      category: "employment",
      sortOrder: 12,
    },
    {
      titleEn: "Scholarship Application Form",
      titleFil: "Form ng Scholarship Application",
      descriptionEn: "Application form for provincial scholarship and educational assistance programs.",
      descriptionFil: "Application form para sa provincial scholarship at educational assistance programs.",
      fileUrl: "/downloads/scholarship-application-form.pdf",
      fileName: "scholarship-application-form.pdf",
      fileSize: "130 KB",
      category: "social",
      sortOrder: 13,
    },
    {
      titleEn: "Senior Citizen ID Application",
      titleFil: "Application para sa Senior Citizen ID",
      descriptionEn: "Form and checklist for applying for a Senior Citizen Identification Card.",
      descriptionFil: "Form at checklist para mag-apply ng Senior Citizen Identification Card.",
      fileUrl: "/downloads/senior-citizen-id-application.pdf",
      fileName: "senior-citizen-id-application.pdf",
      fileSize: "78 KB",
      category: "social",
      sortOrder: 14,
    },
    {
      titleEn: "PWD ID Application Form",
      titleFil: "Form ng PWD ID Application",
      descriptionEn: "Application form for Persons with Disability ID and related benefits.",
      descriptionFil: "Application form para sa PWD ID at kaugnay na benepisyo.",
      fileUrl: "/downloads/pwd-id-application.pdf",
      fileName: "pwd-id-application.pdf",
      fileSize: "82 KB",
      category: "social",
      sortOrder: 15,
    },
    {
      titleEn: "Disaster Preparedness Guide",
      titleFil: "Gabay sa Paghahanda sa Sakuna",
      descriptionEn: "Community guide for typhoon, earthquake, and emergency preparedness in Camiguin.",
      descriptionFil: "Gabay sa komunidad para sa paghahanda sa bagyo, lindol, at emergency sa Camiguin.",
      fileUrl: "/downloads/disaster-preparedness-guide.pdf",
      fileName: "disaster-preparedness-guide.pdf",
      fileSize: "2.1 MB",
      category: "guidelines",
      sortOrder: 16,
    },
    {
      titleEn: "Solid Waste Management Ordinance Summary",
      titleFil: "Buod ng Solid Waste Management Ordinance",
      descriptionEn: "Summary of local solid waste rules, segregation guidelines, and penalties.",
      descriptionFil: "Buod ng lokal na solid waste rules, segregation guidelines, at penalties.",
      fileUrl: "/downloads/solid-waste-management-ordinance.pdf",
      fileName: "solid-waste-management-ordinance.pdf",
      fileSize: "250 KB",
      category: "ordinance",
      sortOrder: 17,
    },
    {
      titleEn: "Investment Incentives Brochure",
      titleFil: "Brochure ng Investment Incentives",
      descriptionEn: "Brochure outlining investment incentives and business opportunities in Camiguin.",
      descriptionFil: "Brochure na nagpapaliwanag ng investment incentives at business opportunities sa Camiguin.",
      fileUrl: "/downloads/investment-incentives-brochure.pdf",
      fileName: "investment-incentives-brochure.pdf",
      fileSize: "1.4 MB",
      category: "brochures",
      sortOrder: 18,
    },
    {
      titleEn: "Camiguin Tourism Brochure",
      titleFil: "Brochure ng Turismo ng Camiguin",
      descriptionEn: "Visitor brochure featuring key destinations, festivals, and travel tips.",
      descriptionFil: "Brochure para sa bisita na may mga atraksyon, festival, at tip sa paglalakbay.",
      fileUrl: "/downloads/camiguin-tourism-brochure.pdf",
      fileName: "camiguin-tourism-brochure.pdf",
      fileSize: "3.2 MB",
      category: "tourism",
      sortOrder: 19,
    },
    {
      titleEn: "Annual Investment Program Summary",
      titleFil: "Buod ng Annual Investment Program",
      descriptionEn: "Public summary of the province's annual investment priorities and programs.",
      descriptionFil: "Pampublikong buod ng annual investment priorities at programs ng lalawigan.",
      fileUrl: "/downloads/annual-investment-program-summary.pdf",
      fileName: "annual-investment-program-summary.pdf",
      fileSize: "680 KB",
      category: "reports",
      sortOrder: 20,
    },
    {
      titleEn: "Gender and Development Plan Highlights",
      titleFil: "Mga Highlight ng Gender and Development Plan",
      descriptionEn: "Highlights of the provincial Gender and Development plan and key programs.",
      descriptionFil: "Mga highlight ng provincial Gender and Development plan at mga pangunahing programa.",
      fileUrl: "/downloads/gender-development-plan-highlights.pdf",
      fileName: "gender-development-plan-highlights.pdf",
      fileSize: "420 KB",
      category: "reports",
      sortOrder: 21,
    },
    {
      titleEn: "Capitol Office Directory",
      titleFil: "Direktoryo ng Opisina sa Capitol",
      descriptionEn: "Directory of provincial offices, contact numbers, and office locations.",
      descriptionFil: "Direktoryo ng mga provincial offices, contact numbers, at lokasyon ng opisina.",
      fileUrl: "/downloads/office-directory.pdf",
      fileName: "office-directory.pdf",
      fileSize: "210 KB",
      category: "general",
      sortOrder: 22,
    },
    {
      titleEn: "Public Hearing Schedule",
      titleFil: "Iskedyul ng Public Hearing",
      descriptionEn: "Current schedule of public hearings and community consultations.",
      descriptionFil: "Kasalukuyang iskedyul ng public hearings at community consultations.",
      fileUrl: "/downloads/public-hearing-schedule.pdf",
      fileName: "public-hearing-schedule.pdf",
      fileSize: "95 KB",
      category: "general",
      sortOrder: 23,
    },
  ];

  for (const download of downloads) {
    await upsertByTitleEn(prisma.download, download);
  }

  const faqs = [
    {
      questionEn: "What information can I find on this kiosk?",
      questionFil: "Anong impormasyon ang makikita sa kiosk na ito?",
      questionBis: "Unsang impormasyon ang makita niining kiosk?",
      answerEn:
        "This LGU Information & Visitor Experience Kiosk provides Camiguin provincial information, including: Citizens’ Charter, Government Directory, News & Announcements, Download Center, Tourism Information, Emergency Contacts, Events Calendar, FAQ, Maps, and Building Directory. Use Smart Search or Cami for quick help.",
      answerFil:
        "Ang LGU Information & Visitor Experience Kiosk na ito ay nagbibigay ng impormasyon ng Lalawigan ng Camiguin, kabilang ang: Citizens’ Charter, Government Directory, News & Announcements, Download Center, Tourism Information, Emergency Contacts, Events Calendar, FAQ, Maps, at Building Directory. Gamitin ang Smart Search o si Cami para sa mabilis na tulong.",
      answerBis:
        "Kining LGU Information & Visitor Experience Kiosk naghatag og impormasyon sa Probinsya sa Camiguin, lakip ang: Citizens’ Charter, Government Directory, News & Announcements, Download Center, Tourism Information, Emergency Contacts, Events Calendar, FAQ, Maps, ug Building Directory. Gamita ang Smart Search o si Cami para sa dali nga tabang.",
      category: "general",
      sortOrder: 0,
    },
    {
      questionEn: "What are the provincial Capitol office hours?",
      questionFil: "Ano ang oras ng opisina sa Capitol ng lalawigan?",
      answerEn:
        "Provincial Capitol offices generally operate Monday to Friday, 8:00 AM to 5:00 PM (excluding holidays). For specific offices, check the Government Directory or Building Directory modules on this kiosk.",
      answerFil:
        "Ang mga opisina sa Provincial Capitol ay karaniwang bukas Lunes hanggang Biyernes, 8:00 AM hanggang 5:00 PM (maliban sa holiday). Para sa partikular na opisina, tingnan ang Government Directory o Building Directory sa kiosk na ito.",
      category: "general",
      sortOrder: 1,
    },
    {
      questionEn: "How do I apply for a business permit in Camiguin?",
      questionFil: "Paano mag-apply ng business permit sa Camiguin?",
      answerEn:
        "Go to the Business Permits Office at the Capitol Building (Ground Floor, Room 108) with your requirements, or open Quick Start / Services → Business Permit on this kiosk. You can also download the Business Permit Application Form from the Download Center.",
      answerFil:
        "Pumunta sa Business Permits Office sa Capitol Building (Ground Floor, Room 108) dala ang mga requirements, o buksan ang Quick Start / Services → Business Permit sa kiosk. Maaari ring i-download ang Business Permit Application Form sa Download Center.",
      category: "services",
      sortOrder: 2,
    },
    {
      questionEn: "Where can I get a cedula (community tax certificate)?",
      questionFil: "Saan ako makakakuha ng cedula?",
      answerEn:
        "Cedulas are issued at the Treasurer's Office / Provincial Treasury Department at the Capitol Building (Ground Floor, Room 105). Open Services → Cedula / Community Tax on this kiosk for guidance, or download the Cedula application form from the Download Center.",
      answerFil:
        "Ang cedula ay inilalabas sa Treasurer's Office / Provincial Treasury Department sa Capitol Building (Ground Floor, Room 105). Buksan ang Services → Cedula / Community Tax sa kiosk para sa gabay, o i-download ang form sa Download Center.",
      category: "services",
      sortOrder: 3,
    },
    {
      questionEn: "How do I apply for a building permit?",
      questionFil: "Paano mag-apply ng building permit?",
      answerEn:
        "Use Services → Building Permit on this kiosk for an overview of requirements and process. Related forms such as Building Permit Application, Zoning Clearance, and Occupancy Permit Checklist are available in the Download Center.",
      answerFil:
        "Gamitin ang Services → Building Permit sa kiosk para sa overview ng requirements at proseso. May kaugnay na forms gaya ng Building Permit Application, Zoning Clearance, at Occupancy Permit Checklist sa Download Center.",
      category: "services",
      sortOrder: 4,
    },
    {
      questionEn: "What is the Citizens' Charter and where can I read it?",
      questionFil: "Ano ang Citizens' Charter at saan ko ito mababasa?",
      answerEn:
        "The Citizens' Charter lists government services with requirements, fees, and processing times. Open the Citizens' Charter module on this kiosk, or download the Citizens' Charter Handbook from the Download Center.",
      answerFil:
        "Inililista ng Citizens' Charter ang mga serbisyo ng gobyerno kasama ang requirements, bayarin, at oras ng proseso. Buksan ang Citizens' Charter module sa kiosk, o i-download ang Citizens' Charter Handbook sa Download Center.",
      category: "services",
      sortOrder: 5,
    },
    {
      questionEn: "How do I find an office inside the Capitol Building?",
      questionFil: "Paano ako makakahanap ng opisina sa loob ng Capitol Building?",
      answerEn:
        "Open Building Directory for rooms and floors inside the Capitol, or Government Directory for provincial offices, heads, and contact numbers. You can also use Smart Search on the home screen.",
      answerFil:
        "Buksan ang Building Directory para sa mga silid at palapag sa Capitol, o ang Government Directory para sa mga provincial office, heads, at contact numbers. Magagamit din ang Smart Search sa home screen.",
      category: "kiosk",
      sortOrder: 6,
    },
    {
      questionEn: "What are Camiguin's five municipalities?",
      questionFil: "Ano ang limang munisipalidad ng Camiguin?",
      answerEn:
        "Camiguin Province has five municipalities: Mambajao (capital), Mahinog, Guinsiliban, Sagay, and Catarman. Explore them on the Map of Camiguin module.",
      answerFil:
        "Ang Lalawigan ng Camiguin ay may limang munisipalidad: Mambajao (kabisera), Mahinog, Guinsiliban, Sagay, at Catarman. Tingnan ang mga ito sa Map of Camiguin module.",
      category: "travel",
      sortOrder: 7,
    },
    {
      questionEn: "How do visitors usually arrive in Camiguin?",
      questionFil: "Paano karaniwang dumating ang mga bisita sa Camiguin?",
      answerEn:
        "Many visitors arrive via Benoni Port in Mahinog from mainland Mindanao (often via Balingoan). From Benoni, land transport continues around the island’s circumferential road. Check Tourism Information and the Map module for destinations and tips.",
      answerFil:
        "Maraming bisita ang dumadaan sa Benoni Port sa Mahinog mula sa mainland Mindanao (madalas via Balingoan). Mula Benoni, may land transport sa circumferential road ng isla. Tingnan ang Tourism Information at Map module para sa mga destinasyon at tip.",
      category: "travel",
      sortOrder: 8,
    },
    {
      questionEn: "How do I visit White Island?",
      questionFil: "Paano bisitahin ang White Island?",
      answerEn:
        "White Island is an uninhabited sandbar off Yumbing, Mambajao, with clear water and views of Mt. Hibok-Hibok. It is best visited early morning by a short boat ride from Yumbing. See Tourism Information → White Island for details.",
      answerFil:
        "Ang White Island ay isang walang naninirahang sandbar sa labas ng Yumbing, Mambajao, may malinaw na tubig at tanawin ng Mt. Hibok-Hibok. Pinakamainam bisitahin nang maaga sa umaga sakay ng maikling biyahe ng bangka mula Yumbing. Tingnan ang Tourism Information → White Island.",
      category: "tourism",
      sortOrder: 9,
    },
    {
      questionEn: "What is Katibawasan Falls known for?",
      questionFil: "Sa ano kilala ang Katibawasan Falls?",
      answerEn:
        "Katibawasan Falls in Brgy. Pandan, Mambajao is a majestic ~250-foot waterfall cascading into a cold natural pool, surrounded by ferns and orchids. Local snacks like kiping are often sold nearby. Open Tourism Information for more.",
      answerFil:
        "Ang Katibawasan Falls sa Brgy. Pandan, Mambajao ay isang ~250-talampakang talon na bumabagsak sa malamig na natural pool, napapaligiran ng pako at orchid. Madalas may lokal na meryenda gaya ng kiping sa malapit. Buksan ang Tourism Information para sa iba pang detalye.",
      category: "tourism",
      sortOrder: 10,
    },
    {
      questionEn: "What is the Sunken Cemetery?",
      questionFil: "Ano ang Sunken Cemetery?",
      answerEn:
        "In Bonbon, Catarman, a giant cross marks the community cemetery that sank beneath the sea during the 1871 eruption of Mt. Vulcan. It is known for sunsets, snorkeling, and diving. See Tourism Information → Sunken Cemetery.",
      answerFil:
        "Sa Bonbon, Catarman, may malaking krus na nagtatanda sa sementeryo na lumubog noong pagputok ng Mt. Vulcan noong 1871. Sikat ito sa sunset, snorkeling, at diving. Tingnan ang Tourism Information → Sunken Cemetery.",
      category: "tourism",
      sortOrder: 11,
    },
    {
      questionEn: "How do I get to Mantigue Island?",
      questionFil: "Paano pumunta sa Mantigue Island?",
      answerEn:
        "Mantigue Island is a small islet with white sand and a marine sanctuary off Mahinog, reached by about a 20-minute boat ride. It is great for snorkeling, picnics, and short forest walks. Details are in Tourism Information.",
      answerFil:
        "Ang Mantigue Island ay maliit na isla na may puting buhangin at marine sanctuary sa labas ng Mahinog, mga 20 minutong biyahe ng bangka. Maganda para sa snorkeling, picnic, at maikling lakad. Detalye sa Tourism Information.",
      category: "tourism",
      sortOrder: 12,
    },
    {
      questionEn: "Can I hike Mt. Hibok-Hibok?",
      questionFil: "Pwede ba akong mag-hike sa Mt. Hibok-Hibok?",
      answerEn:
        "Yes. Mt. Hibok-Hibok (1,332 m) is Camiguin’s active volcano and a popular day hike, but a guide and permit from the LGU/DENR are required. Ardent Hot Springs nearby is often enjoyed after cooler activities. See Tourism Information for guidance.",
      answerFil:
        "Oo. Ang Mt. Hibok-Hibok (1,332 m) ay aktibong bulkan ng Camiguin at popular na day hike, pero kailangan ng guide at permit mula sa LGU/DENR. Madalas din puntahan ang Ardent Hot Springs pagkatapos. Tingnan ang Tourism Information.",
      category: "tourism",
      sortOrder: 13,
    },
    {
      questionEn: "Where can I find emergency hotlines in Camiguin?",
      questionFil: "Saan ko makikita ang emergency hotlines sa Camiguin?",
      answerEn:
        "Open the Emergency Contacts module. It lists Province and municipal hotlines for emergency services, police, fire, and hospitals (including Mambajao, Mahinog, Guinsiliban, Sagay, and Catarman). For life-threatening emergencies, call local hotlines immediately.",
      answerFil:
        "Buksan ang Emergency Contacts module. Naka-lista doon ang Province at municipal hotlines para sa emergency services, pulis, bumbero, at ospital (kasama ang Mambajao, Mahinog, Guinsiliban, Sagay, at Catarman). Sa emergency na may banta sa buhay, tumawag agad sa lokal na hotline.",
      category: "emergency",
      sortOrder: 14,
    },
    {
      questionEn: "When is the Lanzones Festival?",
      questionFil: "Kailan ang Lanzones Festival?",
      answerEn:
        "The Lanzones Festival is Camiguin’s signature harvest thanksgiving, usually held in late October in Mambajao (around Oct 20–26 on this kiosk’s Events Calendar). Highlights include street dancing, the Ugmad trade fair, Mutya sa Buahanan, and lanzones celebrations. Open Events Calendar for the detailed day-by-day schedule.",
      answerFil:
        "Ang Lanzones Festival ang pangunahing harvest thanksgiving ng Camiguin, karaniwang sa huling bahagi ng Oktubre sa Mambajao (mga Okt 20–26 sa Events Calendar ng kiosk). Highlights: street dancing, Ugmad trade fair, Mutya sa Buahanan, at pagdiriwang ng lanzones. Buksan ang Events Calendar para sa detalyadong iskedyul.",
      category: "events",
      sortOrder: 15,
    },
    {
      questionEn: "What is Panaad in Camiguin?",
      questionFil: "Ano ang Panaad sa Camiguin?",
      answerEn:
        "Panaad is Camiguin’s Holy Week penitential pilgrimage along the island’s ~64-km circumferential road, often culminating at the Old Volcano Stations of the Cross in Catarman. See Events Calendar → Panaad Holy Week Pilgrimage for day details.",
      answerFil:
        "Ang Panaad ay penitential pilgrimage sa Holy Week sa ~64-km circumferential road ng Camiguin, madalas nagtatapos sa Stations of the Cross sa Old Volcano, Catarman. Tingnan ang Events Calendar → Panaad Holy Week Pilgrimage.",
      category: "events",
      sortOrder: 16,
    },
    {
      questionEn: "What other festivals does Camiguin celebrate?",
      questionFil: "Anong iba pang festival ang ipinagdiriwang sa Camiguin?",
      answerEn:
        "Besides Lanzones Festival, Camiguin celebrates Sinulog de Camiguin (January, Mambajao), San Juan Hibok-Hibokan (June 24, often at Cabuan/Agohay beaches), May Festival & Santacruzan, and seasonal events like the Christmas Festival of Lights. Browse Events Calendar for dates and schedules.",
      answerFil:
        "Bukod sa Lanzones Festival, may Sinulog de Camiguin (Enero, Mambajao), San Juan Hibok-Hibokan (Hunyo 24, madalas sa Cabuan/Agohay), May Festival & Santacruzan, at Christmas Festival of Lights. Tingnan ang Events Calendar para sa petsa at iskedyul.",
      category: "events",
      sortOrder: 17,
    },
    {
      questionEn: "Where can I download official forms and brochures?",
      questionFil: "Saan ako makakadownload ng opisyal na forms at brochure?",
      answerEn:
        "Open the Download Center for forms (business/building permits, cedula, IDs, and more), tourism brochures, disaster preparedness guides, and other public documents. You can send files by email or QR depending on the kiosk delivery options.",
      answerFil:
        "Buksan ang Download Center para sa forms (business/building permit, cedula, ID, at iba pa), tourism brochure, disaster preparedness guide, at iba pang dokumento. Maaaring i-email o i-QR ang file depende sa opsyon ng kiosk.",
      category: "kiosk",
      sortOrder: 18,
    },
    {
      questionEn: "Who is Cami on this kiosk?",
      questionFil: "Sino si Cami sa kiosk na ito?",
      answerEn:
        "Cami is the kiosk’s Camiguin assistant. Ask Cami about provincial services, tourism spots, events, emergency contacts, downloads, and other information available in this system. Cami answers only about Camiguin and this kiosk’s information.",
      answerFil:
        "Si Cami ang Camiguin assistant ng kiosk. Magtanong kay Cami tungkol sa serbisyo ng lalawigan, turismo, events, emergency contacts, downloads, at iba pang impormasyon sa system na ito. Sumasagot si Cami tungkol sa Camiguin at sa impormasyon ng kiosk lang.",
      category: "kiosk",
      sortOrder: 19,
    },
    {
      questionEn: "Where is the Provincial Tourism Office?",
      questionFil: "Saan ang Provincial Tourism Office?",
      answerEn:
        "Find the Provincial Tourism Department in the Government Directory module for head-of-office and contact details. For attractions and travel tips, open Tourism Information. For festivals and activities, open Events Calendar.",
      answerFil:
        "Hanapin ang Provincial Tourism Department sa Government Directory para sa head-of-office at contact details. Para sa atraksyon at travel tips, buksan ang Tourism Information. Para sa festival at aktibidad, buksan ang Events Calendar.",
      category: "tourism",
      sortOrder: 20,
    },
  ];

  for (const faq of faqs) {
    const existing = await prisma.faq.findFirst({ where: { questionEn: faq.questionEn } });
    if (existing) {
      await prisma.faq.update({ where: { id: existing.id }, data: faq });
    } else {
      await prisma.faq.create({ data: faq });
    }
  }

  await prisma.faq.deleteMany({
    where: { questionEn: { notIn: faqs.map((faq) => faq.questionEn) } },
  });

  const announcements = [
    {
      titleEn: "Camiguin Provincial Government Advisory on Typhoon Preparedness",
      titleFil: "Advisory ng Pamahalaang Panlalawigan ng Camiguin sa Paghahanda sa Bagyo",
      contentEn:
        "Stay informed and prepared. Read the full advisory for guidelines and safety measures to protect your family and community during severe weather conditions.",
      contentFil:
        "Manatiling may alam at handa. Basahin ang buong advisory para sa mga gabay at hakbang pangkaligtasan upang protektahan ang inyong pamilya at komunidad sa panahon ng masamang panahon.",
      category: "advisory",
      imageUrl: "/images/news/news-typhoon.png",
      isPublished: true,
      publishedAt: new Date("2026-07-01T08:00:00"),
    },
    {
      titleEn: "Free Medical Mission in Mambajao",
      titleFil: "Libreng Medical Mission sa Mambajao",
      contentEn: "Join us for a free medical check-up and consultation. Open to all residents.",
      contentFil: "Samahan kami para sa libreng medical check-up at konsultasyon. Bukas sa lahat ng residente.",
      category: "program",
      imageUrl: "/images/news/news-medical-mission.png",
      isPublished: true,
      publishedAt: new Date("2026-07-05T08:00:00"),
    },
    {
      titleEn: "Schedule of Regular Sangguniang Session",
      titleFil: "Iskedyul ng Regular na Sesyon ng Sangguniang",
      contentEn: "The Regular Session of the 10th Sangguniang Panlalawigan schedule is now posted.",
      contentFil: "Nakapaskil na ang iskedyul ng Regular na Sesyon ng ika-10 Sangguniang Panlalawigan.",
      category: "public notice",
      imageUrl: "/images/news/news-session.png",
      isPublished: true,
      publishedAt: new Date("2026-07-08T08:00:00"),
    },
    {
      titleEn: "Tourism Month Celebration 2026",
      titleFil: "Pagdiriwang ng Tourism Month 2026",
      contentEn: "Join Camiguin's Tourism Month activities celebrating the island's culture, nature, and hospitality.",
      contentFil: "Sali na sa Tourism Month activities ng Camiguin na nagdiriwang ng kultura, kalikasan, at hospitality ng isla.",
      category: "announcement",
      imageUrl: "/images/news/news-tourism.png",
      isPublished: true,
      publishedAt: new Date("2026-07-10T08:00:00"),
    },
    {
      titleEn: "Reminder: Payment of Real Property Taxes",
      titleFil: "Paalala: Pagbabayad ng Real Property Taxes",
      contentEn: "Pay your real property taxes on time to avoid penalties. Visit the Provincial Treasurer's Office for assistance.",
      contentFil: "Bayaran ang real property taxes nang nasa oras upang maiwasan ang multa. Bisitahin ang Provincial Treasurer's Office para sa tulong.",
      category: "advisory",
      imageUrl: "/images/news/news-taxes.png",
      isPublished: true,
      publishedAt: new Date("2026-07-12T08:00:00"),
    },
  ];

  for (const announcement of announcements) {
    await upsertByTitleEn(prisma.announcement, announcement);
  }

  const tourismItems = [
    { titleEn: "White Island", titleFil: "White Island", descriptionEn: "An uninhabited white sandbar with crystal-clear waters and a postcard view of Mt. Hibok-Hibok. Best visited early morning via a 10-minute boat ride from Yumbing. Perfect for swimming, snorkeling, and photos.", descriptionFil: "Isang walang naninirahang puting sandbar na may kristal na malinaw na tubig at magandang tanawin ng Mt. Hibok-Hibok. Pinakamainam bisitahin nang maaga sa umaga sakay ng bangka mula Yumbing. Perpekto para sa paglangoy, snorkeling, at pagkuha ng litrato.", location: "Off the coast of Yumbing, Mambajao", category: "beach", imageUrl: "/images/tourism/tourism-white-island.png", sortOrder: 1 },
    { titleEn: "Katibawasan Falls", titleFil: "Katibawasan Falls", descriptionEn: "A majestic 250-foot waterfall cascading into an icy-cold rock pool, surrounded by ferns and wild orchids. Don't miss the local kiping (rice wafer) snack sold nearby.", descriptionFil: "Isang marangal na 250-talampakang talon na bumabagsak sa malamig na natural na pool, napapaligiran ng mga pako at ligaw na orchid. Huwag palampasin ang lokal na kiping na ibinebenta malapit dito.", location: "Brgy. Pandan, Mambajao", category: "nature", imageUrl: "/images/tourism/tourism-katibawasan-falls.png", sortOrder: 2 },
    { titleEn: "Sunken Cemetery", titleFil: "Sunken Cemetery", descriptionEn: "A giant cross marks the community cemetery that sank beneath the sea during the 1871 eruption of Mt. Vulcan. Famous for dramatic sunsets, snorkeling over the sunken gravestones, and diving.", descriptionFil: "Isang malaking krus ang nagmamarka sa sementeryo na lumubog sa dagat noong pagputok ng Mt. Vulcan noong 1871. Sikat sa magagandang sunset, snorkeling sa ibabaw ng lumubog na mga puntod, at diving.", location: "Bonbon, Catarman", category: "heritage", imageUrl: "/images/tourism/tourism-sunken-cemetery.png", sortOrder: 3 },
    { titleEn: "Mantigue Island", titleFil: "Mantigue Island", descriptionEn: "A 4-hectare islet ringed by white sand and a marine sanctuary with vibrant corals and fish. Great for snorkeling, island picnics, and short forest walks. Reached by a 20-minute boat ride from Mahinog.", descriptionFil: "Isang 4-ektaryang isla na napapaligiran ng puting buhangin at marine sanctuary na may makukulay na corals at isda. Magaling para sa snorkeling, picnic, at maikling lakad sa gubat. Maaabot sa 20-minutong biyahe ng bangka mula Mahinog.", location: "Off the coast of Mahinog", category: "beach", imageUrl: "/images/tourism/tourism-mantigue-island.png", sortOrder: 4 },
    { titleEn: "Ardent Hot Springs", titleFil: "Ardent Hot Springs", descriptionEn: "Naturally heated pools (about 40°C) warmed by Mt. Hibok-Hibok, set in a lush forest. Best enjoyed at night or after a cold swim elsewhere. Cottages and picnic areas are available.", descriptionFil: "Mga natural na mainit na pool (mga 40°C) na pinapainit ng Mt. Hibok-Hibok, nasa gitna ng luntiang gubat. Pinakamasarap puntahan sa gabi o pagkatapos maligo sa malamig na tubig. May mga cottage at picnic area.", location: "Esperanza, Mambajao", category: "nature", imageUrl: "/images/tourism/tourism-ardent-hot-springs.png", sortOrder: 5 },
    { titleEn: "Mt. Hibok-Hibok", titleFil: "Mt. Hibok-Hibok", descriptionEn: "Camiguin's active volcano (1,332 m) and a favorite day hike with crater lake views and a panorama of the island and Bohol Sea. A guide and permit from the LGU/DENR are required for the trek.", descriptionFil: "Ang aktibong bulkan ng Camiguin (1,332 m) at paboritong day hike na may tanawin ng crater lake at ng buong isla at Bohol Sea. Kailangan ng guide at permit mula sa LGU/DENR para sa akyat.", location: "Mambajao", category: "adventure", imageUrl: "/images/tourism/tourism-mt-hibok-hibok.png", sortOrder: 6 },
    { titleEn: "Tuasan Falls", titleFil: "Tuasan Falls", descriptionEn: "A powerful 25-meter waterfall rushing through a rocky gorge into an emerald pool, now easily reachable by a scenic concrete road. Ideal for a refreshing swim away from the crowds.", descriptionFil: "Isang malakas na 25-metrong talon na dumadaloy sa mabatong bangin patungo sa berdeng pool, madali nang marating sa pamamagitan ng magandang kalsada. Perpekto para sa presko at tahimik na paliligo.", location: "Mainit, Catarman", category: "nature", imageUrl: "/images/tourism/tourism-tuasan-falls.png", sortOrder: 7 },
    { titleEn: "Sto. Niño Cold Spring", titleFil: "Sto. Niño Cold Spring", descriptionEn: "A large natural spring pool of icy, crystal-clear water over a sandy bottom with tiny fish. Surrounded by picnic huts — a favorite family stop for cooling off after touring the island.", descriptionFil: "Isang malaking natural na spring pool na may malamig at malinaw na tubig sa mabuhanging ilalim na may maliliit na isda. Napapaligiran ng picnic huts — paboritong hintuan ng pamilya para magpalamig.", location: "Compol, Catarman", category: "nature", imageUrl: "/images/tourism/tourism-sto-nino-cold-spring.png", sortOrder: 8 },
    { titleEn: "Old Guiob Church Ruins", titleFil: "Mga Guho ng Simbahan ng Guiob", descriptionEn: "Moss-covered coral-stone walls, a belfry, and a convent — remnants of a 16th-century Spanish church destroyed by the 1871 eruption. A hauntingly beautiful heritage stop shaded by century-old trees.", descriptionFil: "Mga pader ng coral na bato na balot ng lumot, kampanaryo, at kumbento — mga labi ng simbahang Espanyol noong ika-16 na siglo na nawasak ng pagputok noong 1871. Isang magandang makasaysayang hintuan sa lilim ng mga daang-taong puno.", location: "Guiob, Catarman", category: "heritage", imageUrl: "/images/tourism/tourism-guiob-church-ruins.png", sortOrder: 9 },
    { titleEn: "Walkway to the Old Volcano & Stations of the Cross", titleFil: "Walkway sa Old Volcano at Stations of the Cross", descriptionEn: "A pilgrimage trail up the slopes of Old Vulcan with 14 larger-than-life Stations of the Cross and sweeping views of the coastline. Especially busy during Holy Week's Panaad walk.", descriptionFil: "Isang pilgrimage trail paakyat sa Old Vulcan na may 14 na malalaking Stations of the Cross at magagandang tanawin ng baybayin. Pinakamataong puntahan tuwing Semana Santa sa Panaad walk.", location: "Bonbon, Catarman", category: "heritage", imageUrl: "/images/tourism/tourism-walkway-old-volcano.png", sortOrder: 10 },
    { titleEn: "Taguines Lagoon", titleFil: "Taguines Lagoon", descriptionEn: "A calm blue-green lagoon framed by rolling hills — home to the island's zipline, kayaking, aqua park, and floating restaurants. A fun adventure stop near the Benoni Port.", descriptionFil: "Isang tahimik na blue-green na lagoon na napapaligiran ng mga burol — dito matatagpuan ang zipline, kayaking, aqua park, at mga floating restaurant. Masayang adventure stop malapit sa Benoni Port.", location: "Benoni, Mahinog", category: "adventure", imageUrl: "/images/tourism/tourism-taguines-lagoon.png", sortOrder: 11 },
    { titleEn: "Kabila Giant Clam Sanctuary", titleFil: "Kabila Giant Clam Sanctuary", descriptionEn: "A conservation site at Kabila Beach caring for thousands of giant clams of several species. Snorkel over the clam gardens with a guide, or view juveniles in the hatchery tanks.", descriptionFil: "Isang conservation site sa Kabila Beach na nag-aalaga ng libu-libong giant clams ng iba't ibang species. Mag-snorkel sa ibabaw ng clam gardens kasama ang guide, o tingnan ang maliliit na clams sa hatchery.", location: "Cantaan, Guinsiliban", category: "beach", imageUrl: "/images/tourism/tourism-giant-clam-sanctuary.png", sortOrder: 12 },
    { titleEn: "Bura Soda Water Park", titleFil: "Bura Soda Water Park", descriptionEn: "Swim in the only soda water pool in the Philippines — naturally carbonated spring water believed to be good for the skin. A quirky, refreshing stop with picnic sheds and gardens.", descriptionFil: "Lumangoy sa nag-iisang soda water pool sa Pilipinas — natural na carbonated na tubig-bukal na pinaniniwalaang mabuti sa balat. Kakaiba at preskong hintuan na may picnic sheds at hardin.", location: "Bura, Catarman", category: "nature", imageUrl: "/images/tourism/tourism-bura-soda-pool.png", sortOrder: 13 },
    { titleEn: "Binangawan Falls", titleFil: "Binangawan Falls", descriptionEn: "A mystical multi-tiered waterfall over reddish volcanic rock, reached by a challenging jungle trek from Sagay. Rewarding for adventurous hikers — rainbows often form in its mist.", descriptionFil: "Isang mahiwagang talon na may ilang antas sa mapulang bato ng bulkan, mararating sa mahirap na trek mula Sagay. Sulit para sa mga mahilig sa adventure — madalas magkaroon ng bahaghari sa ambon nito.", location: "Sagay", category: "adventure", imageUrl: "/images/tourism/tourism-binangawan-falls.png", sortOrder: 14 },
  ];

  for (const item of tourismItems) {
    await upsertByTitleEn(prisma.tourism, item);
  }

  const emergencyContacts = [
    {
      nameEn: "Province Emergency Services",
      nameFil: "Province Emergency Services",
      phoneNumber: "0963 921 6616 / 0965 257 2661",
      descriptionEn: "Provincial emergency hotline",
      descriptionFil: "Provincial emergency hotline",
      category: "Province",
      sortOrder: 1,
    },
    {
      nameEn: "Province Police",
      nameFil: "Province Police",
      phoneNumber: "0998 598 6905 / 0998 598 6908",
      descriptionEn: "Provincial police hotline",
      descriptionFil: "Provincial police hotline",
      category: "Province",
      sortOrder: 2,
    },
    {
      nameEn: "Camiguin General Hospital",
      nameFil: "Camiguin General Hospital",
      phoneNumber: "0998 598 6908",
      descriptionEn: "Provincial hospital hotline",
      descriptionFil: "Provincial hospital hotline",
      category: "Province",
      sortOrder: 3,
    },
    {
      nameEn: "Province Fire Protection",
      nameFil: "Province Fire Protection",
      phoneNumber: "0997 836 1992",
      descriptionEn: "Provincial fire protection hotline",
      descriptionFil: "Provincial fire protection hotline",
      category: "Province",
      sortOrder: 4,
    },
    {
      nameEn: "Mambajao Emergency Services",
      nameFil: "Mambajao Emergency Services",
      phoneNumber: "911 (SMART/TNT) / 911+1 (GLOBE/TM)",
      descriptionEn: "Mambajao emergency hotline",
      descriptionFil: "Mambajao emergency hotline",
      category: "Mambajao",
      sortOrder: 5,
    },
    {
      nameEn: "Mambajao Police",
      nameFil: "Mambajao Police",
      phoneNumber: "0998 598 6912",
      descriptionEn: "Mambajao police hotline",
      descriptionFil: "Mambajao police hotline",
      category: "Mambajao",
      sortOrder: 6,
    },
    {
      nameEn: "Mambajao Fire Protection",
      nameFil: "Mambajao Fire Protection",
      phoneNumber: "0926 658 1035",
      descriptionEn: "Mambajao fire protection hotline",
      descriptionFil: "Mambajao fire protection hotline",
      category: "Mambajao",
      sortOrder: 7,
    },
    {
      nameEn: "Mahinog Emergency Services",
      nameFil: "Mahinog Emergency Services",
      phoneNumber: "0917 127 2524",
      descriptionEn: "Mahinog emergency hotline",
      descriptionFil: "Mahinog emergency hotline",
      category: "Mahinog",
      sortOrder: 8,
    },
    {
      nameEn: "Mahinog Police",
      nameFil: "Mahinog Police",
      phoneNumber: "0953 680 3370",
      descriptionEn: "Mahinog police hotline",
      descriptionFil: "Mahinog police hotline",
      category: "Mahinog",
      sortOrder: 9,
    },
    {
      nameEn: "Mahinog Fire Protection",
      nameFil: "Mahinog Fire Protection",
      phoneNumber: "0926 554 4132",
      descriptionEn: "Mahinog fire protection hotline",
      descriptionFil: "Mahinog fire protection hotline",
      category: "Mahinog",
      sortOrder: 10,
    },
    {
      nameEn: "Guinsiliban Emergency Services",
      nameFil: "Guinsiliban Emergency Services",
      phoneNumber: "0953 678 0806",
      descriptionEn: "Guinsiliban emergency hotline",
      descriptionFil: "Guinsiliban emergency hotline",
      category: "Guinsiliban",
      sortOrder: 11,
    },
    {
      nameEn: "Guinsiliban Police",
      nameFil: "Guinsiliban Police",
      phoneNumber: "0998 570 0439",
      descriptionEn: "Guinsiliban police hotline",
      descriptionFil: "Guinsiliban police hotline",
      category: "Guinsiliban",
      sortOrder: 12,
    },
    {
      nameEn: "Guinsiliban Fire Protection",
      nameFil: "Guinsiliban Fire Protection",
      phoneNumber: "0953 913 1959",
      descriptionEn: "Guinsiliban fire protection hotline",
      descriptionFil: "Guinsiliban fire protection hotline",
      category: "Guinsiliban",
      sortOrder: 13,
    },
    {
      nameEn: "Sagay Emergency Services",
      nameFil: "Sagay Emergency Services",
      phoneNumber: "0967 586 3454",
      descriptionEn: "Sagay emergency hotline",
      descriptionFil: "Sagay emergency hotline",
      category: "Sagay",
      sortOrder: 14,
    },
    {
      nameEn: "Sagay Police",
      nameFil: "Sagay Police",
      phoneNumber: "0998 598 6913",
      descriptionEn: "Sagay police hotline",
      descriptionFil: "Sagay police hotline",
      category: "Sagay",
      sortOrder: 15,
    },
    {
      nameEn: "Sagay Fire Protection",
      nameFil: "Sagay Fire Protection",
      phoneNumber: "0926 442 3822",
      descriptionEn: "Sagay fire protection hotline",
      descriptionFil: "Sagay fire protection hotline",
      category: "Sagay",
      sortOrder: 16,
    },
    {
      nameEn: "Catarman Emergency Services",
      nameFil: "Catarman Emergency Services",
      phoneNumber: "0975 109 4941",
      descriptionEn: "Catarman emergency hotline",
      descriptionFil: "Catarman emergency hotline",
      category: "Catarman",
      sortOrder: 17,
    },
    {
      nameEn: "Catarman Police",
      nameFil: "Catarman Police",
      phoneNumber: "0946 473 5829",
      descriptionEn: "Catarman police hotline",
      descriptionFil: "Catarman police hotline",
      category: "Catarman",
      sortOrder: 18,
    },
    {
      nameEn: "Catarman Fire Protection",
      nameFil: "Catarman Fire Protection",
      phoneNumber: "0967 665 8775",
      descriptionEn: "Catarman fire protection hotline",
      descriptionFil: "Catarman fire protection hotline",
      category: "Catarman",
      sortOrder: 19,
    },
    {
      nameEn: "Catarman District Hospital",
      nameFil: "Catarman District Hospital",
      phoneNumber: "0997 182 6413",
      descriptionEn: "Catarman district hospital hotline",
      descriptionFil: "Catarman district hospital hotline",
      category: "Catarman",
      sortOrder: 20,
    },
  ];

  for (const contact of emergencyContacts) {
    const existing = await prisma.emergencyContact.findFirst({
      where: { nameEn: contact.nameEn },
    });
    if (existing) {
      await prisma.emergencyContact.update({ where: { id: existing.id }, data: contact });
    } else {
      await prisma.emergencyContact.create({ data: contact });
    }
  }

  await prisma.emergencyContact.deleteMany({
    where: { nameEn: { notIn: emergencyContacts.map((contact) => contact.nameEn) } },
  });

  const events = [
    {
      titleEn: "Sinulog de Camiguin",
      titleFil: "Sinulog de Camiguin",
      descriptionEn:
        "Mambajao's devotion to the Santo Niño with street dancing, processions, trade fairs, and Camiguin cultural presentations.",
      descriptionFil:
        "Debosyon ng Mambajao sa Santo Niño na may street dancing, prusisyon, trade fair, at cultural presentations ng Camiguin.",
      location: "Mambajao Town Plaza",
      startDate: new Date("2026-01-18T08:00:00"),
      endDate: new Date("2026-01-18T21:00:00"),
      isActive: true,
    },
    {
      titleEn: "Camiguin Farmers Kadiwa Market Day",
      titleFil: "Araw ng Kadiwa Market ng Magsasaka ng Camiguin",
      descriptionEn:
        "Provincial Kadiwa market featuring fresh Camiguin farm produce, lanzones products, and local agri enterprises.",
      descriptionFil:
        "Kadiwa market ng lalawigan na may sariwang farm produce, produkto ng lanzones, at local agri enterprises ng Camiguin.",
      location: "Capitol Grounds, Mambajao",
      startDate: new Date("2026-02-14T07:00:00"),
      endDate: new Date("2026-02-14T16:00:00"),
      isActive: true,
    },
    {
      titleEn: "Mambajao Coastal Protection Orientation",
      titleFil: "Orientasyon sa Proteksyon ng Baybayin ng Mambajao",
      descriptionEn:
        "Community briefing on coastal protection, CLAYGO practices, and visitor guidelines for Mambajao shoreline areas.",
      descriptionFil:
        "Community briefing tungkol sa proteksyon ng baybayin, CLAYGO, at visitor guidelines sa shoreline areas ng Mambajao.",
      location: "Mambajao Tourism Booth",
      startDate: new Date("2026-03-07T09:00:00"),
      endDate: new Date("2026-03-07T12:00:00"),
      isActive: true,
    },
    {
      titleEn: "Panaad Holy Week Pilgrimage",
      titleFil: "Panaad Holy Week Pilgrimage",
      descriptionEn:
        "Annual penitential walk along Camiguin's 64-km circumferential road, culminating at the Old Volcano Stations of the Cross in Catarman.",
      descriptionFil:
        "Taunang penitential walk sa 64-km circumferential road ng Camiguin, nagtatapos sa Stations of the Cross sa Old Volcano, Catarman.",
      location: "Island Loop · Walkway to the Old Volcano, Catarman",
      startDate: new Date("2026-04-01T05:00:00"),
      endDate: new Date("2026-04-03T18:00:00"),
      isActive: true,
    },
    {
      titleEn: "Camiguin May Festival & Santacruzan",
      titleFil: "May Festival at Santacruzan ng Camiguin",
      descriptionEn:
        "Month-of-May barangay and town fiesta highlights with Santacruzan processions and Rose of May celebrations across Camiguin.",
      descriptionFil:
        "Mga highlight ng May fiesta sa barangay at bayan na may Santacruzan at Rose of May celebrations sa buong Camiguin.",
      location: "Municipal Plazas · Province-wide",
      startDate: new Date("2026-05-15T16:00:00"),
      endDate: new Date("2026-05-17T21:00:00"),
      isActive: true,
    },
    {
      titleEn: "Sto. Niño Cold Springs Family Day",
      titleFil: "Family Day sa Sto. Niño Cold Springs",
      descriptionEn:
        "Family-friendly community day at Sto. Niño Cold Springs promoting local recreation and Camiguin nature tourism.",
      descriptionFil:
        "Family-friendly community day sa Sto. Niño Cold Springs para sa lokal na libangan at nature tourism ng Camiguin.",
      location: "Sto. Niño Cold Springs, Catarman",
      startDate: new Date("2026-05-31T08:00:00"),
      endDate: new Date("2026-05-31T16:00:00"),
      isActive: true,
    },
    {
      titleEn: "San Juan Hibok-Hibokan Festival",
      titleFil: "San Juan Hibok-Hibokan Festival",
      descriptionEn:
        "Province-wide feast of St. John the Baptist with fluvial processions, water sports, and beach gatherings at Cabuan and Agohay.",
      descriptionFil:
        "Pista ng St. John the Baptist sa buong lalawigan na may fluvial procession, water sports, at beach gatherings sa Cabuan at Agohay.",
      location: "Cabuan / Agohay Beaches · Province-wide",
      startDate: new Date("2026-06-24T07:00:00"),
      endDate: new Date("2026-06-24T18:00:00"),
      isActive: true,
    },
    {
      titleEn: "Mantigue Island Marine Sanctuary Day",
      titleFil: "Araw ng Mantigue Island Marine Sanctuary",
      descriptionEn:
        "Marine awareness and snorkel-safe orientation day protecting Mantigue Island's reef and sanctuary guidelines.",
      descriptionFil:
        "Araw ng marine awareness at snorkel-safe orientation para protektahan ang reef at sanctuary guidelines ng Mantigue Island.",
      location: "Mantigue Island, Mahinog",
      startDate: new Date("2026-07-11T07:00:00"),
      endDate: new Date("2026-07-11T15:00:00"),
      isActive: true,
    },
    {
      titleEn: "Camiguin Circumferential Road Cycling Day",
      titleFil: "Araw ng Pagbibisikleta sa Circumferential Road ng Camiguin",
      descriptionEn:
        "Community cycling activity around Camiguin's scenic circumferential road, promoting fitness and island tourism.",
      descriptionFil:
        "Aktibidad sa pagbibisikleta sa scenic circumferential road ng Camiguin para sa fitness at turismo.",
      location: "Mambajao Tourism Booth · Island Loop",
      startDate: new Date("2026-08-02T06:00:00"),
      endDate: new Date("2026-08-02T11:00:00"),
      isActive: true,
    },
    {
      titleEn: "Provincial Development Council Meeting",
      titleFil: "Pagpupulong ng Provincial Development Council",
      descriptionEn:
        "Quarterly meeting on provincial programs, infrastructure updates, and local development priorities for Camiguin.",
      descriptionFil:
        "Quarterly meeting tungkol sa mga programa ng lalawigan, infrastructure, at local development priorities ng Camiguin.",
      location: "Capitol Session Hall, Mambajao",
      startDate: new Date("2026-08-15T09:00:00"),
      endDate: new Date("2026-08-15T12:00:00"),
      isActive: true,
    },
    {
      titleEn: "Katibawasan Falls Eco-Tourism Briefing",
      titleFil: "Eco-Tourism Briefing sa Katibawasan Falls",
      descriptionEn:
        "Visitor and guide briefing on trail etiquette, safety, and conservation around Katibawasan Falls.",
      descriptionFil:
        "Briefing para sa bisita at guide tungkol sa trail etiquette, kaligtasan, at conservation sa Katibawasan Falls.",
      location: "Katibawasan Falls, Mambajao",
      startDate: new Date("2026-08-29T08:00:00"),
      endDate: new Date("2026-08-29T11:00:00"),
      isActive: true,
    },
    {
      titleEn: "White Island Coastal Clean-Up",
      titleFil: "Coastal Clean-Up sa White Island",
      descriptionEn:
        "Volunteer clean-up drive protecting White Island's sandbar and surrounding marine environment.",
      descriptionFil:
        "Volunteer clean-up drive para protektahan ang sandbar ng White Island at ang kapaligirang dagat.",
      location: "White Island Barangay Dock, Mambajao",
      startDate: new Date("2026-09-06T07:00:00"),
      endDate: new Date("2026-09-06T11:00:00"),
      isActive: true,
    },
    {
      titleEn: "Catarman Heritage & Old Volcano Walk",
      titleFil: "Catarman Heritage at Old Volcano Walk",
      descriptionEn:
        "Guided heritage walk covering Catarman's Old Volcano walkway, Bonbon history, and nearby cultural landmarks.",
      descriptionFil:
        "Guided heritage walk sa Old Volcano walkway ng Catarman, kasaysayan ng Bonbon, at mga kalapit na cultural landmarks.",
      location: "Walkway to the Old Volcano, Catarman",
      startDate: new Date("2026-09-19T07:00:00"),
      endDate: new Date("2026-09-19T14:00:00"),
      isActive: true,
    },
    {
      titleEn: "Mahinog Benoni Port Tourism Welcome Day",
      titleFil: "Tourism Welcome Day sa Benoni Port, Mahinog",
      descriptionEn:
        "Welcome-day orientation for arrivals at Benoni Port with tourism info, transport tips, and island itinerary guides.",
      descriptionFil:
        "Welcome-day orientation para sa mga dumating sa Benoni Port na may tourism info, transport tips, at island itinerary guides.",
      location: "Benoni Port, Mahinog",
      startDate: new Date("2026-09-27T08:00:00"),
      endDate: new Date("2026-09-27T16:00:00"),
      isActive: true,
    },
    {
      titleEn: "Camiguin Agri-Trade and Food Fair",
      titleFil: "Camiguin Agri-Trade and Food Fair",
      descriptionEn:
        "Showcase of Camiguin farm produce, lanzones products, handicrafts, and local food enterprises.",
      descriptionFil:
        "Palabas ng farm produce, produkto ng lanzones, handicrafts, at local food enterprises ng Camiguin.",
      location: "Capitol Grounds, Mambajao",
      startDate: new Date("2026-10-03T08:00:00"),
      endDate: new Date("2026-10-05T18:00:00"),
      isActive: true,
    },
    {
      titleEn: "Lanzones Festival",
      titleFil: "Lanzones Festival",
      descriptionEn:
        "Camiguin's signature harvest festival with street dancing, Ugmad trade fair, concerts, and lanzones celebrations across Mambajao.",
      descriptionFil:
        "Pangunahing harvest festival ng Camiguin na may street dancing, Ugmad trade fair, konsiyerto, at pagdiriwang ng lanzones sa Mambajao.",
      location: "Mambajao Town Plaza & Capitol Grounds",
      startDate: new Date("2026-10-20T08:00:00"),
      endDate: new Date("2026-10-26T22:00:00"),
      isActive: true,
    },
    {
      titleEn: "Guinsiliban Cultural Community Night",
      titleFil: "Cultural Community Night ng Guinsiliban",
      descriptionEn:
        "Evening cultural program featuring Guinsiliban performers, local food stalls, and community music.",
      descriptionFil:
        "Gabi ng cultural program na may performers mula Guinsiliban, local food stalls, at community music.",
      location: "Guinsiliban Town Plaza",
      startDate: new Date("2026-10-31T17:00:00"),
      endDate: new Date("2026-10-31T21:00:00"),
      isActive: true,
    },
    {
      titleEn: "Sunken Cemetery Candle-Lighting Vigil",
      titleFil: "Candle-Lighting Vigil sa Sunken Cemetery",
      descriptionEn:
        "Respectful evening vigil and heritage remembrance at Camiguin's iconic Sunken Cemetery landmark in Catarman.",
      descriptionFil:
        "Gabi ng paggunita at heritage remembrance sa iconic Sunken Cemetery ng Camiguin sa Catarman.",
      location: "Sunken Cemetery Viewing Area, Catarman",
      startDate: new Date("2026-11-01T17:30:00"),
      endDate: new Date("2026-11-01T20:00:00"),
      isActive: true,
    },
    {
      titleEn: "Camiguin Tourism Stakeholders Forum",
      titleFil: "Camiguin Tourism Stakeholders Forum",
      descriptionEn:
        "Forum for resorts, tour operators, LGUs, and communities on sustainable tourism and visitor experience improvements.",
      descriptionFil:
        "Forum para sa resorts, tour operators, LGU, at komunidad tungkol sa sustainable tourism at mas magandang visitor experience.",
      location: "Provincial Tourism Office, Capitol Building",
      startDate: new Date("2026-11-14T09:00:00"),
      endDate: new Date("2026-11-14T16:00:00"),
      isActive: true,
    },
    {
      titleEn: "Dive Camiguin Awareness Weekend",
      titleFil: "Dive Camiguin Awareness Weekend",
      descriptionEn:
        "Dive and snorkel awareness weekend highlighting Camiguin's dive sites, reef protection, and responsible diving practices.",
      descriptionFil:
        "Dive at snorkel awareness weekend na nagha-highlight ng dive sites ng Camiguin, proteksyon ng reef, at responsible diving.",
      location: "Mambajao Dive Shops · Selected Dive Sites",
      startDate: new Date("2026-11-28T08:00:00"),
      endDate: new Date("2026-11-29T17:00:00"),
      isActive: true,
    },
    {
      titleEn: "Mount Hibok-Hibok Eco-Trail Day",
      titleFil: "Eco-Trail Day sa Mount Hibok-Hibok",
      descriptionEn:
        "Guided eco-trail orientation and responsible hiking advocacy for Camiguin's Hibok-Hibok and nearby nature sites.",
      descriptionFil:
        "Guided eco-trail orientation at responsible hiking advocacy para sa Hibok-Hibok at mga kalapit na natural sites.",
      location: "Ardent Hot Springs Area, Mambajao",
      startDate: new Date("2026-12-06T06:30:00"),
      endDate: new Date("2026-12-06T14:00:00"),
      isActive: true,
    },
    {
      titleEn: "Camiguin Christmas Festival of Lights",
      titleFil: "Camiguin Christmas Festival of Lights",
      descriptionEn:
        "Island-wide holiday lighting, community night market, and Christmas cultural presentations in Mambajao.",
      descriptionFil:
        "Holiday lighting sa isla, community night market, at Christmas cultural presentations sa Mambajao.",
      location: "Mambajao Boulevard & Town Plaza",
      startDate: new Date("2026-12-12T17:00:00"),
      endDate: new Date("2026-12-15T22:00:00"),
      isActive: true,
    },
  ];

  for (const event of events) {
    await upsertByTitleEn(prisma.event, event);
  }

  await prisma.event.deleteMany({
    where: { titleEn: { notIn: events.map((event) => event.titleEn) } },
  });

  await prisma.page.upsert({
    where: { slug: "citizens-charter" },
    update: {},
    create: {
      slug: "citizens-charter",
      titleEn: "Citizens' Charter",
      titleFil: "Citizens' Charter",
      contentEn: "The Citizens' Charter is an official document that reflects the services of a government agency including requirements, fees, and processing times.",
      contentFil: "Ang Citizens' Charter ay isang opisyal na dokumento na sumasalamin sa mga serbisyo ng isang ahensya ng pamahalaan kasama ang mga kinakailangan, bayad, at oras ng pagproseso.",
    },
  });

  console.log("Database seeded successfully!");
  const { applyBisayaContent } = await import("./apply-bisaya-content");
  await applyBisayaContent(prisma);
  console.log("Cebuano content applied.");

  const { importCitizensCharterFromStatic } = await import(
    "../features/citizens-charter/import-static"
  );
  const charterImport = await importCitizensCharterFromStatic(prisma);
  console.log(
    charterImport.skipped
      ? `Citizens' Charter already present (published=${charterImport.publishedId}, draft=${charterImport.draftId}).`
      : `Citizens' Charter imported (published=${charterImport.publishedId}, draft=${charterImport.draftId}).`
  );

  // Remove accidental duplicates from older create-only seed runs.
  await dedupeByKey(prisma.faq, "questionEn");
  await dedupeByKey(prisma.emergencyContact, "nameEn");
  await dedupeByKey(prisma.announcement, "titleEn");
  await dedupeByKey(prisma.tourism, "titleEn");
  await dedupeByKey(prisma.event, "titleEn");
  await dedupeByKey(prisma.download, "titleEn");
}

async function dedupeByKey(
  model: {
    findMany: (args: { orderBy: { createdAt: "asc" } }) => Promise<Array<{ id: string } & Record<string, unknown>>>;
    deleteMany: (args: { where: { id: { in: string[] } } }) => Promise<unknown>;
  },
  key: string
) {
  const rows = await model.findMany({ orderBy: { createdAt: "asc" } });
  const seen = new Set<string>();
  const duplicateIds: string[] = [];
  for (const row of rows) {
    const value = String(row[key] ?? "");
    if (!value) continue;
    if (seen.has(value)) duplicateIds.push(row.id);
    else seen.add(value);
  }
  if (duplicateIds.length) {
    await model.deleteMany({ where: { id: { in: duplicateIds } } });
    console.log(`Removed ${duplicateIds.length} duplicate ${key} rows.`);
  }
}

async function printSeedSummary() {
  const [homepageCards, tourism, services, downloads, announcements, events, faqs, promoEnabled, promoUrl] =
    await Promise.all([
      prisma.homepageCard.count({ where: { isActive: true } }),
      prisma.tourism.count({ where: { isActive: true } }),
      prisma.service.count({ where: { isActive: true } }),
      prisma.download.count({ where: { isActive: true } }),
      prisma.announcement.count({ where: { isPublished: true } }),
      prisma.event.count({ where: { isActive: true } }),
      prisma.faq.count({ where: { isActive: true } }),
      prisma.setting.findUnique({ where: { key: "promo_video_enabled" } }),
      prisma.setting.findUnique({ where: { key: "promo_video_url" } }),
    ]);

  const cards = await prisma.homepageCard.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { titleEn: true, href: true },
  });

  console.log("\nSeed target DB:", redactDatabaseUrl(process.env.DATABASE_URL));
  console.log("Seed counts:", {
    homepageCards,
    tourism,
    services,
    downloads,
    announcements,
    events,
    faqs,
  });
  console.log("Promo video:", {
    enabled: promoEnabled?.value ?? "(missing)",
    url: promoUrl?.value || "(empty)",
  });
  console.log(
    "Homepage cards:\n" +
      cards.map((card) => `  - ${card.titleEn} (${card.href})`).join("\n")
  );
}

main()
  .then(async () => {
    await printSeedSummary();
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
