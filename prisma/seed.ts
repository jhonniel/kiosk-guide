import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SETTING_DEFAULTS } from "../features/settings/defaults";
import { SETTING_GROUPS } from "../features/admin/settings-definitions";

const prisma = new PrismaClient();

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

  // Seed all known settings (branding, welcome, footer image, downloads, etc.)
  // so a fresh pull + db:seed restores the local kiosk experience.
  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value, group: settingGroupForKey(key) },
      create: { key, value, group: settingGroupForKey(key) },
    });
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
    { slug: "faq", titleEn: "Frequently Asked Questions", titleFil: "Mga Madalas Itanong", descriptionEn: "Quick answers to common service questions.", descriptionFil: "Mabilis na mga sagot sa karaniwang tanong tungkol sa serbisyo.", icon: "HelpCircle", iconUrl: "/images/home-icons/icon-faq.png", color: "sky", href: "/faq", sortOrder: 7 },
    { slug: "tourism", titleEn: "Tourism Information", titleFil: "Impormasyon sa Turismo", descriptionEn: "Attractions, activities, and travel tips.", descriptionFil: "Mga atraksyon, aktibidad, at mga tip sa paglalakbay.", icon: "Palmtree", iconUrl: "/images/home-icons/icon-tourism.png", color: "pink", href: "/tourism", sortOrder: 8 },
    { slug: "emergency", titleEn: "Emergency Contacts", titleFil: "Mga Contact sa Emergency", descriptionEn: "Hotlines for police, fire, health, and rescue.", descriptionFil: "Mga hotline para sa pulis, bumbero, kalusugan, at rescue.", icon: "Phone", iconUrl: "/images/home-icons/icon-emergency.png", color: "red", href: "/emergency", sortOrder: 9 },
    { slug: "events", titleEn: "Events Calendar", titleFil: "Kalendaryo ng mga Kaganapan", descriptionEn: "Upcoming festivals, meetings, and activities.", descriptionFil: "Mga paparating na festival, pagpupulong, at aktibidad.", icon: "Calendar", iconUrl: "/images/home-icons/icon-events.png", color: "violet", href: "/events", sortOrder: 10 },
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
    { type: "building", nameEn: "Governor's Office", nameFil: "Tanggapan ng Gobernador", floor: "2nd Floor", room: "201", building: "Capitol Building", contactNumber: "(088) 387-1001", sortOrder: 1 },
    { type: "building", nameEn: "Treasurer's Office", nameFil: "Tanggapan ng Ingat-Yaman", floor: "Ground Floor", room: "105", building: "Capitol Building", contactNumber: "(088) 387-1002", sortOrder: 2 },
    { type: "building", nameEn: "Business Permits Office", nameFil: "Tanggapan ng Business Permits", floor: "Ground Floor", room: "108", building: "Capitol Building", contactNumber: "(088) 387-1003", sortOrder: 3 },
    { type: "government", nameEn: "Provincial Health Office", nameFil: "Tanggapan ng Kalusugan ng Lalawigan", department: "Health", headName: "Dr. Maria Santos", contactNumber: "(088) 387-1010", email: "health@camiguin.gov.ph", sortOrder: 1 },
    { type: "government", nameEn: "Provincial Engineering Office", nameFil: "Tanggapan ng Inhinyeriya ng Lalawigan", department: "Infrastructure", headName: "Engr. Juan Dela Cruz", contactNumber: "(088) 387-1011", email: "engineering@camiguin.gov.ph", sortOrder: 2 },
    { type: "government", nameEn: "Provincial Social Welfare Office", nameFil: "Tanggapan ng Social Welfare ng Lalawigan", department: "Social Services", headName: "Ms. Ana Reyes", contactNumber: "(088) 387-1012", email: "social@camiguin.gov.ph", sortOrder: 3 },
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
    { questionEn: "What are the office hours?", questionFil: "Ano ang mga oras ng opisina?", answerEn: "Office hours are Monday to Friday, 8:00 AM to 5:00 PM.", answerFil: "Ang mga oras ng opisina ay Lunes hanggang Biyernes, 8:00 AM hanggang 5:00 PM.", category: "general", sortOrder: 1 },
    { questionEn: "How do I apply for a business permit?", questionFil: "Paano mag-apply para sa business permit?", answerEn: "Visit the Business Permits Office with required documents or use the Quick Start menu.", answerFil: "Bisitahin ang Business Permits Office na may mga kinakailangang dokumento o gamitin ang Quick Start menu.", category: "business", sortOrder: 2 },
    { questionEn: "Where can I get a cedula?", questionFil: "Saan ako makakakuha ng cedula?", answerEn: "Cedulas are issued at the Treasurer's Office at the Capitol Building.", answerFil: "Ang mga cedula ay inilalabas sa Treasurer's Office sa Capitol Building.", category: "tax", sortOrder: 3 },
  ];

  for (const faq of faqs) {
    const existing = await prisma.faq.findFirst({ where: { questionEn: faq.questionEn } });
    if (existing) {
      await prisma.faq.update({ where: { id: existing.id }, data: faq });
    } else {
      await prisma.faq.create({ data: faq });
    }
  }

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
    { nameEn: "PNP Camiguin", nameFil: "PNP Camiguin", phoneNumber: "911", descriptionEn: "Philippine National Police", descriptionFil: "Philippine National Police", category: "police", sortOrder: 1 },
    { nameEn: "BFP Camiguin", nameFil: "BFP Camiguin", phoneNumber: "(088) 387-2001", descriptionEn: "Bureau of Fire Protection", descriptionFil: "Bureau of Fire Protection", category: "fire", sortOrder: 2 },
    { nameEn: "Provincial Hospital", nameFil: "Provincial Hospital", phoneNumber: "(088) 387-3001", descriptionEn: "Camiguin Provincial Hospital", descriptionFil: "Camiguin Provincial Hospital", category: "health", sortOrder: 3 },
    { nameEn: "Coast Guard", nameFil: "Coast Guard", phoneNumber: "(088) 387-4001", descriptionEn: "Philippine Coast Guard Station", descriptionFil: "Philippine Coast Guard Station", category: "rescue", sortOrder: 4 },
  ];

  for (const contact of emergencyContacts) {
    const existing = await prisma.emergencyContact.findFirst({
      where: { nameEn: contact.nameEn, category: contact.category },
    });
    if (existing) {
      await prisma.emergencyContact.update({ where: { id: existing.id }, data: contact });
    } else {
      await prisma.emergencyContact.create({ data: contact });
    }
  }

  const events = [
    {
      titleEn: "Provincial Development Council Meeting",
      titleFil: "Pagpupulong ng Provincial Development Council",
      descriptionEn: "Monthly meeting of the Provincial Development Council.",
      descriptionFil: "Buwanang pagpupulong ng Provincial Development Council.",
      location: "Capitol Session Hall",
      startDate: new Date("2026-08-15T09:00:00"),
      endDate: new Date("2026-08-15T12:00:00"),
      isActive: true,
    },
    {
      titleEn: "Lanzones Festival",
      titleFil: "Lanzones Festival",
      descriptionEn: "Annual celebration of Camiguin's lanzones harvest.",
      descriptionFil: "Taunang pagdiriwang ng ani ng lanzones ng Camiguin.",
      location: "Mambajao Town Plaza",
      startDate: new Date("2026-10-20T08:00:00"),
      endDate: new Date("2026-10-22T22:00:00"),
      isActive: true,
    },
  ];

  for (const event of events) {
    await upsertByTitleEn(prisma.event, event);
  }

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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
